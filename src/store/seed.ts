import { v4 as uuidv4 } from 'uuid';
import {
    createRecipe,
    getRecipes,
    saveVersion
} from './repository';
import { Version, Section, Ingredient, Step } from '../types';

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
