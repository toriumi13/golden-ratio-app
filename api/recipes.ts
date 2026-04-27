import { VercelRequest, VercelResponse } from '@vercel/node';
import { PRESET_RECIPES } from '../src/data/presets';
import { COMMON_STYLES, nav, footer, getOrigin } from './_layout';

export const config = { runtime: 'nodejs' };

const CATEGORY_COLORS: Record<string, string> = {
    '和食': '#4CAF50',
    '洋食': '#2196F3',
    '中華': '#FF5722',
    'イタリアン': '#E91E63',
    'スイーツ': '#9C27B0',
};

export default function handler(req: VercelRequest, res: VercelResponse) {
    const host = (req.headers.host as string) || 'golden-ratio-app-zeta.vercel.app';
    const origin = getOrigin(host);

    const title = "黄金比レシピ集 | 黄金比のレシピ帳";
    const description = `和食・洋食・中華・イタリアン・スイーツなど${PRESET_RECIPES.length}種類の黄金比レシピを公開中。照り焼き・唐揚げ・ハンバーグ・カルボナーラなど人気料理の黄金比率を学べます。`;

    const recipeCards = PRESET_RECIPES.map(recipe => {
        const color = CATEGORY_COLORS[recipe.category] || '#C5A059';
        const mainSection = recipe.sections[recipe.sections.length - 1];
        const ingredientCount = recipe.sections.reduce((sum, s) => sum + s.ingredients.length, 0);
        return `
    <a href="${origin}/recipes/${recipe.id}" style="text-decoration:none;color:inherit;">
      <div class="recipe-card">
        <span class="badge" style="background:${color}20;color:${color};">${recipe.category}</span>
        <h3 style="margin:8px 0;">${recipe.name}</h3>
        <p style="font-size:0.9em;color:#8D6E63;margin:0 0 12px;">${recipe.description}</p>
        <div style="display:flex;gap:12px;font-size:0.8em;color:#BCAAA4;">
          <span>🧂 材料 ${ingredientCount}種</span>
          <span>📋 手順 ${recipe.steps.length}ステップ</span>
        </div>
        <div style="margin-top:12px;color:#C5A059;font-size:0.9em;font-weight:bold;">レシピを見る →</div>
      </div>
    </a>`;
    }).join('\n');

    const categories = [...new Set(PRESET_RECIPES.map(r => r.category))];
    const categorySummary = categories.map(cat => {
        const count = PRESET_RECIPES.filter(r => r.category === cat).length;
        const color = CATEGORY_COLORS[cat] || '#C5A059';
        return `<span style="display:inline-block;background:${color}15;color:${color};padding:4px 12px;border-radius:20px;font-size:0.85em;font-weight:bold;margin:4px;">${cat} ${count}品</span>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <link rel="canonical" href="${origin}/recipes">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${origin}/recipes">
  <meta property="og:site_name" content="黄金比のレシピ帳">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "${title}",
    "description": "${description}",
    "url": "${origin}/recipes",
    "publisher": { "@type": "Organization", "name": "黄金比のレシピ帳" }
  }
  </script>
  <style>${COMMON_STYLES}
    .recipe-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 32px;
    }
    .recipe-card {
      background: #FFF;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid #F2EFE9;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .recipe-card:hover {
      box-shadow: 0 6px 20px rgba(0,0,0,0.10);
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
${nav(origin)}
<div class="container">
  <p style="font-size:0.85em;color:#BCAAA4;margin-bottom:8px;"><a href="${origin}/" style="color:#C5A059;text-decoration:none;">ホーム</a> &rsaquo; レシピ集</p>
  <h1>黄金比レシピ集</h1>
  <p class="lead">料理研究家たちが試行錯誤して辿り着いた、ジャンル別の黄金比レシピを公開しています。アプリに読み込んで、あなた好みにカスタマイズしてみてください。</p>
  <div style="margin-bottom:28px;">${categorySummary}</div>

  <p style="color:#5D4037;">「黄金比のレシピ帳」では、調味料の<strong>絶対量ではなく比率</strong>を管理します。今日の食材が200gでも400gでも、比率さえ分かれば常に同じ味が再現できます。まずは定番レシピの黄金比から学んでみましょう。</p>

  <div class="recipe-grid">
${recipeCards}
  </div>

  <div class="card" style="margin-top:40px;text-align:center;">
    <h3>あなただけの黄金比を記録しよう</h3>
    <p>これらのプリセットはあくまで出発点です。アプリでインポートして、あなた好みに調整・進化させていくことができます。バージョン管理機能で改良の歴史を記録すれば、自分だけの究極レシピが完成します。</p>
    <a href="${origin}/" class="cta-btn">アプリで使ってみる</a>
  </div>
</div>
${footer(new Date().getFullYear())}
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(html);
}
