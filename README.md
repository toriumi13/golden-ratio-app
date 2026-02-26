# 我が家の黄金比 (Golden Ratio Recipe App)

家庭料理のレシピを「研究ノート」として記録し、改良の歴史を「進化の系統樹」として管理できるプレミアム・レシピアプリです。

## 🌟 コンセプト
「料理は再現可能な資産である」という考えのもと、日々の改善を記録し、家族の秘伝の味を次世代へ継承することを目指しています。

## ✨ 特徴
- **進化のタイムライン**: レシピの改良履歴を縦型のタイムラインで閲覧可能。
- **黄金比スケーラー**: 味のバランスを保ったまま、1人分〜N人分まで分量を自動計算。物理的な分量（g/個/本など）を正規化して計算する「高度な黄金比バー」を搭載。
- **系統樹デザイン**: どのバージョンから何を変更したかを正確に追跡。
- **UI/UX**: 「シャンパンゴールド（#C5A059）」を基調とした、モダンで洗練されたプレミアム・ミニマルデザイン。
- **シームレスな体験**: 匿名ログインに対応し、初回起動時からすぐにレシピ作成を開始可能。
- **クラウド同期**: Firebase (Firestore/Auth) を採用し、Webとスマホでのデータ同期を実現。

## 🛠 技術スタック
- **Frontend**: React Native (Expo) / React Native Web
- **UI Framework**: React Native Paper
- **Database**: Cloud Firestore (Firebase)
- **Navigation**: React Navigation
- **Styling**: Vanilla StyleSheet (Custom Design System)

## 🚀 起動方法

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Firebaseの設定
`src/store/firebase.ts` を開き、自身の Firebase プロジェクトの構成情報を入力してください。Firestore のルールは開発中は「テストモード」を推奨します。

### 3. アプリの起動
```bash
npx expo start
```

- **Webで開く**: キーボードの `w` を押してください。
- **iOSで開く**: キーボードの `i` を押してください（Mac/Xcode環境が必要）。
- **Androidで開く**: キーボードの `a` を押してください（Android Studio環境が必要）。

## 📖 開発ドキュメント
詳細な仕様については、以下のドキュメントを参照してください。
- [プロダクト仕様書 (v2.5)](./docs/product_spec_v2.md)

## 📝 開発ロードマップ (Phase 2 & 3)
- [ ] 工程ごとの写真アップロード機能
- [ ] レシピの PDF エクスポート
- [ ] 家族間での共有・共同編集機能
- [ ] オフライン機能の強化

---
Designed for those who pursue the "Golden Ratio" in every dish.
