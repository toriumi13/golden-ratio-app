import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isBot = /bot|google|crawler|spider|robot|crawling|lighthouse/i.test(userAgent);

    const title = "プライバシーポリシー | 黄金比のレシピ帳";
    const description = "黄金比のレシピ帳のプライバシーポリシーです。情報の収集、広告配信、解析ツールの利用について説明しています。";

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    
    ${!isBot ? `
    <script>
        window.location.href = "/?screen=PrivacyPolicy";
    </script>
    ` : ''}
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px;">
    <h1>${title}</h1>
    <p>${description}</p>
    
    <h2>1. 情報の収集について</h2>
    <p>当アプリ「黄金比のレシピ帳」では、サービスの向上、利用状況の分析、および広告配信のために以下の情報を収集する場合があります。</p>
    <ul>
        <li>アプリの利用履歴</li>
        <li>端末情報（OSの種類、モデル名など）</li>
        <li>広告識別子（IDFA/AAIDなど）</li>
    </ul>

    <h2>2. 広告の配信について</h2>
    <p>当アプリでは、第三者配信事業者（Google AdSense / AdMob）が提供する広告を掲載しています。これらの配信事業者は、ユーザーの興味に応じたパーソナライズ広告を表示するために、クッキー（Cookie）や広告識別子を使用することがあります。</p>
    <p>Googleによる広告設定の管理方法については、Googleの「広告設定」ページ（https://adssettings.google.com/）をご覧ください。</p>

    <h2>3. 解析ツールの利用について</h2>
    <p>当アプリでは、利用状況の分析のために Google Analytics / Firebase を利用しています。これらにより収集されるデータは統計的な情報として利用され、個人を特定するものではありません。</p>

    <h2>4. 免責事項</h2>
    <p>当アプリに掲載されている情報やレシピの利用によって生じた損害等について、開発者は一切の責任を負いません。</p>

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
