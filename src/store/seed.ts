import { v4 as uuidv4 } from 'uuid';
import {
    createRecipe,
    getRecipes,
    saveVersion,
    isAdmin,
    uploadRecipeImage,
    toggleShowcaseStatus
} from './repository';
import { Version, Section, Ingredient, Step } from '../types';
import { officialImages } from '../data/officialImages';

export const seedDemoData = async () => {
    // 1. Check if we already have demo data
    const existing = await getRecipes();
    if (existing.some(r => r.name === '黄金比ハンバーグ')) {
        console.log('Demo data already exists, skipping seed.');
        return;
    }

    console.log('Starting demo data seed (optimized)...');

    /**
     * 我が家の黄金比ハンバーグ - 改善の系譜 (5世代)
     */
    const burger = await createRecipe('黄金比ハンバーグ', 'official_burger_seed');
    const recipeId = burger.id;
    const v1Id = burger.currentVersionId!;
    const now = new Date().toISOString();

    // --- Ver 1.0: 基本のハンバーグ ---
    const v1: Version = {
        id: v1Id,
        recipeId,
        versionNumber: '1.0',
        createdAt: now,
        isPublic: false,
        baseServings: 2,
        sections: [
            {
                id: uuidv4(),
                versionId: v1Id,
                name: 'タネ',
                orderIndex: 0,
                ingredients: [
                    { id: uuidv4(), sectionId: '', name: '合挽肉', quantity: 300, unit: 'g' },
                    { id: uuidv4(), sectionId: '', name: '玉ねぎ', quantity: 0.5, unit: '個' },
                    { id: uuidv4(), sectionId: '', name: 'パン粉', quantity: 20, unit: 'g' },
                    { id: uuidv4(), sectionId: '', name: '牛乳', quantity: 30, unit: 'ml' },
                    { id: uuidv4(), sectionId: '', name: '塩', quantity: 3, unit: 'g' },
                ]
            },
            {
                id: uuidv4(),
                versionId: v1Id,
                name: 'ソース',
                orderIndex: 1,
                ingredients: [
                    { id: uuidv4(), sectionId: '', name: 'ケチャップ', quantity: 50, unit: 'g' },
                    { id: uuidv4(), sectionId: '', name: 'ウスターソース', quantity: 50, unit: 'g' },
                ]
            }
        ],
        steps: []
    };

    // Fix internal IDs
    v1.sections?.forEach(s => {
        s.ingredients?.forEach(i => i.sectionId = s.id);
    });
    v1.steps = [
        { id: uuidv4(), versionId: v1Id, description: '玉ねぎを炒めて冷ます', orderIndex: 0, stepSections: [{ id: uuidv4(), stepId: '', sectionId: v1.sections![0].id }] },
        { id: uuidv4(), versionId: v1Id, description: '材料をすべて混ぜてこねる', orderIndex: 1, stepSections: [{ id: uuidv4(), stepId: '', sectionId: v1.sections![0].id }] },
        { id: uuidv4(), versionId: v1Id, description: '両面を焼き、ソースを絡める', orderIndex: 2, stepSections: [{ id: uuidv4(), stepId: '', sectionId: v1.sections![0].id }, { id: uuidv4(), stepId: '', sectionId: v1.sections![1].id }] }
    ];
    v1.steps.forEach(st => st.stepSections?.forEach(ss => ss.stepId = st.id));

    await saveVersion(recipeId, v1Id, v1);

    // Helper to clone and modify versions for subsequent generations
    const createNextVersion = async (sourceV: Version, notes: string, vNumber: string, modFn: (v: Version) => void) => {
        const newId = uuidv4();
        const nextV: Version = JSON.parse(JSON.stringify(sourceV));
        nextV.id = newId;
        nextV.parentVersionId = sourceV.id;
        nextV.versionNumber = vNumber;
        nextV.notes = notes;
        nextV.createdAt = new Date().toISOString();

        // Update all version contents with new versionId
        nextV.sections?.forEach(s => {
            s.versionId = newId;
            s.ingredients?.forEach(i => i.id = uuidv4()); // Regrow IDs to be safe
        });
        nextV.steps?.forEach(st => {
            st.versionId = newId;
            st.id = uuidv4();
            st.stepSections?.forEach(ss => {
                ss.id = uuidv4();
                ss.stepId = st.id;
            });
        });

        modFn(nextV);
        await saveVersion(recipeId, newId, nextV);
        return nextV;
    };

    // --- Ver 1.1: 野菜の甘みを追加 (玉ねぎ増量) ---
    const v11 = await createNextVersion(v1, '子供が食べやすいよう、玉ねぎを1個に増やして甘みを出す。ソースの比率を調整。', '1.1', (v) => {
        const onion = v.sections?.[0].ingredients?.find(i => i.name === '玉ねぎ');
        if (onion) onion.quantity = 1.0;
        const ketchup = v.sections?.[1].ingredients?.find(i => i.name === 'ケチャップ');
        if (ketchup) ketchup.quantity = 40;
    });

    // --- Ver 1.2: 香辛料の探求 (ナツメグ導入) ---
    const v12 = await createNextVersion(v11, 'お肉の臭みを消すためにナツメグを少量追加。香りが一気に本格的に。', '1.2', (v) => {
        v.sections?.[0].ingredients?.push({ id: uuidv4(), sectionId: v.sections[0].id, name: 'ナツメグ', quantity: 0.5, unit: 'g' });
    });

    // --- Ver 1.3: ソースの革命 (赤ワイン) ---
    const v13 = await createNextVersion(v12, 'ソースに赤ワインを加えてコクを出す。バターを最後に入れて艶を出し。', '1.3', (v) => {
        v.sections?.[1].ingredients?.push({ id: uuidv4(), sectionId: v.sections[1].id, name: '赤ワイン', quantity: 30, unit: 'ml' });
        v.sections?.[1].ingredients?.push({ id: uuidv4(), sectionId: v.sections[1].id, name: 'バター', quantity: 10, unit: 'g' });
    });

    // --- Ver 2.0: 究極の肉汁 (ゼラチン技) ---
    await createNextVersion(v13, '【完成】肉汁を閉じ込めるためにゼラチンパウダーを混ぜる。史上最高のジューシーさ。', '2.0', (v) => {
        v.sections?.[0].ingredients?.push({ id: uuidv4(), sectionId: v.sections[0].id, name: '粉ゼラチン', quantity: 5, unit: 'g' });
        if (v.steps?.[0]) v.steps[0].description = 'ひき肉に塩とゼラチンを入れ、白っぽくなるまで練るのがコツ';
    });

    console.log('Demo data seed completed successfully (optimized)!');
};

export const seedOfficialRecipes = async () => {
    if (!isAdmin()) throw new Error("Permission denied. Only admins can seed official recipes.");

    const recipesToSeed = [
        {
            name: '【究極の黄金比】絶品・肉じゃが',
            imageKey: 'nikujaga',
            category: 'japanese',
            tags: ['和食', '煮物', '定番'],
            servings: 2,
            sections: [
                {
                    name: '具材',
                    ingredients: [
                        { name: '牛肉', qty: 200, unit: 'g' },
                        { name: 'じゃがいも', qty: 3, unit: '個' },
                        { name: 'にんじん', qty: 1, unit: '本' },
                        { name: '玉ねぎ', qty: 1, unit: '個' },
                        { name: 'しらたき', qty: 1, unit: '袋' }
                    ]
                },
                {
                    name: '黄金比の煮汁（1:1:1:1）',
                    ingredients: [
                        { name: '醤油', qty: 4, unit: '大さじ' },
                        { name: 'みりん', qty: 4, unit: '大さじ' },
                        { name: '酒', qty: 4, unit: '大さじ' },
                        { name: '砂糖', qty: 4, unit: '大さじ' },
                        { name: '水', qty: 400, unit: 'ml' },
                        { name: '和風だしの素', qty: 1, unit: '小さじ' }
                    ]
                }
            ],
            steps: [
                '野菜と肉を一口大に切る。',
                '鍋に油を熱し、牛肉を炒める。色が変わったら野菜としらたきを加えてサッと炒め合わせる。',
                '煮汁の材料をすべて鍋に入れ、落とし蓋をして弱〜中火で約15〜20分煮込む。',
                'じゃがいもが柔らかくなり、煮汁が少し煮詰まったら完成！'
            ]
        },
        {
            name: '【究極の黄金比】豚の生姜焼き',
            imageKey: 'shogayaki',
            category: 'japanese',
            tags: ['和食', '肉料理', '定番'],
            servings: 2,
            sections: [
                {
                    name: '具材',
                    ingredients: [
                        { name: '豚ロース薄切り（生姜焼き用）', qty: 200, unit: 'g' },
                        { name: '玉ねぎ', qty: 0.5, unit: '個' }
                    ]
                },
                {
                    name: '黄金比のタレ（1:1:1）',
                    ingredients: [
                        { name: '醤油', qty: 2, unit: '大さじ' },
                        { name: 'みりん', qty: 2, unit: '大さじ' },
                        { name: '酒', qty: 2, unit: '大さじ' },
                        { name: 'すりおろし生姜', qty: 1, unit: 'かけ分' }
                    ]
                }
            ],
            steps: [
                'タレの材料をすべて混ぜ合わせておく。',
                '豚肉に軽く片栗粉（分量外）をはたくと、タレがよく絡みます。',
                'フライパンで豚肉と薄切りにした玉ねぎを炒める。',
                '肉に火が通ったらタレを一気に流し入れ、全体に絡めながらとろみがつくまで焼いたら完成！'
            ]
        },
        {
            name: '【究極の黄金比】とろとろ親子丼',
            imageKey: 'oyakodon',
            category: 'rice',
            tags: ['和食', '丼', '定番'],
            servings: 2,
            sections: [
                {
                    name: '具材',
                    ingredients: [
                        { name: '鶏モモ肉', qty: 150, unit: 'g' },
                        { name: '玉ねぎ', qty: 0.5, unit: '個' },
                        { name: '卵', qty: 3, unit: '個' },
                        { name: 'ご飯', qty: 2, unit: '膳' }
                    ]
                },
                {
                    name: '黄金比の丼つゆ（4:1:1）',
                    ingredients: [
                        { name: 'だし汁', qty: 100, unit: 'ml' },
                        { name: '醤油', qty: 25, unit: 'ml' },
                        { name: 'みりん', qty: 25, unit: 'ml' }
                    ]
                }
            ],
            steps: [
                '鶏肉は小さめの一口大、玉ねぎは薄切りにする。卵は軽く溶きほぐしておく（混ぜすぎないのがコツ）。',
                '小さめのフライパンや親子鍋に丼つゆの材料を入れ、煮立てる。',
                '玉ねぎと鶏肉を入れ、中火で火が通るまで煮る。',
                '溶き卵の2/3を回し入れ、蓋をして半熟になるまで待つ。残りの卵を入れて火を止め、余熱で仕上げてご飯にのせる！'
            ]
        },
        {
            name: '【究極の黄金比】照り焼きチキン',
            imageKey: 'teriyaki_chicken',
            category: 'japanese',
            tags: ['和食', '肉料理', '子供に人気'],
            servings: 2,
            sections: [
                {
                    name: '具材',
                    ingredients: [
                        { name: '鶏モモ肉', qty: 300, unit: 'g' }
                    ]
                },
                {
                    name: '黄金比の甘辛タレ（2:2:2:1）',
                    ingredients: [
                        { name: '醤油', qty: 2, unit: '大さじ' },
                        { name: 'みりん', qty: 2, unit: '大さじ' },
                        { name: '酒', qty: 2, unit: '大さじ' },
                        { name: '砂糖', qty: 1, unit: '大さじ' }
                    ]
                }
            ],
            steps: [
                '鶏肉は余分な水気と脂肪を拭き取り、フォークで数カ所穴を開ける。',
                'フライパンに油を引き、鶏肉を皮目から中火で焼く。こんがりしたら裏返す。',
                '余分な脂をキッチンペーパーで拭き取り、混ぜ合わせた甘辛タレを加える。',
                '焦げないように注意しながら、タレがとろっと絡んで照りが出るまで煮詰めて完成！'
            ]
        },
        {
            name: '【究極の黄金比】ほうれん草の胡麻和え',
            imageKey: 'gomaae',
            category: 'side',
            tags: ['副菜', '和食', '簡単'],
            servings: 2,
            sections: [
                {
                    name: '具材',
                    ingredients: [
                        { name: 'ほうれん草', qty: 1, unit: '束' }
                    ]
                },
                {
                    name: '黄金比のごま衣（1:1:1）',
                    ingredients: [
                        { name: '醤油', qty: 1, unit: '大さじ' },
                        { name: '砂糖', qty: 1, unit: '大さじ' },
                        { name: 'すりごま', qty: 1, unit: '大さじ' }
                    ]
                }
            ],
            steps: [
                'ほうれん草を塩茹で（約1分）し、冷水にさらして色止めする。',
                'しっかりと水気を絞り、3〜4cmの長さに切る。さらに残った水気を絞る。',
                'ボウルにごま衣の材料をすべて入れて混ぜる。',
                'ほうれん草を加えて、全体をよく和えたら完成！'
            ]
        }
    ];

    console.log('Starting official recipes seed...');

    for (const rData of recipesToSeed) {
        // Create base recipe
        const recipe = await createRecipe(rData.name, 'official_' + rData.imageKey);
        const recipeId = recipe.id;
        const vId = recipe.currentVersionId!;
        const now = new Date().toISOString();

        // Build version doc
        const v: Version = {
            id: vId,
            recipeId,
            versionNumber: '1.0',
            createdAt: now,
            isPublic: false,
            baseServings: rData.servings,
            sections: rData.sections.map((s, sIdx) => ({
                id: uuidv4(),
                versionId: vId,
                name: s.name,
                orderIndex: sIdx,
                ingredients: s.ingredients.map(ing => ({
                    id: uuidv4(),
                    sectionId: '',
                    name: ing.name,
                    quantity: ing.qty,
                    unit: ing.unit
                }))
            })),
            steps: []
        };

        // Fix IDs
        v.sections?.forEach(s => {
            s.ingredients?.forEach(i => i.sectionId = s.id);
        });

        v.steps = rData.steps.map((desc, idx) => ({
            id: uuidv4(),
            versionId: vId,
            description: desc,
            orderIndex: idx,
            stepSections: []
        }));

        await saveVersion(recipeId, vId, v);

        // Upload image from base64
        const b64 = officialImages[rData.imageKey];
        if (b64) {
            await uploadRecipeImage(recipeId, b64);
        }

        // Make it public (Showcase)
        await toggleShowcaseStatus(recipeId, true);
    }
    
    console.log('Official recipes seed completed!');
};
