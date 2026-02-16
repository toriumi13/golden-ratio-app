const fs = require('fs');
const path = require('path');

// dist/index.htmlを読み込む
const indexPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// PWAタグとSEOタグを追加
const pwaMetaTags = `
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/favicon.ico">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="黄金比">
  
  <!-- SEO Meta Tags -->
  <meta name="keywords" content="レシピ,料理,黄金比,調味料,比率,メモ,レシピ帳,cooking,recipe">
  <meta name="author" content="Golden Ratio App">
  <link rel="canonical" href="https://golden-ratio-app-zeta.vercel.app/">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://golden-ratio-app-zeta.vercel.app/">
  <meta property="og:title" content="黄金比のレシピ帳">
  <meta property="og:description" content="黄金比をメモして、あなたの料理を進化させるレシピ帳">
  <meta property="og:image" content="https://golden-ratio-app-zeta.vercel.app/favicon.ico">
  <meta property="og:site_name" content="黄金比のレシピ帳">
  <meta property="og:locale" content="ja_JP">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="https://golden-ratio-app-zeta.vercel.app/">
  <meta name="twitter:title" content="黄金比のレシピ帳">
  <meta name="twitter:description" content="黄金比をメモして、あなたの料理を進化させるレシピ帳">
  <meta name="twitter:image" content="https://golden-ratio-app-zeta.vercel.app/favicon.ico">`;

// 構造化データ (JSON-LD)
const structuredData = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "黄金比のレシピ帳",
    "description": "黄金比をメモして、あなたの料理を進化させるレシピ帳",
    "url": "https://golden-ratio-app-zeta.vercel.app/",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Web",
    "inLanguage": "ja",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY"
    }
  }
  </script>`;

const serviceWorkerScript = `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(reg => console.log('SW registered:', reg))
          .catch(err => console.log('SW failed:', err));
      });
    }
  </script>`;

// Google Analytics
const analyticsScript = `
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-RWX4ZC1KND"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-RWX4ZC1KND');
  </script>`;

// </head>の前に追加
html = html.replace('</head>', analyticsScript + '\n</head>');

// </head>の前にPWAタグを挿入
html = html.replace('</head>', pwaMetaTags + '\n</head>');

// </head>の前に構造化データを挿入
html = html.replace('</head>', structuredData + '\n</head>');

// </body>の前にService Workerスクリプトを挿入
html = html.replace('</body>', serviceWorkerScript + '\n</body>');

// ファイルに書き込む
fs.writeFileSync(indexPath, html, 'utf8');

console.log('PWA tags injected successfully!');
