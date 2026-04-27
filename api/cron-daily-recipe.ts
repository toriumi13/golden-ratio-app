import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

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
}

async function generateRecipe(): Promise<GeneratedRecipe> {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const today = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
            role: 'user',
            content: `今日（${today}）にぴったりな、家庭料理の黄金比レシピを1つ考えてください。
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
  "steps": ["手順1", "手順2", "手順3"]
}`
        }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Claude returned invalid JSON');

    return JSON.parse(jsonMatch[0]) as GeneratedRecipe;
}

async function saveToFirestore(recipe: GeneratedRecipe): Promise<string> {
    const recipeId = crypto.randomUUID();
    const versionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const sections = recipe.sections.map(sec => ({
        id: crypto.randomUUID(),
        versionId,
        name: sec.name,
        orderIndex: 0,
        ingredients: sec.ingredients.map((ing, i) => ({
            id: crypto.randomUUID(),
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            orderIndex: i,
        })),
    }));

    const steps = recipe.steps.map((desc, i) => ({
        id: crypto.randomUUID(),
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const missingVars = ['ANTHROPIC_API_KEY', 'FIREBASE_SERVICE_ACCOUNT']
        .filter(k => !process.env[k]);

    if (missingVars.length > 0) {
        return res.status(500).json({ error: `Missing env vars: ${missingVars.join(', ')}` });
    }

    try {
        const recipe = await generateRecipe();
        const recipeId = await saveToFirestore(recipe);

        return res.status(200).json({ success: true, recipe: recipe.name, recipeId });

    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
}
