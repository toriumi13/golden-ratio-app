import { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

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

    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
    }

    const { dishTypes, requiredIngredients, freeText } = req.body;
    const types: string[] = Array.isArray(dishTypes) ? dishTypes : [];

    if (types.length === 0) {
        return res.status(400).json({ error: '料理の種類を1つ以上選択してください' });
    }

    const dishList = types.map((t, i) => `${i + 1}. ${t}`).join('\n');

    const prompt = `夕ごはんの献立を考えてください。

【条件】
- 生成する料理（順番通りに1品ずつ）:
${dishList}
- 使う食材: ${requiredIngredients?.length ? (requiredIngredients as string[]).join('、') : 'なし'}
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

    try {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        });

        const text = message.content[0].type === 'text' ? message.content[0].text : '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('Claude returned invalid JSON');

        const dishes = JSON.parse(jsonMatch[0]) as GeneratedDish[];
        return res.status(200).json({ dishes });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
}
