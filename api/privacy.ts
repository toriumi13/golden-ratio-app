import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const title = "プライバシーポリシー | 黄金比のレシピ帳";
    const description = "「黄金比のレシピ帳」のプライバシーポリシーです。ユーザーの個人情報の取り扱い、広告配信、および解析ツールの利用について説明しています。";

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; background-color: #fff; }
        h1 { border-bottom: 2px solid #B8860B; padding-bottom: 10px; color: #4E342E; }
        h2 { margin-top: 30px; color: #5D4037; }
        p, li { margin-bottom: 10px; }
        ul { padding-left: 20px; }
        footer { margin-top: 50px; font-size: 0.8em; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
        .back-link { display: inline-block; margin-bottom: 20px; color: #B8860B; text-decoration: none; }
    </style>
</head>
<body>
    <a href="/" class="back-link">&larr; アプリに戻る</a>
    <h1>${title}</h1>
    <p>「黄金比のレシピ帳」（以下、「当アプリ」といいます）は、ユーザーの個人情報の保護を重要視し、以下の通りプライバシーポリシーを定めます。</p>
    
    <h2>1. 広告の配信について</h2>
    <p>当アプリでは、第三者配信事業者（Google AdSense / AdMob）が提供する広告を掲載しています。</p>
    <p>広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他サイトへのアクセスに関する情報「Cookie」(氏名、住所、メールアドレス、電話番号は含まれません) を使用することがあります。</p>
    <p>GoogleによるCookieを使用した広告配信を無効にする方法については、Googleの<a href="https://adssettings.google.com/authenticated" target="_blank">広告設定</a>をご覧ください。または、<a href="https://aboutads.info/" target="_blank">www.aboutads.info</a> にアクセスして、第三者配信事業者がパーソナライズ広告の掲載に使用する Cookie を無効にすることができます。</p>

    <h2>2. アクセス解析ツールについて</h2>
    <p>当アプリでは、Googleによるアクセス解析ツール「Googleアナリティクス」および「Firebase」を利用しています。これらはトラフィックデータの収集のためにCookieを使用していますが、データは匿名で収集されており、個人を特定するものではありません。</p>

    <h2>3. 収集する情報と利用目的</h2>
    <p>当アプリでは、以下の情報を収集する場合があります。</p>
    <ul>
        <li><strong>アカウント情報:</strong> メールアドレス、ログイン識別子（Firebase Authによる認証のため）。</li>
        <li><strong>レシピデータ:</strong> ユーザーが入力したレシピ名、材料、工程、および履歴データ（クラウド同期のため）。</li>
        <li><strong>診断情報:</strong> アプリの不具合修正や機能改善のためのエラーログや利用状況。</li>
    </ul>

    <h2>4. 免責事項</h2>
    <p>当アプリに掲載されているレシピや情報の利用によって生じた損害等について、開発者は一切の責任を負いません。調理の際は火傷や食中毒などに十分注意し、自己責任で行ってください。</p>

    <h2>5. プライバシーポリシーの変更</h2>
    <p>当アプリは、個人情報に関して適用される日本の法令を遵守するとともに、本ポリシーの内容を適宜見直しその改善に努めます。修正された最新のプライバシーポリシーは常に本ページにて開示されます。</p>

    <footer>
        <p>策定日: 2024年3月25日</p>
        <p>&copy; ${new Date().getFullYear()} Golden Ratio App</p>
    </footer>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(html);
}
