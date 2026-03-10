import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { CATEGORIES } from '../src/constants/categories';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        if (serviceAccount.project_id) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } else {
            // Fallback for local development
            admin.initializeApp({
                projectId: 'golden-raito-app',
            });
        }
    } catch (e) {
        console.error('[DEBUG-SHOWCASE] Firebase Admin init error:', e);
    }
}

const db = admin.firestore();

export const config = {
    runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isBot = /bot|google|crawler|spider|robot|crawling|lighthouse|rich results test|structured-data/i.test(userAgent);

    try {
        const host = (req.headers.host as string) || 'golden-ratio-app-zeta.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const origin = `${protocol}://${host}`;

        // Parse category parameter
        const categoryId = (Array.isArray(req.query.category) ? req.query.category[0] : req.query.category) as string;
        const category = CATEGORIES.find(c => c.id === categoryId);

        // Fetch public recipes for static rendering
        let recipesQuery = db.collection('recipes')
            .where("isPublic", "==", true)
            .orderBy("createdAt", "desc")
            .limit(50);

        // Apply category filter if valid
        if (categoryId) {
            recipesQuery = db.collection('recipes')
                .where("isPublic", "==", true)
                .where("category", "==", categoryId)
                .orderBy("createdAt", "desc")
                .limit(50);
        }

        const snapshot = await recipesQuery.get();
        const publicRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        let title = "黄金比のショーケース | 公開レシピ一覧";
        let description = "みんなが共有した最高の黄金比レシピが集まる場所。和食、洋食、中華など、様々なジャンルの配合をチェックしましょう。";

        if (category) {
            title = `${category.name}の黄金比レシピ一覧 | 黄金比のショーケース`;
            description = `「${category.name}」カテゴリーの公開レシピ一覧です。プロの配合から家庭の味まで、理想の比率を見つけましょう。`;
        }

        const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    <link rel="canonical" href="${origin}/showcase">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${origin}/showcase">
    <meta property="og:site_name" content="黄金比のレシピ帳">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${title}">
    
    ${!isBot ? `
    <script>
        // Humans are redirected to the SPA Showcase screen
        window.location.href = "/?screen=Showcase";
    </script>
    ` : '<!-- Bot detected: serving static content -->'}
</head>
<body style="font-family: sans-serif; background-color: #F9F7F2; color: #3E2723; padding: 20px; line-height: 1.6;">
    <header style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #C5A059;">${title}</h1>
        <p>${description}</p>
    </header>

    <main style="max-width: 800px; margin: 0 auto;">
        ${category ? `
        <div style="margin-bottom: 20px;">
            <a href="${origin}/showcase" style="color: #C5A059; text-decoration: none; font-size: 0.9rem;">&laquo; すべてのカテゴリーを見る</a>
        </div>
        ` : ''}
        <div style="display: grid; gap: 20px;">
            ${publicRecipes.map(recipe => {
            const category = CATEGORIES.find(c => c.id === recipe.category)?.name || '未分類';
            const shareUrl = `${origin}/r/${recipe.id}`;
            return `
                <article style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #F2EFE9; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h2 style="margin: 0 0 10px 0; font-size: 1.25rem;">
                        <a href="${shareUrl}" style="color: #3E2723; text-decoration: none; border-bottom: 2px solid #C5A059;">${recipe.name}</a>
                    </h2>
                    <div style="font-size: 0.9rem; color: #8D6E63;">
                        <span>カテゴリー: ${category}</span>
                        ${recipe.tags ? `<span style="margin-left: 15px;">タグ: ${recipe.tags.join(', ')}</span>` : ''}
                    </div>
                </article>
                `;
        }).join('')}
        </div>
    </main>

    <footer style="text-align: center; margin-top: 60px; color: #8D6E63; font-size: 0.9rem;">
        <p>&copy; ${new Date().getFullYear()} Golden Ratio App</p>
        <a href="/" style="color: #C5A059;">ホームへ戻る</a>
    </footer>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        res.setHeader('X-SEO-Bot-Detected', isBot.toString());
        res.status(200).send(html);

    } catch (e: any) {
        console.error(`[DEBUG-SHOWCASE] Error: ${e.message}`);
        res.status(500).send('Internal Error');
    }
}
