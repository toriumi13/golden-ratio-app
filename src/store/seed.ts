import { v4 as uuidv4 } from 'uuid';
import {
    createRecipe,
    saveVersion,
    isAdmin,
    uploadRecipeImage,
    toggleShowcaseStatus
} from './repository';
import { officialImages } from '../data/officialImages';
import { Version, Section, Step } from '../types';
import { auth } from './firebase';

const recipesToSeed = [
    {
        name: '【究極の黄金比】肉じゃが',
        category: '和食',
        tags: ['定番', '煮物', '黄金比'],
        imageKey: 'nikujaga',
        servings: 2,
        sections: [
            {
                name: '具材',
                ingredients: [
                    { name: '豚バラ肉（または牛肉）', qty: 200, unit: 'g' },
                    { name: 'じゃがいも', qty: 3, unit: '個' },
                    { name: '玉ねぎ', qty: 1, unit: '個' },
                    { name: 'にんじん', qty: 0.5, unit: '本' }
                ]
            },
            {
                name: '黄金比の煮汁（1:1:1:10）',
                ingredients: [
                    { name: '醤油', qty: 2, unit: '大さじ' },
                    { name: '酒', qty: 2, unit: '大さじ' },
                    { name: 'みりん', qty: 2, unit: '大さじ' },
                    { name: '砂糖', qty: 2, unit: '大さじ' },
                    { name: 'だし汁（または水）', qty: 300, unit: 'ml' }
                ]
            }
        ],
        steps: [
            '野菜とお肉を一口大に切る。',
            '鍋に油を熱し、肉、野菜の順に炒める。',
            '煮汁の材料をすべて入れ、落とし蓋をして中火で15分煮る。',
            '火を止め、味を染み込ませるために少し置いて完成！'
        ]
    },
    {
        name: '【究極の黄金比】鶏の照り焼き',
        category: '和食',
        tags: ['定番', '鶏肉', '黄金比'],
        imageKey: 'teriyaki_chicken',
        servings: 2,
        sections: [
            {
                name: 'メイン',
                ingredients: [
                    { name: '鶏もも肉', qty: 1, unit: '枚' }
                ]
            },
            {
                name: '黄金比のタレ（2:2:2:1）',
                ingredients: [
                    { name: '醤油', qty: 2, unit: '大さじ' },
                    { name: '酒', qty: 2, unit: '大さじ' },
                    { name: 'みりん', qty: 2, unit: '大さじ' },
                    { name: '砂糖', qty: 1, unit: '大さじ' }
                ]
            }
        ],
        steps: [
            '鶏肉にフォークで穴を開け、塩コショウを少々振る。',
            'フライパンに油を引き、皮目から焼く。',
            '焼き色がついたら裏返し、蓋をして蒸し焼きにする。',
            'タレの材料を混ぜて入れ、煮詰めながら絡めて完成！'
        ]
    },
    {
        name: '【究極の黄金比】親子丼',
        category: '和食',
        tags: ['丼もの', '卵', '黄金比'],
        imageKey: 'oyakodon',
        servings: 1,
        sections: [
            {
                name: '具材',
                ingredients: [
                    { name: '鶏もも肉', qty: 100, unit: 'g' },
                    { name: '玉ねぎ', qty: 0.25, unit: '個' },
                    { name: '卵', qty: 2, unit: '個' }
                ]
            },
            {
                name: '黄金比のつゆ（1:1:1:4）',
                ingredients: [
                    { name: '醤油', qty: 1, unit: '大さじ' },
                    { name: '酒', qty: 1, unit: '大さじ' },
                    { name: 'みりん', qty: 1, unit: '大さじ' },
                    { name: 'だし汁', qty: 4, unit: '大さじ' }
                ]
            }
        ],
        steps: [
            '鶏肉は一口大、玉ねぎは薄切りにする。',
            '小さめのフライパンにつゆを沸騰させ、鶏肉と玉ねぎを煮る。',
            '火が通ったら、溶き卵を回し入れ、蓋をして好みの固さにする。',
            'ご飯に乗せて完成！'
        ]
    },
    {
        name: '【究極の黄金比】鶏の唐揚げ',
        category: '和食',
        tags: ['揚げ物', '鶏肉', '黄金比'],
        imageKey: 'karaage',
        servings: 2,
        sections: [
            {
                name: 'メイン',
                ingredients: [
                    { name: '鶏もも肉', qty: 300, unit: 'g' }
                ]
            },
            {
                name: '黄金比の下味（2:1:1）',
                ingredients: [
                    { name: '醤油', qty: 2, unit: '大さじ' },
                    { name: '酒', qty: 1, unit: '大さじ' },
                    { name: 'みりん', qty: 1, unit: '大さじ' },
                    { name: 'すりおろし生姜', qty: 1, unit: '片' },
                    { name: 'すりおろしにんにく', qty: 1, unit: '片' }
                ]
            }
        ],
        steps: [
            '鶏肉を一口大に切り、下味の材料に30分漬け込む。',
            '片栗粉を全体にまぶす。',
            '170度の油でカリッとするまで揚げる。',
            '一度取り出し、180度で二度揚げすると更に美味しくなります。'
        ]
    },
    {
        name: '【究極の黄金比】サバの味噌煮',
        category: '和食',
        tags: ['魚料理', '煮物', '黄金比'],
        imageKey: 'saba_misoni',
        servings: 2,
        sections: [
            {
                name: 'メイン',
                ingredients: [
                    { name: 'サバの切り身', qty: 2, unit: '切れ' }
                ]
            },
            {
                name: '黄金比の味噌ダレ（2:2:2:1）',
                ingredients: [
                    { name: '味噌', qty: 2, unit: '大さじ' },
                    { name: '酒', qty: 2, unit: '大さじ' },
                    { name: 'みりん', qty: 2, unit: '大さじ' },
                    { name: '砂糖', qty: 1, unit: '大さじ' },
                    { name: '水', qty: 100, unit: 'ml' },
                    { name: '薄切り生姜', qty: 3, unit: '枚' }
                ]
            }
        ],
        steps: [
            'サバに切り込みを入れ、熱湯をかけて臭みを取る。',
            '鍋に酒、みりん、砂糖、水、生姜を入れて沸騰させる。',
            'サバを入れ、落とし蓋をして中火で5分煮る。',
            '味噌を溶き入れ、煮汁にとろみがつくまで煮詰めれば完成！'
        ]
    },
    {
        name: '【究極の黄金比】だし巻き卵',
        category: '和食',
        tags: ['定番', '卵', '黄金比'],
        imageKey: 'dashimaki',
        servings: 2,
        sections: [
            {
                name: 'メイン',
                ingredients: [
                    { name: '卵', qty: 3, unit: '個' }
                ]
            },
            {
                name: '黄金比のだし汁（4:1:1）',
                ingredients: [
                    { name: 'だし汁', qty: 4, unit: '大さじ' },
                    { name: '薄口醤油', qty: 1, unit: '小さじ' },
                    { name: 'みりん', qty: 1, unit: '小さじ' }
                ]
            }
        ],
        steps: [
            'ボウルに卵を溶き、だし汁、醤油、みりんを加えて混ぜる（泡立てないように）。',
            '卵焼き器を熱し、油を薄く引く。',
            '卵液を数回に分けて流し入れ、奥から手前に巻きながら焼く。',
            '形を整えて完成！'
        ]
    },
    {
        name: '【究極の黄金比】牛丼',
        category: '和食',
        tags: ['丼もの', '牛肉', '黄金比'],
        imageKey: 'gyudon',
        servings: 2,
        sections: [
            {
                name: '具材',
                ingredients: [
                    { name: '牛バラ薄切り肉', qty: 200, unit: 'g' },
                    { name: '玉ねぎ', qty: 1, unit: '個' }
                ]
            },
            {
                name: '黄金比のつゆ（2:1:1:1:6）',
                ingredients: [
                    { name: '醤油', qty: 2, unit: '大さじ' },
                    { name: '酒', qty: 1, unit: '大さじ' },
                    { name: 'みりん', qty: 1, unit: '大さじ' },
                    { name: '砂糖', qty: 1, unit: '大さじ' },
                    { name: '水', qty: 6, unit: '大さじ' },
                    { name: 'だしの素', qty: 0.5, unit: '小さじ' }
                ]
            }
        ],
        steps: [
            '玉ねぎを1cm幅のくし切りにする。',
            '鍋につゆの材料を全て入れ、沸騰させる。',
            '玉ねぎを入れ、しんなりするまで煮る。',
            '牛肉を加え、アクを取りながら火が通るまで煮れば完成！'
        ]
    },
    {
        name: '【究極の黄金比】きんぴらごぼう',
        category: '和食',
        tags: ['副菜', '野菜', '黄金比'],
        imageKey: 'kinpira',
        servings: 2,
        sections: [
            {
                name: '具材',
                ingredients: [
                    { name: 'ごぼう', qty: 1, unit: '本' },
                    { name: 'にんじん', qty: 0.5, unit: '本' }
                ]
            },
            {
                name: '黄金比の調味料（1:1:1:1）',
                ingredients: [
                    { name: '醤油', qty: 1, unit: '大さじ' },
                    { name: '酒', qty: 1, unit: '大さじ' },
                    { name: 'みりん', qty: 1, unit: '大さじ' },
                    { name: '砂糖', qty: 1, unit: '大さじ' }
                ]
            }
        ],
        steps: [
            'ごぼうとにんじんを千切りにする（ごぼうは水にさらしてアクを抜く）。',
            'フライパンに油と鷹の爪を熱し、ごぼう、にんじんの順に炒める。',
            '野菜に火が通ったら、調味料を全て加える。',
            '汁気がなくなるまで炒り煮にすれば完成！'
        ]
    }
];

export const seedOfficialRecipes = async (userId?: string) => {
    if (!isAdmin()) {
        console.error("Permission denied. Only admin can seed official recipes.");
        return;
    }

    const effectiveUserId = userId || auth.currentUser?.uid || 'unknown';
    console.log(`[SEED] Starting official recipe seed for user ${effectiveUserId}...`);

    for (const rData of recipesToSeed) {
        try {
            console.log(`[SEED] Seeding recipe: ${rData.name}...`);
            const recipe = await createRecipe(rData.name, `official_${rData.imageKey}`, rData.servings);
            
            const recipeId = recipe.id;
            const versionId = recipe.currentVersionId as string;

            // Prepare Sections
            const sections: Section[] = rData.sections.map((s, idx) => {
                const sid = uuidv4();
                return {
                    id: sid,
                    versionId,
                    name: s.name,
                    orderIndex: idx,
                    ingredients: s.ingredients.map(i => ({
                        id: uuidv4(),
                        sectionId: sid,
                        name: i.name,
                        quantity: i.qty,
                        unit: i.unit
                    }))
                };
            });

            // Prepare Steps
            const steps: Step[] = rData.steps.map((description, idx) => ({
                id: uuidv4(),
                versionId,
                description,
                orderIndex: idx,
                stepSections: []
            }));

            // Sync with DB
            const versionData: Version = {
                id: versionId,
                recipeId,
                versionNumber: '1.0',
                createdAt: new Date().toISOString(),
                isPublic: true,
                baseServings: rData.servings,
                sections,
                steps
            };

            await saveVersion(recipeId, versionId, versionData);

            // Handle Image
            const base64 = (officialImages as any)[rData.imageKey];
            if (base64) {
                console.log(`[SEED] Uploading image for ${rData.name}...`);
                await uploadRecipeImage(recipeId, base64);
            }

            // Set as Public (Showcase)
            await toggleShowcaseStatus(recipeId, versionId, true);

            console.log(`[SEED] Successfully seeded ${rData.name}`);
        } catch (error) {
            console.error(`[SEED] Failed to seed ${rData.name}:`, error);
        }
    }

    console.log("[SEED] Official recipe seed completed.");
};
