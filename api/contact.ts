import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const title = "お問い合わせ | 黄金比のレシピ帳";
    const description = "「黄金比のレシピ帳」に関するお問い合わせページです。公式X（旧Twitter）にて、不具合報告や機能要望、各種お問い合わせを受け付けています。";

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
        .contact-card { background: #FFF; padding: 50px 40px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #EFEBE9; margin-bottom: 30px; }
        .x-handle { font-size: 1.5em; color: #000; font-weight: bold; margin: 20px 0; }
        .x-link { display: inline-block; background-color: #000; color: #FFF; padding: 16px 32px; border-radius: 40px; text-decoration: none; font-weight: bold; margin-top: 10px; transition: opacity 0.2s; }
        .x-link:hover { opacity: 0.8; }
        footer { margin-top: 60px; font-size: 0.9em; color: #BCAAA4; border-top: 1px solid #EFEBE9; padding-top: 20px; }
        .back-link { display: block; margin-bottom: 30px; color: #8C7853; text-decoration: none; }
    </style>
</head>
<body>
    <a href="/" class="back-link">&larr; アプリに戻る</a>
    <h1>${title}</h1>
    
    <div class="contact-card">
        <h2>公式X（旧Twitter）窓口</h2>
        <p>「黄金比のレシピ帳」への不具合報告、機能のご要望、その他ビジネスに関するお問い合わせは、公式Xのダイレクトメッセージ（DM）またはリプライにて承っております。</p>
        <div class="x-handle">@golden_ratioapp</div>
        <a href="https://x.com/golden_ratioapp" target="_blank" class="x-link">公式Xで問い合わせる</a>
        <p style="font-size: 0.8em; color: #888; margin-top: 25px;">※ 運用状況により回答にお時間をいただく場合がございますが、一通ずつ確認させていただいております。</p>
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
