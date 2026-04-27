import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const title = "利用規約 | 黄金比のレシピ帳";
    const description = "「黄金比のレシピ帳」の利用規約です。本アプリの利用に関するルールと諸条件を定めています。";

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
        h2 { margin-top: 30px; color: #5D4037; border-left: 4px solid #B8860B; padding-left: 10px; }
        p, li { margin-bottom: 10px; }
        ul { padding-left: 20px; }
        footer { margin-top: 50px; font-size: 0.8em; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
        .back-link { display: inline-block; margin-bottom: 20px; color: #B8860B; text-decoration: none; }
    </style>
</head>
<body>
    <a href="/" class="back-link">&larr; アプリに戻る</a>
    <h1>${title}</h1>
    <p>この利用規約（以下、「本規約」といいます。）は、「黄金比のレシピ帳」（以下、「当アプリ」といいます。）の利用条件を定めるものです。ユーザーの皆様には、本規約に従って当アプリをご利用いただきます。</p>
    
    <h2>1. 利用合意</h2>
    <p>ユーザーは、当アプリを利用することにより、本規約のすべての条項に同意したものとみなされます。</p>

    <h2>2. 禁止事項</h2>
    <p>ユーザーは、当アプリの利用にあたり、以下の行為をしてはなりません。</p>
    <ul>
        <li>法令または公序良俗に違反する行為</li>
        <li>犯罪行為に関連する行為</li>
        <li>当アプリのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
        <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
        <li>当アプリのサービス運営を妨害するおそれのある行為</li>
        <li>その他、開発者が不適切と判断する行為</li>
    </ul>

    <h2>3. サービスの提供の停止等</h2>
    <p>当アプリは、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく当アプリの全部または一部の提供を停止または中断することができるものとします。</p>
    <ul>
        <li>当アプリに係るコンピュータシステムの保守点検または更新を行う場合</li>
        <li>地震、落雷、火災、停電または天災などの不可抗力により、当アプリの提供が困難となった場合</li>
        <li>その他、当アプリの提供が困難と判断した場合</li>
    </ul>

    <h2>4. 著作権</h2>
    <p>ユーザーが当アプリを利用して作成したレシピデータの著作権は、当該ユーザーに帰属します。ただし、当アプリの「ショーケース」機能等で公に公開されたデータについては、当アプリの改善や宣伝の目的で、開発者が無償で利用できるものとします。</p>

    <h2>5. 免責事項</h2>
    <p>開発者は、当アプリに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</p>

    <h2>6. 利用規約の変更</h2>
    <p>開発者は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。</p>

    <footer>
        <p>最終更新日: 2024年3月25日</p>
        <p>&copy; ${new Date().getFullYear()} Golden Ratio App</p>
    </footer>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(html);
}
