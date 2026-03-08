import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/store/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { CATEGORIES } from '../src/constants/categories';

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

        // Fetch public recipes for static rendering
        const recipesCol = collection(db, 'recipes');
        const q = query(
            recipesCol,
            where("isPublic", "==", true),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        const snapshot = await getDocs(q);
        const publicRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        const title = "黄金比のショーケース | 公開レシピ一覧";
        const description = "みんなが共有した最高の黄金比レシピが集まる場所。和食、洋食、中華など、様々なジャンルの配合をチェックしましょう。";

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
