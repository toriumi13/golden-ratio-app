const fs = require('fs');
const path = require('path');

// dist/index.htmlを読み込む
const indexPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// PWAタグを追加
const pwaMetaTags = `
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/favicon.ico">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="黄金比">`;

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

// </head>の前にPWAタグを挿入
html = html.replace('</head>', pwaMetaTags + '\n</head>');

// </body>の前にService Workerスクリプトを挿入
html = html.replace('</body>', serviceWorkerScript + '\n</body>');

// ファイルに書き込む
fs.writeFileSync(indexPath, html, 'utf8');

console.log('PWA tags injected successfully!');
