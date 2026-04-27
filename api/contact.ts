import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const title = "お問い合わせ | 黄金比のレシピ帳";
    const description = "「黄金比のレシピ帳」に関するお問い合わせページです。不具合報告、機能要望、その他のお問い合わせを受け付けています。";

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; background-color: #FAF9F6; text-align: center; }
        h1 { color: #3E2723; margin-bottom: 30px; }
        .contact-card { background: #FFF; padding: 40px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #EFEBE9; margin-bottom: 30px; }
        .email-address { font-size: 1.2em; color: #B8860B; font-weight: bold; margin: 20px 0; word-break: break-all; }
        .x-link { display: inline-block; background-color: #000; color: #FFF; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: bold; margin-top: 10px; }
        footer { margin-top: 60px; font-size: 0.9em; color: #BCAAA4; border-top: 1px solid #EFEBE9; padding-top: 20px; }
        .back-link { display: block; margin-bottom: 30px; color: #8C7853; text-decoration: none; }
    </style>
</head>
<body>
    <a href="/" class="back-link">&larr; アプリに戻る</a>
    <h1>${title}</h1>
    
    <div class="contact-card">
        <h2>メールでのお問い合わせ</h2>
        <p>不具合報告やビジネスに関するお問い合わせは、以下のメールアドレスまでご連絡ください。</p>
        <p class="email-address">support@example.com</p>
        <p style="font-size: 0.8em; color: #888;">※ 順次回答しておりますが、お時間をいただく場合がございます。あらかじめご了承ください。</p>
    </div>

    <div class="contact-card">
        <h2>SNSでのお問い合わせ</h2>
        <p>公式X（旧Twitter）でもフィードバックを受け付けています。</p>
        <a href="https://x.com/golden_ratioapp" target="_blank" class="x-link">公式X (@golden_ratioapp) を見る</a>
    </div>

    <footer>
        <p>&copy; ${new Date().getFullYear()} Golden Ratio App</p>
    </footer>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(html);
}
