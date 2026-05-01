import { VercelRequest, VercelResponse } from '@vercel/node';
import { COMMON_STYLES, nav, footer, getOrigin } from './_layout';

function aboutPage(): string {
    const title = "黄金比で料理を科学する：究極のレシピ帳について";
    const description = "「黄金比のレシピ帳」は、料理の美味しさを「比率」で解き明かし、誰もが再現可能な究極の一皿を追求するための研究ノートです。";
    return `<!DOCTYPE html>
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
}

function contactPage(): string {
    const title = "お問い合わせ | 黄金比のレシピ帳";
    const description = "「黄金比のレシピ帳」に関するお問い合わせページです。公式X（旧Twitter）にて、不具合報告や機能要望、各種お問い合わせを受け付けています。";
    return `<!DOCTYPE html>
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
}

function privacyPage(): string {
    const title = "プライバシーポリシー | 黄金比のレシピ帳";
    const description = "「黄金比のレシピ帳」のプライバシーポリシーです。ユーザーの個人情報の取り扱い、広告配信、および解析ツールの利用について説明しています。";
    return `<!DOCTYPE html>
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
}

function termsPage(): string {
    const title = "利用規約 | 黄金比のレシピ帳";
    const description = "「黄金比のレシピ帳」の利用規約です。本アプリの利用に関するルールと諸条件を定めています。";
    return `<!DOCTYPE html>
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
    <p>開発者は、当アプリに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。</p>
    <h2>6. 利用規約の変更</h2>
    <p>開発者は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。</p>
    <footer>
        <p>最終更新日: 2024年3月25日</p>
        <p>&copy; ${new Date().getFullYear()} Golden Ratio App</p>
    </footer>
</body>
</html>`;
}

function guidePage(origin: string): string {
    const title = "アプリの使い方ガイド | 黄金比のレシピ帳";
    const description = "黄金比のレシピ帳の使い方を詳しく解説。黄金比スケーラー、バージョン管理、ショーケース機能の活用で、いつでも理想の味を再現できます。";
    return `<!DOCTYPE html>
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
    .step-list li { counter-increment: step; display: flex; gap: 16px; margin-bottom: 20px; align-items: flex-start; }
    .step-list li::before { content: counter(step); background: #C5A059; color: #FFF; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.9em; }
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
  <p>「適量」「少々」を卒業し、比率で管理することで誰でも再現できる確かな味になります。</p>
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
  <p>レシピ詳細画面でスケーラーをオンにすると、基準食材の分量を変えるだけで、<strong>すべての調味料の分量が比率を保ったまま自動計算</strong>されます。</p>
  <div class="tip">💡 <strong>ヒント：</strong>スケーラーを使えば「今日は鶏肉が350gしかない」という状況でも、醤油・みりん・酒の最適な分量が一瞬で分かります。</div>
  <h2>4. バージョン管理で味の進化を記録する</h2>
  <p>「黄金比のレシピ帳」では、レシピを上書きせずに<strong>「新しいバージョン」として保存</strong>できます。これにより：</p>
  <ul>
    <li>以前の比率がいつでも参照できる</li>
    <li>どのバージョンが一番美味しかったかを振り返れる</li>
    <li>改良の歴史が「研究ログ」として蓄積される</li>
  </ul>
  <h2>5. デルタ（差分）表示で変化を把握する</h2>
  <p>バージョン間の「何がどれだけ変わったか」をひと目で確認できるのが<strong>デルタ表示</strong>です。「砂糖を15g→10gに減らした」「生姜を2g追加した」といった変更が視覚的に色分けされて表示されます。</p>
  <h2>6. ショーケースで他のユーザーのレシピを参考にする</h2>
  <p>「ショーケース」では、他のユーザーが公開している黄金比レシピを閲覧できます。いいねを押したり、自分のアプリにインポートしてカスタマイズすることも可能です。</p>
  <p>→ <a href="${origin}/showcase" style="color:#C5A059;">ショーケースを見る</a></p>
  <p>→ <a href="${origin}/recipes" style="color:#C5A059;">プリセットレシピ一覧を見る</a></p>
  <h2>7. よくある質問</h2>
  <dl class="faq">
    <dt>Q. データはどこに保存されますか？</dt>
    <dd>Googleのクラウドサービス（Firebase）に安全に保存されます。複数のデバイスでデータを同期できます。</dd>
    <dt>Q. アカウント登録は必須ですか？</dt>
    <dd>ショーケースの閲覧は登録不要です。レシピの保存・編集にはアカウント登録（無料）が必要です。</dd>
    <dt>Q. レシピは他のユーザーに公開されますか？</dt>
    <dd>公開・非公開はレシピごとに設定できます。デフォルトは非公開です。</dd>
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
}

export const config = { runtime: 'nodejs' };

export default function handler(req: VercelRequest, res: VercelResponse) {
    const host = (req.headers.host as string) || 'golden-ratio-app-zeta.vercel.app';
    const origin = getOrigin(host);
    const page = req.query.page as string;

    let html: string;
    switch (page) {
        case 'about':   html = aboutPage(); break;
        case 'contact': html = contactPage(); break;
        case 'privacy': html = privacyPage(); break;
        case 'terms':   html = termsPage(); break;
        case 'guide':   html = guidePage(origin); break;
        default:
            return res.status(404).send('Not found');
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(html);
}
