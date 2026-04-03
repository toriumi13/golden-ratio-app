import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isBot = /bot|google|crawler|spider|robot|crawling|lighthouse/i.test(userAgent);

    const title = "このサイトについて | 黄金比のレシピ帳";
    const description = "「黄金比のレシピ帳」のミッションとコンセプトについて。料理の美味しさを比率で解き明かし、究極の一皿を追求する研究ノートです。";

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    
    ${!isBot ? `
    <script>
        window.location.href = "/?screen=About";
    </script>
    ` : ''}
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; background-color: #FAF9F6;">
    <h1 style="color: #3E2723;">${title}</h1>
    <p style="font-size: 1.1em; color: #5D4037;">${description}</p>
    
    <h2 style="color: #3E2723; border-bottom: 2px solid #C5A059; padding-bottom: 8px;">1. 「黄金比」で料理を科学する</h2>
    <p>料理の美味しさには、必ず理由があります。それは、素材の組み合わせが織りなす「黄金比」です。私たちは、センスや勘に頼るのではなく、数値としての比率を記録し、改善していくプロセスこそが、料理を次のレベルへ引き上げると信じています。</p>

    <h2 style="color: #3E2723; border-bottom: 2px solid #C5A059; padding-bottom: 8px;">2. バージョン管理と進化</h2>
    <p>昨日の味と、今日の味。何が違ったのか？調味料の比率を一歩ずつ調整し、あなただけの「一生モノのレシピ」を完成させるための研究ノートとして、このアプリを開発しました。バージョンを重ねるごとに、あなたの味は進化していきます。</p>

    <h2 style="color: #3E2723; border-bottom: 2px solid #C5A059; padding-bottom: 8px;">3. 知識の共有（ショーケース）</h2>
    <p>優れた比率は、文化としての知恵です。ショーケースを通じて、他の研究者の成功事例から学び、インスピレーションを得ることができます。世界中の美味しい比率が、あなたのキッチンに届きます。</p>

    <footer style="margin-top: 60px; font-size: 0.9em; color: #8C7853; border-top: 1px solid #EFEBE9; padding-top: 20px;">
        <p>&copy; ${new Date().getFullYear()} Golden Ratio App</p>
    </footer>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(html);
}
