import { VercelRequest, VercelResponse } from '@vercel/node';

// Use standard Node.js runtime for maximum stability
export const config = {
    runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log('[DEBUG-SHARE] Node.js Handler started');
    try {
        const host = (req.headers.host as string) || 'golden-ratio-app-zeta.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const url = new URL(req.url || '/', `${protocol}://${host}`);
        const { searchParams } = url;

        const recipeId = searchParams.get('recipeId');
        const versionId = searchParams.get('versionId');
        const recipeName = searchParams.get('recipeName');
        console.log(`[DEBUG-SHARE] Params: r=${recipeId}, v=${versionId}, n=${recipeName}`);

        if (!recipeId) {
            console.log('[DEBUG-SHARE] Missing recipeId, redirecting');
            res.redirect('/');
            return;
        }

        const name = recipeName || '黄金比レシピ';
        const origin = `${protocol}://${host}`;
        const ogImageUrl = `${origin}/api/og-gen?recipeName=${encodeURIComponent(name)}`;
        const shareUrl = versionId
            ? `${origin}/api/share?recipeId=${recipeId}&versionId=${versionId}&recipeName=${encodeURIComponent(name)}`
            : `${origin}/api/share?recipeId=${recipeId}&recipeName=${encodeURIComponent(name)}`;

        console.log(`[DEBUG-SHARE] Generating HTML with ogImageUrl: ${ogImageUrl}`);

        const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>${name} | 黄金比レシピ</title>
    <!-- Standard OGP -->
    <meta property="og:title" content="${name} の黄金比を確認">
    <meta property="og:description" content="このレシピの調味比率をチェックして、あなたの料理をアップグレードしましょう。">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:site_name" content="黄金比レシピ">
    <meta property="og:locale" content="ja_JP">
    
    <!-- Twitter Specific -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@kenken__13">
    <meta name="twitter:creator" content="@kenken__13">
    <meta name="twitter:title" content="${name} の黄金比">
    <meta name="twitter:description" content="このレシピの調味比率をチェックして、あなたの料理をアップグレードしましょう。">
    <meta name="twitter:image" content="${ogImageUrl}">
    <meta name="twitter:url" content="${shareUrl}">
    <script>
        const p = new URLSearchParams(window.location.search);
        const r = p.get('recipeId');
        const v = p.get('versionId');
        const n = p.get('recipeName');
        let t = "/";
        if (r && v) t = "/?recipeId=" + r + "&versionId=" + v + (n ? "&recipeName=" + encodeURIComponent(n) : "");
        else if (r) t = "/?recipeId=" + r + (n ? "&recipeName=" + encodeURIComponent(n) : "");
        window.location.href = t;
    </script>
</head>
<body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #FDFCF0;">
    <p style="color: #6d4c41; font-weight: bold;">レシピを読み込んでいます...</p>
</body>
</html>`;

        console.log('[DEBUG-SHARE] Sending HTML response...');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        res.status(200).send(html);
        console.log('[DEBUG-SHARE] Done');

    } catch (e: any) {
        console.error(`[DEBUG-SHARE] Error: ${e.message}`);
        res.status(500).send('Internal Error');
    }
}
