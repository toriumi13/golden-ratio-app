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
            // Fallback for local development or if env is not set
            admin.initializeApp({
                projectId: 'golden-raito-app',
            });
        }
    } catch (e) {
        console.error('[DEBUG-SHARE] Firebase Admin init error:', e);
    }
}

const db = admin.firestore();

// Use standard Node.js runtime for maximum stability
export const config = {
    runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG-SHARE] [${timestamp}] Handler started. URL: ${req.url}`);

    try {
        const host = (req.headers.host as string) || 'golden-ratio-app-zeta.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';

        // Debug: Log incoming headers (internally for Vercel logs)
        const userAgent = (req.headers['user-agent'] || '').toLowerCase();
        const isBot = /bot|google|crawler|spider|robot|crawling|lighthouse|rich results test|structured-data/i.test(userAgent);

        console.log(`[DEBUG-SHARE] UA: ${userAgent}, isBot: ${isBot}`);

        // Robust parameter extraction: Try req.query first, then fallback to manual URL parsing
        let recipeId = (Array.isArray(req.query.recipeId) ? req.query.recipeId[0] : req.query.recipeId) as string;
        let versionId = (Array.isArray(req.query.versionId) ? req.query.versionId[0] : req.query.versionId) as string;
        const recipeName = (Array.isArray(req.query.recipeName) ? req.query.recipeName[0] : req.query.recipeName) as string;

        // Fallback: Parse from URL if rewrites didn't populate req.query as expected
        if (!recipeId && req.url) {
            const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
            // Expected path: /r/recipeId or /r/recipeId/versionId
            if (urlParts[0] === 'r') {
                recipeId = urlParts[1];
                versionId = urlParts[2];
            }
        }

        console.log(`[DEBUG-SHARE] Parsed Params: recipeId=${recipeId}, versionId=${versionId}, recipeName=${recipeName}`);

        if (!recipeId) {
            console.log('[DEBUG-SHARE] No recipeId provided. Redirecting to home.');
            res.redirect('/');
            return;
        }

        // Fetch actual recipe data for SEO
        let ingredientsText = "";
        let versionData: any = null;
        let fetchedRecipeName = "";
        let recipeData: any = null;

        console.log(`[DEBUG-SHARE] Fetching Firestore data for recipeId: ${recipeId}`);
        try {
            // 1. Fetch Recipe document to get the correct name
            const rSnap = await db.collection('recipes').doc(recipeId).get();
            if (rSnap.exists) {
                recipeData = rSnap.data();
                fetchedRecipeName = recipeData.name;
                console.log(`[DEBUG-SHARE] Recipe found. Name: ${fetchedRecipeName}`);
            } else {
                console.log(`[DEBUG-SHARE] Recipe NOT found in Firestore. recipeId: ${recipeId}`);
            }

            // 2. Fetch Version document for ingredients and steps
            if (versionId) {
                console.log(`[DEBUG-SHARE] Fetching Version data: ${versionId}`);
                const vSnap = await db.collection('recipes').doc(recipeId).collection('versions').doc(versionId).get();
                if (vSnap.exists) {
                    versionData = vSnap.data();
                    ingredientsText = versionData.sections?.map((s: any) =>
                        s.name + ": " + s.ingredients?.map((i: any) => `${i.name}${i.quantity}${i.unit}`).join(', ')
                    ).join(' | ');
                    console.log(`[DEBUG-SHARE] Version found. Ingredients length: ${ingredientsText.length}`);
                } else {
                    console.log(`[DEBUG-SHARE] Version NOT found in Firestore. versionId: ${versionId}`);
                }
            }
        } catch (e: any) {
            console.error("[DEBUG-SHARE] Firestore error:", e.message);
        }

        const categoryName = CATEGORIES.find(c => c.id === recipeData?.category)?.name || '未分類';

        const name = recipeName || fetchedRecipeName || '黄金比レシピ';
        const description = ingredientsText
            ? `材料: ${ingredientsText.substring(0, 150)}... 黄金比をチェックして料理をアップグレードしましょう。`
            : "このレシピの調味比率をチェックして、あなたの料理をアップグレードしましょう。";

        console.log(`[DEBUG-SHARE] Final Name: ${name}`);

        const origin = `${protocol}://${host}`;
        // Pass the already fetched name to avoid redundant DB hits in og-gen (Optimization for crawlers)
        const cb = Date.now();
        
        // Determine the OGP image URL
        // We always use api/og-gen now, which handles the split layout (image + card) internally.
        const ogImageUrl = `${origin}/api/og-gen?recipeName=${encodeURIComponent(name)}&recipeId=${recipeId}&versionId=${versionId || ''}&cb=${cb}`;

        const shareUrl = versionId
            ? `${origin}/r/${recipeId}/${versionId}`
            : `${origin}/r/${recipeId}`;

        console.log(`[DEBUG-SHARE] UA: ${req.headers['user-agent']}`);
        console.log(`[DEBUG-SHARE] Optimized OG Image URL: ${ogImageUrl}`);

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
            "recipeCategory": categoryName,
            "keywords": recipeData?.tags?.join(', ') || '',
            "recipeIngredient": versionData?.sections?.flatMap((s: any) =>
                s.ingredients?.map((i: any) => `${i.name} ${i.quantity}${i.unit}`)
            ) || [],
            "recipeInstructions": versionData?.steps?.map((step: any, index: number) => ({
                "@type": "HowToStep",
                "name": `ステップ ${index + 1}`,
                "text": step.description,
                "url": `${shareUrl}#step${index + 1}`
            })) || []
        };

        const breadcrumbData = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "ホーム",
                    "item": origin
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": categoryName,
                    "item": `${origin}/showcase?category=${recipeData?.category || ''}`
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": name,
                    "item": shareUrl
                }
            ]
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
    <meta property="og:image:alt" content="${name} の黄金比カード">
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
    <script type="application/ld+json">
        ${JSON.stringify(breadcrumbData)}
    </script>

    ${!isBot ? `
    <script>
        // Only redirect human users to the App shell. Bots (like Google Rich Results Test) stay on this static SEO page.
        const p = new URLSearchParams(window.location.search);
        const r = "${recipeId || ''}";
        const v = p.get('versionId') || "${versionId || ''}";
        const n = p.get('recipeName');
        const params = new URLSearchParams();
        if (r) params.set('recipeId', r);
        if (v) params.set('versionId', v);
        if (n) params.set('recipeName', n);
        window.location.href = "/?" + params.toString();
    </script>
    ` : '<!-- Redirect skipped for bot (SEO) -->'}
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

        ${versionData?.steps ? `
        <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #F2EFE9; margin-top: 20px;">
            <h2 style="font-size: 1.2rem; margin-top: 0;">作り方</h2>
            <ol style="padding-left: 20px;">
                ${versionData.steps.map((step: any, idx: number) => `
                    <li id="step${idx + 1}" style="margin-bottom: 15px;">
                        <p style="margin: 0;">${step.description}</p>
                    </li>
                `).join('')}
            </ol>
        </div>
        ` : ''}
    </div>
    <div style="max-width: 600px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #F2EFE9; font-size: 0.9rem;">
        <h3 style="color: #8D6E63; font-size: 1rem;">他のレシピも見る</h3>
        <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;">
                <a href="${origin}/showcase?category=${recipeData?.category || ''}" style="color: #C5A059; text-decoration: none; font-weight: bold;">
                    &raquo; ${categoryName}の黄金比一覧
                </a>
            </li>
            <li>
                <a href="${origin}/showcase" style="color: #C5A059; text-decoration: none;">
                    &raquo; すべての公開レシピを見る（ショーケース）
                </a>
            </li>
        </ul>
    </div>
    <p style="margin-top: 30px; font-size: 0.8rem; color: #8D6E63; opacity: 0.7;">&copy; ${new Date().getFullYear()} Golden Ratio App</p>
</body>
</html>`;

        console.log('[DEBUG-SHARE] Sending HTML response...');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        res.setHeader('X-SEO-Bot-Detected', isBot.toString());
        res.status(200).send(html);
        console.log('[DEBUG-SHARE] Done');

    } catch (e: any) {
        console.error(`[DEBUG-SHARE] Error: ${e.message}`);
        res.status(500).send('Internal Error');
    }
}
