import { Recipe, Version, Section } from '../types';

export interface PresetRecipe {
    id: string;
    name: string;
    description: string;
    category: string;
    sections: {
        name: string;
        ingredients: {
            name: string;
            quantity: number;
            unit: string;
        }[];
    }[];
    steps: string[];
}

export const PRESET_RECIPES: PresetRecipe[] = [
    {
        id: 'preset_hamburg_pro',
        name: '究極の肉汁ハンバーグ',
        description: 'ゼラチンパウダーで肉汁を閉じ込めるプロの技。黄金比のソース付き。',
        category: '洋食',
        sections: [
            {
                name: 'タネ (2人前)',
                ingredients: [
                    { name: '牛豚合挽肉', quantity: 300, unit: 'g' },
                    { name: '玉ねぎ', quantity: 1, unit: '個' },
                    { name: 'パン粉', quantity: 20, unit: 'g' },
                    { name: '牛乳', quantity: 30, unit: 'ml' },
                    { name: '粉ゼラチン', quantity: 5, unit: 'g' },
                    { name: '塩', quantity: 3, unit: 'g' },
                    { name: '胡椒・ナツメグ', quantity: 1, unit: 'つまみ' },
                ]
            },
            {
                name: 'ソース',
                ingredients: [
                    { name: 'ケチャップ', quantity: 3, unit: '大さじ' },
                    { name: 'ウスターソース', quantity: 2, unit: '大さじ' },
                    { name: '赤ワイン', quantity: 1, unit: '大さじ' },
                    { name: 'バター', quantity: 10, unit: 'g' },
                ]
            }
        ],
        steps: [
            '玉ねぎをみじん切りにして炒め、完全に冷ます',
            '挽肉に塩とゼラチンを入れ、白っぽくなるまでしっかりこねる',
            '残りのタネの材料を混ぜ合わせ、空気を抜いて成形する',
            'フライパンで両面を焼き、少量の水を加えて蓋をし、弱火で5分蒸し焼きにする',
            '肉を取り出した後のフライパンにソースの材料を入れ、煮詰めてバターを溶かす'
        ]
    },
    {
        id: 'preset_teriyaki',
        name: '不動の照り焼きタレ',
        description: '肉、魚、野菜。何にでも合う不動の2:2:2:1比率。',
        category: '和食',
        sections: [
            {
                name: 'メインの具材',
                ingredients: [
                    { name: '鶏もも肉、またはブリ等', quantity: 250, unit: 'g' },
                    { name: '薄力粉(まぶし用)', quantity: 0, unit: '適量' },
                ]
            },
            {
                name: 'タレ',
                ingredients: [
                    { name: '醤油', quantity: 2, unit: '大さじ' },
                    { name: 'みりん', quantity: 2, unit: '大さじ' },
                    { name: '酒', quantity: 2, unit: '大さじ' },
                    { name: '砂糖', quantity: 1, unit: '大さじ' },
                ]
            }
        ],
        steps: [
            '具材に薄力粉を薄くまぶす(タレが絡みやすくなります)',
            'フライパンで具材を焼き、火を通す',
            '混ぜ合わせたタレを加え、強火でとろみがつくまで煮絡める'
        ]
    },
    {
        id: 'preset_chahan',
        name: 'お店の味！パラパラ炒飯',
        description: 'ご飯と卵の比率が決め手。家庭で本格的な味を再現。',
        category: '中華',
        sections: [
            {
                name: 'ベース (1人前)',
                ingredients: [
                    { name: '温かいご飯', quantity: 200, unit: 'g' },
                    { name: '卵', quantity: 1, unit: '個' },
                    { name: 'チャーシュー、またはハム', quantity: 30, unit: 'g' },
                    { name: '長ねぎ', quantity: 10, unit: 'cm' },
                ]
            },
            {
                name: '味付け',
                ingredients: [
                    { name: '中華だし(顆粒)', quantity: 1, unit: '小さじ' },
                    { name: '醤油', quantity: 1, unit: '小さじ' },
                    { name: '塩・胡椒', quantity: 1, unit: 'つまみ' },
                    { name: 'サラダ油', quantity: 1, unit: '大さじ' },
                ]
            }
        ],
        steps: [
            'ねぎ、チャーシューをみじん切りにする',
            'ボウルで卵を溶き、ご飯を入れて「卵かけご飯」状態に混ぜる',
            '強火のフライパンに油を引き、卵ご飯を入れ、お玉の背で叩くように炒める',
            'ご飯がパラパラになったら具材と調味料を加え、さらに炒め合わせる',
            '仕上げに鍋肌から醤油を回し入れ、香りを出す'
        ]
    },
    {
        id: 'preset_oyakodon',
        name: '本格親子丼の黄金比',
        description: 'だし汁4:醤油1:みりん1の黄金バランス。',
        category: '和食',
        sections: [
            {
                name: '具材 (1人前)',
                ingredients: [
                    { name: '鶏もも肉', quantity: 100, unit: 'g' },
                    { name: '玉ねぎ', quantity: 1 / 4, unit: '個' },
                    { name: '卵', quantity: 2, unit: '個' },
                    { name: '温かいご飯', quantity: 1, unit: '膳' },
                ]
            },
            {
                name: '割り下',
                ingredients: [
                    { name: 'だし汁', quantity: 100, unit: 'ml' },
                    { name: '醤油', quantity: 1.5, unit: '大さじ' },
                    { name: 'みりん', quantity: 1.5, unit: '大さじ' },
                    { name: '砂糖', quantity: 1, unit: '小さじ' },
                ]
            }
        ],
        steps: [
            '鶏肉は一口大に、玉ねぎは薄切りにする',
            '小さめのフライパンに割り下、鶏肉、玉ねぎを入れ、火にかける',
            '鶏肉に火が通ったら、溶き卵を外側から中心へ回し入れる',
            '蓋をして弱火で30秒ほど蒸らし、好みの固さでご飯の上に乗せる'
        ]
    },
    {
        id: 'preset_dressing',
        name: '無限サラダ 魔法の比率',
        description: 'オイル3:酢1。乳化を極める基本のドレッシング。',
        category: '洋食',
        sections: [
            {
                name: 'ドレッシング',
                ingredients: [
                    { name: 'オリーブオイル', quantity: 3, unit: '大さじ' },
                    { name: 'お好みの酢', quantity: 1, unit: '大さじ' },
                    { name: '塩', quantity: 1, unit: 'つまみ' },
                    { name: 'ブラックペッパー', quantity: 1, unit: 'つまみ' },
                    { name: '砂糖', quantity: 1, unit: 'つまみ' },
                    { name: 'すりおろし玉ねぎ', quantity: 0.5, unit: '大さじ' },
                ]
            }
        ],
        steps: [
            'ボウルに酢、塩、胡椒、砂糖を入れてしっかり混ぜる',
            '油を少しずつ加えながら、ホイッパーで白っぽくなるまでよく乳化させる',
            '最後にすりおろし玉ねぎを加え、冷蔵庫で30分ほど寝かせると味が馴染む'
        ]
    },
    {
        id: 'preset_tenpuyu',
        name: '老舗風 天ぷらつゆ',
        description: 'だし4:醤油1:みりん1。素材の味を引き立てる上品な比率。',
        category: '和食',
        sections: [
            {
                name: 'つゆ',
                ingredients: [
                    { name: 'だし汁', quantity: 100, unit: 'ml' },
                    { name: '濃口醤油', quantity: 25, unit: 'ml' },
                    { name: 'みりん', quantity: 25, unit: 'ml' },
                    { name: '大根おろし', quantity: 0, unit: '適量' },
                    { name: '生姜(すりおろし)', quantity: 2, unit: 'g' },
                ]
            }
        ],
        steps: [
            '鍋にみりんを入れて火にかけ、沸騰させてアルコールを飛ばす',
            'だし汁と醤油を加え、ひと煮立ちさせる',
            '火を止めて冷まし、食べる直前に大根おろしと生姜を添える'
        ]
    },
    {
        id: 'preset_karaage',
        name: '黄金比の唐揚げ',
        description: '醤油2:酒1。冷めてもサクサク、ジューシーな王道の味。',
        category: '和食',
        sections: [
            {
                name: '具材 (2人前)',
                ingredients: [
                    { name: '鶏もも肉', quantity: 300, unit: 'g' },
                    { name: '片栗粉', quantity: 3, unit: '大さじ' },
                    { name: '揚げ油', quantity: 0, unit: '適量' },
                ]
            },
            {
                name: '下味',
                ingredients: [
                    { name: '醤油', quantity: 2, unit: '大さじ' },
                    { name: '酒', quantity: 1, unit: '大さじ' },
                    { name: '生姜(すりおろし)', quantity: 2, unit: 'g' },
                    { name: 'にんにく(すりおろし)', quantity: 2, unit: 'g' },
                ]
            }
        ],
        steps: [
            '鶏肉を一口大に切り、ボウルで下味の材料と共によくもみ込む',
            '15〜30分ほど冷蔵庫で寝かせて味を馴染ませる',
            '肉に片栗粉をしっかりとまぶし、余分な粉を落とす',
            '170度の油で3分、一度取り出して4分休ませ、最後に190度で1分揚げる(二度揚げ)'
        ]
    },
    {
        id: 'preset_carbonara_pro',
        name: '至福のカルボナーラ',
        description: '卵1.5個分の濃厚ソースとたっぷりブラックペッパー。分離させない温度管理がコツ。',
        category: 'イタリアン',
        sections: [
            {
                name: '濃厚ソース (1人前)',
                ingredients: [
                    { name: '全卵', quantity: 1, unit: '個' },
                    { name: '卵黄', quantity: 1, unit: '個' },
                    { name: 'パルメザンチーズ', quantity: 20, unit: 'g' },
                    { name: '生クリーム', quantity: 30, unit: 'ml' },
                    { name: '粗挽きブラックペッパー', quantity: 2, unit: 'g' },
                ]
            },
            {
                name: '具材',
                ingredients: [
                    { name: 'パスタ (1.6mm以上)', quantity: 100, unit: 'g' },
                    { name: 'ベーコン (厚切り推奨)', quantity: 40, unit: 'g' },
                    { name: 'オリーブオイル', quantity: 1, unit: '大さじ' },
                    { name: 'ゆで汁', quantity: 2, unit: 'リットル' },
                    { name: 'ゆで汁用の塩', quantity: 20, unit: 'g' },
                ]
            }
        ],
        steps: [
            'パスタをたっぷりの塩を加えた湯で茹で始める',
            'ボウルで濃厚ソースの材料をすべて混ぜ合わせておく',
            'フライパンにオイルとベーコンを入れ、弱火でじっくり脂を出す',
            '茹で上がったパスタをフライパンに入れ、全体に脂をなじませる',
            '【重要】フライパンの火を止め、少し落ち着かせてからボウルの中身を投入する',
            '余熱だけでゴムベラを使い、とろりとするまで混ぜ合わせる。最後に追いペッパーを振る'
        ]
    },
    {
        id: 'preset_nanban',
        name: '鶏南蛮漬けの黄金比',
        description: 'だし3:酢2:醤油1:砂糖1。野菜もたっぷり食べられる絶妙な酸味。',
        category: '和食',
        sections: [
            {
                name: '具材 (2人前)',
                ingredients: [
                    { name: '鶏胸肉、または小アジ', quantity: 250, unit: 'g' },
                    { name: '玉ねぎ', quantity: 1 / 2, unit: '個' },
                    { name: 'にんじん', quantity: 1 / 4, unit: '本' },
                    { name: 'ピーマン', quantity: 1, unit: '個' },
                ]
            },
            {
                name: '漬けダレ',
                ingredients: [
                    { name: 'だし汁', quantity: 3, unit: '大さじ' },
                    { name: '酢', quantity: 2, unit: '大さじ' },
                    { name: '醤油', quantity: 1, unit: '大さじ' },
                    { name: '砂糖', quantity: 1, unit: '大さじ' },
                    { name: '鷹の爪(輪切り)', quantity: 0, unit: '適量' },
                ]
            }
        ],
        steps: [
            '玉ねぎ、にんじん、ピーマンを千切りにし、ボウルに入れる',
            '漬けダレの材料を鍋に入れ、ひと煮立ちさせて砂糖を溶かし、野菜ボウルに入れる',
            '具材(肉や魚)を揚げ焼きにし、熱いうちに野菜のボウルに投入する',
            '粗熱が取れたら冷蔵庫で1時間以上冷やすと味が馴染んで美味しい'
        ]
    },
    {
        id: 'preset_pancake',
        name: '至福のパンケーキ',
        description: '粉100gに対して液体2項目で120ml。お店のような厚みを目指す比率。',
        category: 'スイーツ',
        sections: [
            {
                name: '生地 (2〜3枚分)',
                ingredients: [
                    { name: '薄力粉', quantity: 100, unit: 'g' },
                    { name: 'ベーキングパウダー', quantity: 5, unit: 'g' },
                    { name: '砂糖', quantity: 20, unit: 'g' },
                    { name: '塩', quantity: 1, unit: 'ひとつまみ' },
                    { name: '牛乳', quantity: 80, unit: 'ml' },
                    { name: '卵', quantity: 1, unit: '個' },
                    { name: 'バニラエッセンス', quantity: 1, unit: '滴' },
                ]
            }
        ],
        steps: [
            'ボウルで卵と牛乳をよく混ぜ合わせる',
            '粉類、砂糖、塩をすべて加え、ダマが少し残る程度にさっくりと混ぜる',
            'フライパンを熱し、一度ぬれタオルの上に置いて温度を均一にする',
            'ごく弱火で3分じっくり焼き、表面に気泡が出てきたら慎重に裏返す',
            '裏面を2分ほど焼き、弾力が出たら完成'
        ]
    }
];
