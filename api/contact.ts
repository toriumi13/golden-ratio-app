import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isBot = /bot|google|crawler|spider|robot|crawling|lighthouse/i.test(userAgent);

    const title = "お問い合わせ | 黄金比のレシピ帳";
    const description = "「黄金比のレシピ帳」に関するお問い合わせはこちらから。公式X(@golden_ratioapp)にて受け付けています。";

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    
    ${!isBot ? `
    <script>
        window.location.href = "/?screen=Contact";
    </script>
    ` : ''}
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; background-color: #FAF9F6; text-align: center;">
    <h1 style="color: #3E2723;">${title}</h1>
    <p style="font-size: 1.1em; color: #5D4037; margin-bottom: 40px;">${description}</p>
    
    <div style="background-color: #FFF; padding: 40px; border-radius: 20px; border: 1px solid #EFEBE9; display: inline-block;">
        <h2 style="color: #3E2723; margin-top: 0;">公式Xでご連絡ください</h2>
        <p style="color: #8C7853;">最新情報の確認や、個別のフィードバックは公式Xにて承っております。</p>
        <a href="https://x.com/golden_ratioapp" style="display: inline-block; background-color: #1DA1F2; color: #FFF; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: bold; margin-top: 20px;">
            @golden_ratioapp を見る
        </a>
    </div>

    <footer style="margin-top: 60px; font-size: 0.9em; color: #BCAAA4; border-top: 1px solid #EFEBE9; padding-top: 20px;">
        <p>&copy; ${new Date().getFullYear()} Golden Ratio App</p>
    </footer>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(html);
}
