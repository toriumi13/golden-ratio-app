import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const title = "黄金比で料理を科学する：究極のレシピ帳について";
    const description = "「黄金比のレシピ帳」は、料理の美味しさを「比率」で解き明かし、誰もが再現可能な究極の一皿を追求するための研究ノートです。";

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    <style>
        body { font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; line-height: 1.8; color: #444; max-width: 850px; margin: 0 auto; padding: 40px 20px; background-color: #FAF9F6; }
        h1 { color: #3E2723; border-bottom: 3px solid #C5A059; padding-bottom: 15px; font-size: 2em; }
        h2 { color: #5D4037; margin-top: 40px; border-left: 5px solid #C5A059; padding-left: 15px; font-size: 1.5em; }
        p { margin-bottom: 20px; text-align: justify; }
        .hero { background: #FFF; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 40px; }
        .cta-button { display: inline-block; background-color: #B8860B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; margin-top: 20px; transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-2px); background-color: #997008; }
        footer { margin-top: 80px; font-size: 0.9em; color: #8C7853; border-top: 1px solid #EFEBE9; padding-top: 30px; text-align: center; }
        .highlight { color: #B8860B; font-weight: bold; }
    </style>
</head>
<body>
    <div class="hero">
        <h1>${title}</h1>
        <p style="font-size: 1.2em; color: #5D4037;">${description}</p>
        <a href="/" class="cta-button">アプリを体験する</a>
    </div>
    
    <h2>1. なぜ「比率」が重要なのか？</h2>
    <p>料理のレシピ本を見ると、多くは「大さじ1」「100g」といった絶対量で記載されています。しかし、実際に調理する場面では、素材の大きさが違ったり、作りたい人数分が違ったりすることが多々あります。ここで重要なのが、素材と調味料の<span class="highlight">「比率（黄金比）」</span>です。</p>
    <p>例えば、美味しい和食の基本である「煮物の割合」や、ドレッシングの「油と酢の比率」を知っていれば、分量がどれだけ変わっても、常に同じ「あの味」を再現することができます。私たちは、この「比率」こそが、料理のセンスを数値化し、誰もが上達できる鍵だと考えています。</p>

    <h2>2. 料理を科学し、再現性を高める</h2>
    <p>プロの料理人とアマチュアの最大の違いの一つは「再現性」にあります。勘に頼るのではなく、前回は何対何の比率で作ったのか、その結果はどうだったのかを記録し、微調整を繰り返す。このプロセスは、まさに科学実験と同じです。</p>
    <p>「黄金比のレシピ帳」は、単なるメモアプリではありません。あなたが発見した最高の比率をバージョン管理し、昨日よりも今日、今日よりも明日、より美味しい一皿を作るための<span class="highlight">「料理研究ノート」</span>として設計されています。</p>

    <h2>3. 伝統的な黄金比から、あなただけの黄金比へ</h2>
    <p>日本料理には「一・一・八（醤油・みりん・出汁）」のような伝統的な比率が存在します。しかし、現代の食材や個人の嗜好に合わせて、その比率は進化し続けています。当アプリの「ショーケース」機能では、世界中のユーザーが試行錯誤の末に辿り着いた「現代の黄金比」を共有し、学び合うことができます。</p>

    <h2>4. 究極の一皿への道のり</h2>
    <p>私たちは、すべての家庭料理が、より論理的に、より楽しくなる未来を目指しています。自分の手で調整した比率が、家族の「美味しい！」に繋がる喜び。そのプロセスを、このアプリで加速させてください。</p>

    <footer>
        <p>「黄金比のレシピ帳」開発チーム</p>
        <p>&copy; ${new Date().getFullYear()} Golden Ratio App</p>
    </footer>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(html);
}
