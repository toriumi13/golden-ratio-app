import {
    createRecipe,
    addSection,
    addIngredient,
    addStep,
    createNewVersionFromExisting,
    getRecipes,
    updateIngredient,
    getRecipeDetails
} from './repository';

export const seedDemoData = async () => {
    // 1. Check if we already have demo data
    const existing = await getRecipes();
    if (existing.some(r => r.name === '黄金比ハンバーグ')) {
        console.log('Demo data already exists, skipping seed.');
        return;
    }

    console.log('Starting demo data seed...');

    /**
     * 我が家の黄金比ハンバーグ - 改善の系譜 (5世代)
     */
    const burger = await createRecipe('黄金比ハンバーグ');
    const v1Id = burger.currentVersionId!;

    // --- Ver 1.0: 基本のハンバーグ ---
    const s1Tane = await addSection(burger.id, v1Id, 'タネ', 0);
    const s1Source = await addSection(burger.id, v1Id, 'ソース', 1);
    await addIngredient(burger.id, v1Id, s1Tane, '合挽肉', 300, 'g');
    await addIngredient(burger.id, v1Id, s1Tane, '玉ねぎ', 0.5, '個');
    await addIngredient(burger.id, v1Id, s1Tane, 'パン粉', 20, 'g');
    await addIngredient(burger.id, v1Id, s1Tane, '牛乳', 30, 'ml');
    await addIngredient(burger.id, v1Id, s1Tane, '塩', 3, 'g');
    await addIngredient(burger.id, v1Id, s1Source, 'ケチャップ', 50, 'g');
    await addIngredient(burger.id, v1Id, s1Source, 'ウスターソース', 50, 'g');
    await addStep(burger.id, v1Id, '玉ねぎを炒めて冷ます', 0, [s1Tane]);
    await addStep(burger.id, v1Id, '材料をすべて混ぜてこねる', 1, [s1Tane]);
    await addStep(burger.id, v1Id, '両面を焼き、ソースを絡める', 2, [s1Tane, s1Source]);

    // --- Ver 1.1: 野菜の甘みを追加 (玉ねぎ増量) ---
    const v11Id = await createNewVersionFromExisting(burger.id, v1Id, '子供が食べやすいよう、玉ねぎを1個に増やして甘みを出す。ソースの比率を調整。');
    let details = await getRecipeDetails(burger.id);
    let v11 = details?.versions?.find(v => v.id === v11Id);
    if (v11) {
        const tane = v11.sections?.find(s => s.name === 'タネ');
        const src = v11.sections?.find(s => s.name === 'ソース');
        const onion = tane?.ingredients?.find(i => i.name === '玉ねぎ');
        const ketchup = src?.ingredients?.find(i => i.name === 'ケチャップ');
        if (onion) await updateIngredient(burger.id, v11Id, onion.id, '玉ねぎ', 1.0, '個');
        if (ketchup) await updateIngredient(burger.id, v11Id, ketchup.id, 'ケチャップ', 40, 'g');
    }

    // --- Ver 1.2: 香辛料の探求 (ナツメグ導入) ---
    const v12Id = await createNewVersionFromExisting(burger.id, v11Id, 'お肉の臭みを消すためにナツメグを少量追加。香りが一気に本格的に。');
    details = await getRecipeDetails(burger.id);
    const v12 = details?.versions?.find(v => v.id === v12Id);
    if (v12) {
        const tane = v12.sections?.find(s => s.name === 'タネ');
        if (tane) await addIngredient(burger.id, v12Id, tane.id, 'ナツメグ', 0.5, 'g');
    }

    // --- Ver 1.3: ソースの革命 (赤ワイン) ---
    const v13Id = await createNewVersionFromExisting(burger.id, v12Id, 'ソースに赤ワインを加えてコクを出す。バターを最後に入れて艶を出し。');
    details = await getRecipeDetails(burger.id);
    const v13 = details?.versions?.find(v => v.id === v13Id);
    if (v13) {
        const src = v13.sections?.find(s => s.name === 'ソース');
        if (src) {
            await addIngredient(burger.id, v13Id, src.id, '赤ワイン', 30, 'ml');
            await addIngredient(burger.id, v13Id, src.id, 'バター', 10, 'g');
        }
    }

    // --- Ver 2.0: 究極の肉汁 (ゼラチン技) ---
    const v20Id = await createNewVersionFromExisting(burger.id, v13Id, '【完成】肉汁を閉じ込めるためにゼラチンパウダーを混ぜる。史上最高のジューシーさ。');
    details = await getRecipeDetails(burger.id);
    const v20 = details?.versions?.find(v => v.id === v20Id);
    if (v20) {
        const tane = v20.sections?.find(s => s.name === 'タネ');
        const steps = v20.steps || [];
        if (tane) await addIngredient(burger.id, v20Id, tane.id, '粉ゼラチン', 5, 'g');
        // Update first step description
        await addStep(burger.id, v20Id, 'ひき肉に塩とゼラチンを入れ、白っぽくなるまで練るのがコツ', 0, [tane.id]);
    }

    console.log('Demo data seed completed successfully!');
};
