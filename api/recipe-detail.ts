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

    const id = (Array.isArray(req.query.id) ? req.query.id[0] : req.query.id) as string;
    const recipe = PRESET_RECIPES.find(r => r.id === id);

    if (!recipe) {
        res.status(404).send('レシピが見つかりません');
        return;
    }

    const title = `${recipe.name}の黄金比レシピ | 黄金比のレシピ帳`;
    const description = `${recipe.name}の黄金比レシピ。${recipe.description}材料${recipe.sections.reduce((s, sec) => s + sec.ingredients.length, 0)}種、${recipe.steps.length}ステップで作れます。`;

    const categoryColor = CATEGORY_COLORS[recipe.category] || '#C5A059';

    const sectionsHtml = recipe.sections.map(section => {
        const total = section.ingredients.reduce((sum, ing) => sum + (ing.quantity || 0), 0);
        const ingredientRows = section.ingredients.map(ing => {
            const ratio = total > 0 && ing.quantity > 0 ? (ing.quantity / total * 100).toFixed(0) : null;
            return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F2EFE9;font-weight:500;">${ing.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F2EFE9;text-align:right;color:#5D4037;">
          ${ing.quantity > 0 ? `${ing.quantity} ${ing.unit}` : ing.unit}
        </td>
        ${ratio ? `<td style="padding:10px 12px;border-bottom:1px solid #F2EFE9;text-align:right;">
          <div style="background:#F5F5F5;border-radius:4px;height:8px;width:80px;display:inline-block;vertical-align:middle;overflow:hidden;">
            <div style="background:#C5A059;height:100%;width:${ratio}%;"></div>
          </div>
        </td>` : '<td></td>'}
      </tr>`;
        }).join('');

        return `
    <h3 style="margin-top:28px;">${section.name}</h3>
    <table style="width:100%;border-collapse:collapse;background:#FFF;border-radius:12px;overflow:hidden;border:1px solid #F2EFE9;">
      <thead>
        <tr style="background:#FBF9F5;">
          <th style="padding:10px 12px;text-align:left;font-size:0.85em;color:#8D6E63;border-bottom:2px solid #F2EFE9;">材料</th>
          <th style="padding:10px 12px;text-align:right;font-size:0.85em;color:#8D6E63;border-bottom:2px solid #F2EFE9;">分量</th>
          <th style="padding:10px 12px;text-align:right;font-size:0.85em;color:#8D6E63;border-bottom:2px solid #F2EFE9;">比率</th>
        </tr>
      </thead>
      <tbody>${ingredientRows}</tbody>
    </table>`;
    }).join('');

    const stepsHtml = recipe.steps.map((step, i) => `
    <li style="display:flex;gap:16px;margin-bottom:20px;align-items:flex-start;">
      <span style="background:#C5A059;color:#FFF;font-weight:bold;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.9em;">${i + 1}</span>
      <p style="margin:4px 0 0;">${step}</p>
    </li>`).join('');

    const otherRecipes = PRESET_RECIPES
        .filter(r => r.id !== recipe.id)
        .slice(0, 4)
        .map(r => `<a href="${origin}/recipes/${r.id}" style="text-decoration:none;color:inherit;">
      <div style="background:#FFF;border-radius:12px;padding:16px;border:1px solid #F2EFE9;transition:box-shadow 0.2s;">
        <span style="font-size:0.75em;color:${CATEGORY_COLORS[r.category] || '#C5A059'};font-weight:bold;">${r.category}</span>
        <p style="font-weight:bold;margin:6px 0 4px;color:#3E2723;">${r.name}</p>
        <p style="font-size:0.85em;color:#8D6E63;margin:0;">${r.description}</p>
      </div>
    </a>`).join('');

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <link rel="canonical" href="${origin}/recipes/${recipe.id}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${origin}/recipes/${recipe.id}">
  <meta property="og:site_name" content="黄金比のレシピ帳">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": "${recipe.name}",
    "description": "${recipe.description}",
    "recipeCategory": "${recipe.category}",
    "recipeYield": "${recipe.baseServings ? recipe.baseServings + '人前' : '適量'}",
    "recipeInstructions": [
      ${recipe.steps.map((s, i) => `{"@type":"HowToStep","position":${i + 1},"text":"${s.replace(/"/g, '\\"')}"}`).join(',\n      ')}
    ],
    "publisher": { "@type": "Organization", "name": "黄金比のレシピ帳" }
  }
  </script>
  <style>${COMMON_STYLES}</style>
</head>
<body>
${nav(origin)}
<div class="container">
  <p style="font-size:0.85em;color:#BCAAA4;margin-bottom:8px;">
    <a href="${origin}/" style="color:#C5A059;text-decoration:none;">ホーム</a> &rsaquo;
    <a href="${origin}/recipes" style="color:#C5A059;text-decoration:none;">レシピ集</a> &rsaquo;
    ${recipe.name}
  </p>

  <span class="badge" style="background:${categoryColor}20;color:${categoryColor};">${recipe.category}</span>
  <h1 style="margin-top:8px;">${recipe.name}</h1>
  <p class="lead">${recipe.description}</p>

  <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:32px;">
    <span style="background:#FFF;border:1px solid #F2EFE9;border-radius:8px;padding:8px 16px;font-size:0.85em;">
      🧂 材料 ${recipe.sections.reduce((s, sec) => s + sec.ingredients.length, 0)}種
    </span>
    <span style="background:#FFF;border:1px solid #F2EFE9;border-radius:8px;padding:8px 16px;font-size:0.85em;">
      📋 手順 ${recipe.steps.length}ステップ
    </span>
    ${recipe.baseServings ? `<span style="background:#FFF;border:1px solid #F2EFE9;border-radius:8px;padding:8px 16px;font-size:0.85em;">👥 ${recipe.baseServings}人前</span>` : ''}
  </div>

  <h2>材料と黄金比</h2>
  <p>下の表の「比率」列は、同じセクション内での調味料の割合を示しています。この比率を維持すれば、分量を何倍にしても同じ味を再現できます。</p>
  ${sectionsHtml}

  <h2 style="margin-top:40px;">作り方</h2>
  <ol style="list-style:none;padding:0;">
    ${stepsHtml}
  </ol>

  <div class="card" style="background:#FFF8E1;border-color:#FFE082;margin-top:32px;">
    <h3 style="color:#E65100;margin-top:0;">🔬 黄金比で科学する</h3>
    <p>このレシピの比率はあくまで定番の出発点です。「もう少し甘くしたい」「醤油を控えめに」など、自分の好みに合わせて微調整してみましょう。アプリのバージョン管理機能を使えば、変更の前後を比較して最適な比率を追求できます。</p>
  </div>

  <div style="text-align:center;margin:40px 0;">
    <a href="${origin}/" class="cta-btn">このレシピをアプリで使う</a>
  </div>

  <h2>他のレシピ</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:20px;">
    ${otherRecipes}
  </div>
  <div style="text-align:center;margin-top:24px;">
    <a href="${origin}/recipes" style="color:#C5A059;text-decoration:none;font-weight:bold;">レシピ一覧を見る →</a>
  </div>
</div>
${footer(new Date().getFullYear())}
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(html);
}
