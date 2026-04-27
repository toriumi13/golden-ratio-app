export const COMMON_STYLES = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
    background-color: #FAF9F6;
    color: #3E2723;
    margin: 0;
    padding: 0;
    line-height: 1.8;
  }
  nav {
    background: #FFF;
    border-bottom: 2px solid #F2EFE9;
    padding: 14px 24px;
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    align-items: center;
  }
  nav .logo { font-weight: 900; color: #C5A059; font-size: 1.05em; text-decoration: none; }
  nav a { color: #5D4037; text-decoration: none; font-size: 0.9em; }
  nav a:hover { color: #C5A059; }
  .container { max-width: 860px; margin: 0 auto; padding: 40px 20px 80px; }
  h1 { font-size: 2em; font-weight: 900; color: #3E2723; margin-bottom: 12px; }
  h2 { font-size: 1.35em; font-weight: bold; color: #5D4037; margin-top: 40px; border-left: 5px solid #C5A059; padding-left: 14px; }
  h3 { font-size: 1.1em; font-weight: bold; color: #4E342E; }
  p { margin-bottom: 16px; color: #5D4037; }
  .lead { font-size: 1.1em; color: #5D4037; margin-bottom: 32px; }
  .card {
    background: #FFF;
    border-radius: 16px;
    padding: 28px;
    border: 1px solid #F2EFE9;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    margin-bottom: 20px;
  }
  .badge {
    display: inline-block;
    background: #FFF3E0;
    color: #E65100;
    font-size: 0.75em;
    font-weight: bold;
    padding: 3px 10px;
    border-radius: 20px;
    margin-bottom: 8px;
  }
  .cta-btn {
    display: inline-block;
    background: #C5A059;
    color: #FFF;
    font-weight: bold;
    padding: 14px 32px;
    border-radius: 40px;
    text-decoration: none;
    margin-top: 20px;
    transition: background 0.2s;
  }
  .cta-btn:hover { background: #A0844A; }
  footer {
    text-align: center;
    margin-top: 60px;
    padding-top: 24px;
    border-top: 1px solid #EFEBE9;
    color: #BCAAA4;
    font-size: 0.85em;
  }
  footer a { color: #C5A059; text-decoration: none; margin: 0 8px; }
`;

export function nav(origin: string): string {
    return `<nav>
  <a class="logo" href="${origin}/">🍳 黄金比のレシピ帳</a>
  <a href="${origin}/guide">使い方ガイド</a>
  <a href="${origin}/recipes">レシピ集</a>
  <a href="${origin}/showcase">ショーケース</a>
  <a href="${origin}/about">アプリについて</a>
</nav>`;
}

export function footer(year: number): string {
    return `<footer>
  <p>&copy; ${year} Golden Ratio App</p>
  <p>
    <a href="/guide">使い方ガイド</a>
    <a href="/recipes">レシピ集</a>
    <a href="/privacy">プライバシーポリシー</a>
    <a href="/terms">利用規約</a>
    <a href="/contact">お問い合わせ</a>
  </p>
</footer>`;
}

export function getOrigin(host: string): string {
    return `${host.includes('localhost') ? 'http' : 'https'}://${host}`;
}
