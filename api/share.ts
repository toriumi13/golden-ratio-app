import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/store/firebase';

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

        // Fetch actual recipe data for SEO
        let ingredientsText = "";
        let versionData = null;
        let fetchedRecipeName = "";

        try {
            const { doc, getDoc } = require('firebase/firestore');

            // 1. Fetch Recipe document to get the correct name
            const rRef = doc(db, 'recipes', recipeId);
            const rSnap = await getDoc(rRef);
            if (rSnap.exists()) {
                fetchedRecipeName = rSnap.data().name;
            }

            // 2. Fetch Version document for ingredients
            if (versionId) {
                const vRef = doc(db, 'recipes', recipeId, 'versions', versionId);
                const vSnap = await getDoc(vRef);
                if (vSnap.exists()) {
                    versionData = vSnap.data();
                    ingredientsText = versionData.sections?.map((s: any) =>
                        s.name + ": " + s.ingredients?.map((i: any) => `${i.name}${i.quantity}${i.unit}`).join(', ')
                    ).join(' | ');
                }
            }
        } catch (e) {
            console.error("Error fetching recipe/version for SEO", e);
        }

        const name = recipeName || fetchedRecipeName || '黄金比レシピ';
        const description = ingredientsText
            ? `材料: ${ingredientsText.substring(0, 150)}... 黄金比をチェックして料理をアップグレードしましょう。`
            : "このレシピの調味比率をチェックして、あなたの料理をアップグレードしましょう。";

        const origin = `${protocol}://${host}`;
        const ogImageUrl = `${origin}/api/og-gen?recipeName=${encodeURIComponent(name)}`;
        const shareUrl = versionId
            ? `${origin}/r/${recipeId}/${versionId}`
            : `${origin}/r/${recipeId}`;

        // Structured Data (JSON-LD) for Recipe
        const structuredData = {
            "@context": "https://schema.org/",
            "@type": "Recipe",
            "name": name,
            "description": description,
            "image": [ogImageUrl],
            "author": {
                "@type": "Organization",
                "name": "Golden Ratio App"
            },
            "recipeIngredient": versionData?.sections?.flatMap((s: any) =>
                s.ingredients?.map((i: any) => `${i.name} ${i.quantity}${i.unit}`)
            ) || []
        };

        console.log(`[DEBUG-SHARE] Generating HTML with SEO content`);

        const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>${name} | 黄金比のレシピ帳</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="canonical" href="${shareUrl}">
    
    <!-- Standard Meta -->
    <meta name="description" content="${description}">
    <meta name="keywords" content="${name},レシピ,黄金比,比率,調味料,料理,cooking,recipe">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:title" content="${name} の黄金比を確認">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:site_name" content="黄金比のレシピ帳">
    <meta property="og:locale" content="ja_JP">
    
    <!-- Twitter Specific -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${name} の黄金比">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImageUrl}">
    <meta name="twitter:url" content="${shareUrl}">

    <!-- Structured Data -->
    <script type="application/ld+json">
        ${JSON.stringify(structuredData)}
    </script>

    <script>
        const p = new URLSearchParams(window.location.search);
        const r = "${recipeId}";
        const v = p.get('versionId');
        const n = p.get('recipeName');
        const params = new URLSearchParams();
        if (r) params.set('recipeId', r);
        if (v) params.set('versionId', v);
        if (n) params.set('recipeName', n);
        window.location.href = "/?" + params.toString();
    </script>
</head>
<body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #F9F7F2; padding: 20px; color: #3E2723;">
    <h1 style="color: #C5A059;">${name}</h1>
    <div style="max-width: 600px; line-height: 1.6;">
        <p>${description}</p>
        ${versionData ? `
        <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #F2EFE9;">
            <h2 style="font-size: 1.2rem; margin-top: 0;">材料リスト</h2>
            <ul>
                ${versionData.sections?.map((s: any) => `
                    <li><strong>${s.name}</strong>
                        <ul>
                            ${s.ingredients?.map((i: any) => `<li>${i.name}: ${i.quantity}${i.unit}</li>`).join('')}
                        </ul>
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}
    </div>
    <p style="margin-top: 30px; font-size: 0.9rem; color: #8D6E63;">アプリを読み込んでいます...</p>
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
