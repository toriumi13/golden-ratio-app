import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';


export interface GeneratedDish {
    name: string;
    description: string;
    category: string;
    baseServings: number;
    sections: {
        name: string;
        ingredients: { name: string; quantity: number; unit: string }[];
    }[];
    steps: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const { dishTypes, stapleFood, requiredIngredients, optionalIngredients, freeText } = req.body;
    const types: string[] = Array.isArray(dishTypes) ? dishTypes : [];

    if (types.length === 0) {
        return res.status(400).json({ error: '料理の種類を1つ以上選択してください' });
    }

    const dishList = types.map((t, i) => `${i + 1}. ${t}`).join('\n');

    const prompt = `夕ごはんの献立を考えてください。

【条件】
- 生成する料理（順番通りに1品ずつ）:
${dishList}
- 主食: ${stapleFood || 'なし'}
- 必ず使う食材: ${requiredIngredients?.length ? (requiredIngredients as string[]).join('、') : 'なし'}
- できれば使う食材: ${optionalIngredients?.length ? (optionalIngredients as string[]).join('、') : 'なし'}
- その他の要望: ${freeText || 'なし'}

上記${types.length}品のレシピを以下のJSON形式で返してください。
各レシピの食材は調味料と具材をセクションに分けてください。
JSON以外のテキストは絶対に不要です。

[
  {
    "name": "料理名",
    "description": "一行説明（黄金比や特徴を含む）",
    "category": "japanese|western|chinese|italian|sweets|drinks|others のいずれか",
    "baseServings": 2,
    "sections": [
      {
        "name": "セクション名（例：具材、タレ、下味、ソース）",
        "ingredients": [
          { "name": "食材名", "quantity": 1, "unit": "単位（g/ml/大さじ/小さじ/個/本/枚 等）" }
        ]
      }
    ],
    "steps": ["手順1", "手順2", "手順3"]
  }
]`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const callGemini = () => model.generateContent(prompt);

    const isRateLimit = (e: any) =>
        String(e?.message ?? '').includes('429') ||
        String(e?.status ?? '') === '429' ||
        String(e?.message ?? '').toLowerCase().includes('quota');

    let result;
    try {
        result = await callGemini();
    } catch (e: any) {
        if (isRateLimit(e)) {
            await new Promise(r => setTimeout(r, 3000));
            try {
                result = await callGemini();
            } catch (e2: any) {
                if (isRateLimit(e2)) {
                    return res.status(429).json({ error: 'AIが混み合っています。しばらく待ってから再試行してください。' });
                }
                return res.status(500).json({ error: e2.message });
            }
        } else {
            return res.status(500).json({ error: e.message });
        }
    }

    try {
        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('Gemini returned invalid JSON');
        const dishes = JSON.parse(jsonMatch[0]) as GeneratedDish[];
        return res.status(200).json({ dishes });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
}
