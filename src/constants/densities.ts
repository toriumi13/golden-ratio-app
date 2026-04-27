/**
 * 主要な調味料・材料の1単位あたりの重量（g）を定義します。
 * 料理における標準的な密度データに基づいています。
 */
export const INGREDIENT_DENSITIES: { [key: string]: { tbsp: number; tsp: number; cup?: number } } = {
    // 液体・基本
    '水': { tbsp: 15, tsp: 5, cup: 200 },
    '酒': { tbsp: 15, tsp: 5, cup: 200 },
    'みりん': { tbsp: 18, tsp: 6, cup: 230 },
    '酢': { tbsp: 15, tsp: 5, cup: 200 },
    '醤油': { tbsp: 18, tsp: 6, cup: 230 },
    'しょうゆ': { tbsp: 18, tsp: 6, cup: 230 },
    '油': { tbsp: 12, tsp: 4, cup: 170 },
    'オリーブオイル': { tbsp: 12, tsp: 4, cup: 170 },
    'サラダ油': { tbsp: 12, tsp: 4, cup: 170 },
    'ごま油': { tbsp: 12, tsp: 4, cup: 170 },
    '牛乳': { tbsp: 15, tsp: 5, cup: 210 },

    // 粉末・固形
    '砂糖': { tbsp: 9, tsp: 3, cup: 110 },
    '上白糖': { tbsp: 9, tsp: 3, cup: 110 },
    'グラニュー糖': { tbsp: 12, tsp: 4, cup: 180 },
    '塩': { tbsp: 18, tsp: 6, cup: 240 },
    '食塩': { tbsp: 18, tsp: 6, cup: 240 },
    '小麦粉': { tbsp: 9, tsp: 3, cup: 110 },
    '薄力粉': { tbsp: 9, tsp: 3, cup: 110 },
    '片栗粉': { tbsp: 9, tsp: 3, cup: 130 },
    'パン粉': { tbsp: 3, tsp: 1, cup: 40 },
    '味噌': { tbsp: 18, tsp: 6, cup: 230 },
    'みそ': { tbsp: 18, tsp: 6, cup: 230 },
    'マヨネーズ': { tbsp: 12, tsp: 4, cup: 190 },
    'ケチャップ': { tbsp: 15, tsp: 5, cup: 230 },
};

/**
 * 味のカテゴリー定義 (生物学的な五味 + 料理に欠かせない辛味)
 */
export type TasteCategory = 'salt' | 'sweet' | 'umami' | 'bitter' | 'sour' | 'spicy';

export const TASTE_LABELS: Record<TasteCategory, string> = {
    salt: '塩味',
    sweet: '甘味',
    umami: '旨味',
    bitter: '苦味',
    sour: '酸味',
    spicy: '辛味'
};

/**
 * 材料名から味のカテゴリーと強度（インパクト）を判定するためのマッピング
 */
export const INGREDIENT_TASTE_DATA: Record<string, { category: TasteCategory, potency: number }> = {
    // 塩味
    '塩': { category: 'salt', potency: 30.0 },
    '食塩': { category: 'salt', potency: 30.0 },
    '醤油': { category: 'salt', potency: 5.0 },
    'しょうゆ': { category: 'salt', potency: 5.0 },
    '味噌': { category: 'salt', potency: 4.0 },
    'みそ': { category: 'salt', potency: 4.0 },
    'コンソメ': { category: 'salt', potency: 8.0 },
    '鶏ガラ': { category: 'salt', potency: 8.0 },
    'だしだ': { category: 'salt', potency: 10.0 },
    
    // 甘味
    '砂糖': { category: 'sweet', potency: 3.0 },
    '上白糖': { category: 'sweet', potency: 3.0 },
    'グラニュー糖': { category: 'sweet', potency: 3.5 },
    'みりん': { category: 'sweet', potency: 1.5 },
    'ハチミツ': { category: 'sweet', potency: 4.0 },
    'メープル': { category: 'sweet', potency: 3.5 },
    
    // 旨味・コク
    '酒': { category: 'umami', potency: 0.5 },
    'ワイン': { category: 'umami', potency: 0.5 },
    'だし': { category: 'umami', potency: 0.1 }, 
    '出汁': { category: 'umami', potency: 0.1 },
    'だしの素': { category: 'umami', potency: 15.0 }, 
    '和風だし': { category: 'umami', potency: 15.0 },
    '中華だし': { category: 'umami', potency: 12.0 },
    '油': { category: 'umami', potency: 0.5 },
    'オリーブオイル': { category: 'umami', potency: 0.6 },
    'ごま油': { category: 'umami', potency: 0.8 },
    'バター': { category: 'umami', potency: 1.2 },
    'マヨネーズ': { category: 'umami', potency: 1.5 },

    // 苦味 (アクセントとしての苦味)
    'コーヒー': { category: 'bitter', potency: 5.0 },
    '抹茶': { category: 'bitter', potency: 6.0 },
    'ココア': { category: 'bitter', potency: 4.0 },
    'カカオ': { category: 'bitter', potency: 8.0 },
    'チョコ': { category: 'bitter', potency: 2.0 },
    'ゴーヤ': { category: 'bitter', potency: 10.0 },
    'ビール': { category: 'bitter', potency: 1.5 },
    'パセリ': { category: 'bitter', potency: 2.0 },
    'セロリ': { category: 'bitter', potency: 1.5 },
    
    // 酸味
    '酢': { category: 'sour', potency: 5.0 },
    'レモン': { category: 'sour', potency: 4.0 },
    'バルサミコ': { category: 'sour', potency: 4.5 },
    
    // 辛味
    '唐辛子': { category: 'spicy', potency: 10.0 },
    'ラー油': { category: 'spicy', potency: 8.0 },
    'コショウ': { category: 'spicy', potency: 12.0 },
    '胡椒': { category: 'spicy', potency: 12.0 },
    'わさび': { category: 'spicy', potency: 10.0 },
    'からし': { category: 'spicy', potency: 10.0 },
    '豆板醤': { category: 'spicy', potency: 8.0 },
    'コチュジャン': { category: 'spicy', potency: 6.0 },
    'チリ': { category: 'spicy', potency: 8.0 },
    'ニンニク': { category: 'spicy', potency: 3.0 },
    'にんにく': { category: 'spicy', potency: 3.0 },
    '生姜': { category: 'spicy', potency: 2.0 },
    'しょうが': { category: 'spicy', potency: 2.0 },
};

/**
 * 材料名から味のカテゴリーと強度を取得
 */
export const getTasteData = (name: string) => {
    const keys = Object.keys(INGREDIENT_TASTE_DATA).sort((a, b) => b.length - a.length);
    const match = keys.find(key => name.includes(key));
    return match ? INGREDIENT_TASTE_DATA[match] : null;
};

/**
 * 材料名から密度データを検索するためのヘルパー
 */
export const getDensity = (name: string) => {
    const keys = Object.keys(INGREDIENT_DENSITIES).sort((a, b) => b.length - a.length);
    const match = keys.find(key => name.includes(key));
    return match ? INGREDIENT_DENSITIES[match] : null;
};
