import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isBot = /bot|google|crawler|spider|robot|crawling|lighthouse/i.test(userAgent);

    const title = "利用規約 | 黄金比のレシピ帳";
    const description = "黄金比のレシピ帳の利用規約です。サービスの提供目的、禁止事項、著作権、免責事項について定めています。";

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    
    ${!isBot ? `
    <script>
        window.location.href = "/?screen=TermsOfService";
    </script>
    ` : ''}
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px;">
    <h1>${title}</h1>
    <p>${description}</p>
    
    <h2>1. はじめに</h2>
    <p>本利用規約は、当アプリ「黄金比のレシピ帳」の利用者と開発者の間の義務関係を定めるものです。本アプリを利用することで、本規約に同意したものとみなされます。</p>

    <h2>2. サービスの提供目的</h2>
    <p>本アプリは、ユーザーが料理のレシピや調味料の比率を記録・管理することを目的としたツールです。</p>

    <h2>3. 禁止事項</h2>
    <p>ユーザーは、以下の行為を行ってはなりません。</p>
    <ul>
        <li>公序良俗に反する内容の投稿</li>
        <li>他者の著作権や知的財産権を侵害する行為</li>
        <li>サーバーに過度な負荷をかける行為</li>
        <li>その他、開発者が不適切と判断する行為</li>
    </ul>

    <h2>4. 著作権について</h2>
    <p>ユーザーが本アプリに投稿したレシピや画像の著作権は、原則として投稿したユーザーに帰属します。ただし、ショーケースに公開されたコンテンツについては、本アプリのプロモーション目的で開発者が無償で引用・利用できるものとします。</p>

    <h2>5. サービスの変更・停止</h2>
    <p>開発者は、予告なく本アプリの内容を変更、または提供を停止・終了することができるものとします。</p>

    <h2>6. 免責事項</h2>
    <p>本アプリは、現状有姿で提供されるものであり、情報の正確性や有用性を保証するものではありません。本アプリの利用に関して発生したいかなる損害についても、開発者は責任を負いかねます。</p>

    <footer style="margin-top: 40px; font-size: 0.8em; color: #666;">
        <p>策定日: 2024年3月25日</p>
        <p>&copy; ${new Date().getFullYear()} Golden Ratio App</p>
    </footer>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(html);
}
