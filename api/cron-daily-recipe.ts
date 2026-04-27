import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';
import { TwitterApi } from 'twitter-api-v2';
import { v4 as uuidv4 } from 'uuid';

if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        if (serviceAccount.project_id) {
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        } else {
            admin.initializeApp({ projectId: 'golden-raito-app' });
        }
    } catch (e) {
        console.error('[CRON] Firebase init error:', e);
    }
}

const db = admin.firestore();

// カテゴリIDと表示名の対応
const CATEGORY_MAP: Record<string, string> = {
    japanese: '和食',
    western: '洋食',
    chinese: '中華',
    italian: 'イタリアン・フレンチ',
    sweets: 'スイーツ・パン',
    drinks: 'ドリンク',
    others: 'その他',
};

interface GeneratedRecipe {
    name: string;
    description: string;
    category: string;
    baseServings: number;
    sections: {
        name: string;
        ingredients: { name: string; quantity: number; unit: string }[];
    }[];
    steps: string[];
    tweetRatioLabel: string;  // ツイート用の比率説明（例: "タレの黄金比"）
    tweetRatioText: string;   // ツイート用の比率テキスト（例: "醤油2:みりん2:酒1"）
}

async function generateRecipe(): Promise<GeneratedRecipe> {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const today = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
            role: 'user',
            content: `今日（${today}）にSNSで紹介するのにぴったりな、家庭料理の黄金比レシピを1つ考えてください。
季節感や話題性があるとなお良いです。

以下のJSON形式で返してください。JSON以外のテキストは不要です。

{
  "name": "レシピ名（例：鶏の照り焼き）",
  "description": "一行説明（例：醤油2:みりん2:酒1の不動の比率。）",
  "category": "japanese|western|chinese|italian|sweets|drinks|others のいずれか",
  "baseServings": 2,
  "sections": [
    {
      "name": "セクション名（例：タレ、マリネ液、ソース等）",
      "ingredients": [
        { "name": "材料名", "quantity": 2, "unit": "大さじ" }
      ]
    }
  ],
  "steps": ["手順1", "手順2", "手順3"],
  "tweetRatioLabel": "ツイートで強調するセクション名（例：タレの黄金比）",
  "tweetRatioText": "ツイート用の比率テキスト（例：醤油2：みりん2：酒1）"
}`
        }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Claude returned invalid JSON');

    return JSON.parse(jsonMatch[0]) as GeneratedRecipe;
}

async function saveToFirestore(recipe: GeneratedRecipe): Promise<string> {
    const recipeId = uuidv4();
    const versionId = uuidv4();
    const now = new Date().toISOString();

    const sections = recipe.sections.map(sec => ({
        id: uuidv4(),
        versionId,
        name: sec.name,
        orderIndex: 0,
        ingredients: sec.ingredients.map((ing, i) => ({
            id: uuidv4(),
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            orderIndex: i,
        })),
    }));

    const steps = recipe.steps.map((desc, i) => ({
        id: uuidv4(),
        versionId,
        description: desc,
        orderIndex: i,
    }));

    const recipeRef = db.collection('recipes').doc(recipeId);
    const versionRef = recipeRef.collection('versions').doc(versionId);

    await recipeRef.set({
        id: recipeId,
        userId: 'daily-recipe-bot',
        name: recipe.name,
        description: recipe.description,
        category: recipe.category,
        originRecipeId: null,
        createdAt: now,
        isPublic: true,
        currentVersionId: versionId,
        latestVersionNumber: '1.0',
        latestVersionDate: now,
        tags: ['daily', 'bot'],
        likeCount: 0,
    });

    await versionRef.set({
        id: versionId,
        recipeId,
        versionNumber: '1.0',
        createdAt: now,
        isPublic: true,
        baseServings: recipe.baseServings || 2,
        sections,
        steps,
    });

    return recipeId;
}

async function postToX(recipe: GeneratedRecipe, recipeId: string): Promise<void> {
    const client = new TwitterApi({
        appKey: process.env.X_API_KEY!,
        appSecret: process.env.X_API_SECRET!,
        accessToken: process.env.X_ACCESS_TOKEN!,
        accessSecret: process.env.X_ACCESS_TOKEN_SECRET!,
    });

    const categoryLabel = CATEGORY_MAP[recipe.category] || recipe.category;
    const showcaseUrl = `https://golden-ratio-app-zeta.vercel.app/showcase`;

    const tweet = `🍳 本日の黄金比レシピ

「${recipe.name}」（${categoryLabel}）

${recipe.tweetRatioLabel}：
${recipe.tweetRatioText}

${recipe.description}

比率を記録して自分だけのレシピに📝
${showcaseUrl}

#料理 #黄金比 #レシピ #自炊`;

    await client.v2.tweet(tweet);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Vercel CronはAuthorizationヘッダーにCRON_SECRETを付与して呼び出す
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('[CRON] Starting daily recipe generation...');

        const recipe = await generateRecipe();
        console.log(`[CRON] Generated recipe: ${recipe.name}`);

        const recipeId = await saveToFirestore(recipe);
        console.log(`[CRON] Saved to Firestore: ${recipeId}`);

        await postToX(recipe, recipeId);
        console.log('[CRON] Posted to X');

        return res.status(200).json({
            success: true,
            recipe: recipe.name,
            recipeId,
        });

    } catch (e: any) {
        console.error('[CRON] Error:', e.message);
        return res.status(500).json({ error: e.message });
    }
}
