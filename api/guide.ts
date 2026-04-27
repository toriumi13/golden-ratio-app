import { VercelRequest, VercelResponse } from '@vercel/node';
import { COMMON_STYLES, nav, footer, getOrigin } from './_layout';

export const config = { runtime: 'nodejs' };

export default function handler(req: VercelRequest, res: VercelResponse) {
    const host = (req.headers.host as string) || 'golden-ratio-app-zeta.vercel.app';
    const origin = getOrigin(host);

    const title = "アプリの使い方ガイド | 黄金比のレシピ帳";
    const description = "黄金比のレシピ帳の使い方を詳しく解説。黄金比スケーラー、バージョン管理、ショーケース機能の活用で、いつでも理想の味を再現できます。";

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <link rel="canonical" href="${origin}/guide">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${origin}/guide">
  <meta property="og:site_name" content="黄金比のレシピ帳">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${description}",
    "author": { "@type": "Organization", "name": "Golden Ratio App" },
    "publisher": { "@type": "Organization", "name": "黄金比のレシピ帳" }
  }
  </script>
  <style>${COMMON_STYLES}
    .step-list { list-style: none; padding: 0; counter-reset: step; }
    .step-list li {
      counter-increment: step;
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      align-items: flex-start;
    }
    .step-list li::before {
      content: counter(step);
      background: #C5A059;
      color: #FFF;
      font-weight: bold;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 0.9em;
    }
    .ratio-bar { display: flex; height: 44px; border-radius: 10px; overflow: hidden; margin: 16px 0; }
    .ratio-seg { display: flex; align-items: center; justify-content: center; color: #FFF; font-size: 0.8em; font-weight: bold; padding: 0 4px; }
    .tip { background: #FFFDE7; border-left: 4px solid #F9A825; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 16px 0; color: #5D4037; }
    .faq dt { font-weight: bold; color: #4E342E; margin-top: 20px; }
    .faq dd { margin-left: 16px; color: #5D4037; }
  </style>
</head>
<body>
${nav(origin)}
<div class="container">
  <p style="font-size:0.85em;color:#BCAAA4;margin-bottom:8px;"><a href="${origin}/" style="color:#C5A059;text-decoration:none;">ホーム</a> &rsaquo; 使い方ガイド</p>
  <h1>アプリの使い方ガイド</h1>
  <p class="lead">「黄金比のレシピ帳」は、料理の調味料比率を記録・管理して、いつでも理想の味を再現するための研究ノートアプリです。このガイドでは、主要な機能を順番に解説します。</p>

  <a href="${origin}/" class="cta-btn" style="margin-bottom:40px;display:inline-block;">アプリを使ってみる</a>

  <h2>1. 黄金比（調味料の比率）とは？</h2>
  <p>料理の美味しさは、材料の「絶対量（グラム数）」ではなく、調味料同士の<strong>「比率」</strong>によって決まります。例えば、照り焼きのタレは醤油：みりん：酒＝2：2：2：1が定番の黄金比です。この比率を覚えておけば、鶏肉が200gでも400gでも、常に同じ味を再現できます。</p>
  <div class="ratio-bar">
    <div class="ratio-seg" style="flex:2;background:#5C6BC0;">醤油 2</div>
    <div class="ratio-seg" style="flex:2;background:#EF9A9A;">みりん 2</div>
    <div class="ratio-seg" style="flex:2;background:#80CBC4;">酒 2</div>
    <div class="ratio-seg" style="flex:1;background:#FFE082;color:#5D4037;">砂糖 1</div>
  </div>
  <p>「適量」「少々」を卒業し、比率で管理することで誰でも再現できる確かな味になります。料理の比率を記録・蓄積していくことで、自分だけの黄金比ライブラリが完成します。</p>

  <h2>2. レシピの作り方・使い方</h2>
  <p>アプリを開いたら、まずホーム画面の「＋」ボタンから新しいレシピを作成します。レシピには材料名と分量を入力するだけで、自動的に比率バーが表示されます。</p>
  <ul class="step-list">
    <li><div><strong>レシピ名を入力する</strong><br>例：「我が家の唐揚げ」「定番の麻婆豆腐」など、自分が分かりやすい名前をつけます。</div></li>
    <li><div><strong>材料と分量を追加する</strong><br>調味料の名前（醤油、みりん、酒など）と分量を入力します。単位は「大さじ」「ml」「g」など自由に設定できます。</div></li>
    <li><div><strong>比率バーを確認する</strong><br>入力した分量をもとに、材料間のバランスが自動でバー表示されます。視覚的に味のバランスを確認できます。</div></li>
    <li><div><strong>レシピを保存する</strong><br>保存すると、クラウドに安全に記録されます。別のデバイスからもアクセス可能です。</div></li>
  </ul>

  <h2>3. 黄金比スケーラー</h2>
  <p>「今日は材料が2人前分しかない…」「4人分作りたいけど分量は？」そんな時に使うのが<strong>黄金比スケーラー</strong>です。</p>
  <p>レシピ詳細画面でスケーラーをオンにすると、基準食材（例：鶏肉）の分量を変えるだけで、<strong>すべての調味料の分量が比率を保ったまま自動計算</strong>されます。また「人数ボタン（+/-）」で素早く全体量を調整することもできます。</p>
  <div class="tip">💡 <strong>ヒント：</strong>スケーラーを使えば「今日は鶏肉が350gしかない」という状況でも、醤油・みりん・酒の最適な分量が一瞬で分かります。</div>

  <h2>4. バージョン管理で味の進化を記録する</h2>
  <p>レシピは一度作ったら完成ではなく、食べるたびに「もう少し甘くしたい」「ニンニクを足してみよう」と改良していくものです。</p>
  <p>「黄金比のレシピ帳」では、レシピを上書きせずに<strong>「新しいバージョン」として保存</strong>できます。これにより：</p>
  <ul>
    <li>以前の比率がいつでも参照できる</li>
    <li>どのバージョンが一番美味しかったかを振り返れる</li>
    <li>改良の歴史が「研究ログ」として蓄積される</li>
  </ul>

  <h2>5. デルタ（差分）表示で変化を把握する</h2>
  <p>バージョン間の「何がどれだけ変わったか」をひと目で確認できるのが<strong>デルタ表示</strong>です。例えば「砂糖を15g→10gに減らした」「生姜を2g追加した」といった変更が、視覚的に色分けされて表示されます。</p>
  <p>「前回より甘さを抑えたはずなのに原因が分からない」という悩みがなくなり、改良の方向性を論理的に考えられるようになります。</p>

  <h2>6. ショーケースで他のユーザーのレシピを参考にする</h2>
  <p>「ショーケース」では、他のユーザーが公開している黄金比レシピを閲覧できます。いいねを押したり、自分のアプリにインポートして、そこからさらに自分好みにカスタマイズすることも可能です。</p>
  <p>→ <a href="${origin}/showcase" style="color:#C5A059;">ショーケースを見る</a></p>
  <p>また、アプリには最初から使える<strong>プリセットレシピ集</strong>が用意されています。照り焼き、唐揚げ、ハンバーグ、カルボナーラなど、定番料理の黄金比をすぐに試せます。</p>
  <p>→ <a href="${origin}/recipes" style="color:#C5A059;">プリセットレシピ一覧を見る</a></p>

  <h2>7. 黄金比を見つけるコツ</h2>
  <ul>
    <li><strong>まず1:1から始める：</strong>2種類の調味料を1:1で試し、そこから片方を0.1ずつ増減させて好みに近づけましょう。</li>
    <li><strong>メモを活用する：</strong>「少し酸味が強かった」「塩気が足りなかった」など食べた感想をメモに残すことで、次のバージョンの指針になります。</li>
    <li><strong>素材の水分を考慮する：</strong>食材から出る水分も調味料の濃度に影響します。加熱時間や食材の状態も合わせて記録すると精度が上がります。</li>
    <li><strong>プリセットをベースにする：</strong>ゼロから試行錯誤するより、実績ある黄金比を起点に微調整する方が効率的です。</li>
  </ul>

  <h2>8. よくある質問</h2>
  <dl class="faq">
    <dt>Q. データはどこに保存されますか？</dt>
    <dd>Googleのクラウドサービス（Firebase）に安全に保存されます。複数のデバイスでデータを同期できます。</dd>
    <dt>Q. オフラインでも使えますか？</dt>
    <dd>保存済みのレシピの閲覧は可能ですが、編集・保存にはインターネット接続が必要です。</dd>
    <dt>Q. アカウント登録は必須ですか？</dt>
    <dd>ショーケースの閲覧は登録不要です。レシピの保存や編集にはアカウント登録（無料）が必要です。</dd>
    <dt>Q. レシピは他のユーザーに公開されますか？</dt>
    <dd>公開・非公開はレシピごとに設定できます。デフォルトは非公開です。ショーケースへの掲載は任意で設定できます。</dd>
    <dt>Q. 無料で使えますか？</dt>
    <dd>基本機能はすべて無料でご利用いただけます。</dd>
  </dl>

  <div style="text-align:center;margin-top:48px;">
    <a href="${origin}/" class="cta-btn">さっそく黄金比を記録してみる</a>
  </div>
</div>
${footer(new Date().getFullYear())}
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(html);
}
