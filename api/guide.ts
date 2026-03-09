import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    runtime: 'nodejs',
};

export default function handler(req: VercelRequest, res: VercelResponse) {
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isBot = /bot|google|crawler|spider|robot|crawling|lighthouse|rich results test|structured-data/i.test(userAgent);

    try {
        const host = (req.headers.host as string) || 'golden-ratio-app-zeta.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const origin = `${protocol}://${host}`;

        const title = "アプリの使い方ガイド | 黄金比のレシピ帳";
        const description = "黄金比のレシピ帳アプリの使い方をご紹介します。レシピの黄金比とは何か、バージョン管理やショーケースの活用法をわかりやすく解説しています。";

        const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    <link rel="canonical" href="${origin}/guide">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${origin}/guide">
    <meta property="og:site_name" content="黄金比のレシピ帳">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${title}",
      "description": "${description}",
      "author": {
        "@type": "Organization",
        "name": "Golden Ratio App"
      }
    }
    </script>
    
    ${!isBot ? `
    <script>
        // Humans are redirected to the SPA Guide screen
        window.location.href = "/?screen=Guide";
    </script>
    ` : '<!-- Bot detected: serving static content -->'}
</head>
<body style="font-family: sans-serif; background-color: #F9F7F2; color: #3E2723; padding: 20px; line-height: 1.6;">
    <header style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #C5A059;">${title}</h1>
        <p>${description}</p>
    </header>

    <main style="max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 12px; border: 1px solid #F2EFE9; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2>黄金比のレシピ帳とは？</h2>
        <p>「最高のレシピ」ができるたび、分量を忘れてしまったり、人数が変わると味がブレたりした経験はありませんか？</p>
        <p>このアプリは、料理の心臓部である「調味料の比率（黄金比）」を記録し、常に完璧な味を再現するためのツールです。</p>

        <h2>黄金比スケーラー</h2>
        <p>レシピ詳細画面の「スケーラー」を開き、基準にしたい材料（例：醤油など）や人数を入力すると、その他のすべての材料の分量が「比率を維持したまま」自動計算されます。</p>

        <h2>「バージョンの記録（進化）」とは？</h2>
        <p>「もっと甘い方がいいかも」「ニンニクを足してみよう」。レシピは常に進化します。<br/>過去のレシピを上書きせず、バージョン履歴として保存することで、味の変化を記録できます。</p>
        
        <h2>ショーケース（みんなのレシピ）</h2>
        <p>ショーケース（公開レシピ一覧）では、他のユーザーが研究した最高の「黄金比」を閲覧できます。<br/>気に入ったものは「いいね」したり、自分のアプリに「インポート（コピー）」して、そこからさらに自分好みに進化させることができます。</p>
    </main>

    <footer style="text-align: center; margin-top: 60px; color: #8D6E63; font-size: 0.9rem;">
        <p>&copy; ${new Date().getFullYear()} Golden Ratio App</p>
        <a href="/" style="color: #C5A059;">ホームへ戻る</a>
    </footer>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
        res.setHeader('X-SEO-Bot-Detected', isBot.toString());
        res.status(200).send(html);

    } catch (e: any) {
        console.error(`[DEBUG-GUIDE] Error: ${e.message}`);
        res.status(500).send('Internal Error');
    }
}
