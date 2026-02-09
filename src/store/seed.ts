import {
    createRecipe,
    addSection,
    addIngredient,
    addStep,
    createNewVersionFromExisting,
    getRecipes,
    updateIngredient,
    deleteIngredient
} from './repository';

export const seedDemoData = async () => {
    // 1. Check if we already have demo data
    const existing = await getRecipes();
    if (existing.some(r => r.name === '黄金比ハンバーグ')) {
        console.log('Demo data already exists, skipping seed.');
        return;
    }

    console.log('Starting demo data seed...');

    // --- Recipe 1: 我が家の黄金比ハンバーグ ---
    const burger = await createRecipe('黄金比ハンバーグ');
    const v1Id = burger.currentVersionId!;

    // Sections for V1.0
    const secTaneV1 = await addSection(burger.id, v1Id, 'タネ', 0);
    const secSourceV1 = await addSection(burger.id, v1Id, 'ソース', 1);

    // Ingredients for V1.0 - Tane
    await addIngredient(burger.id, v1Id, secTaneV1, '合挽肉', 300, 'g');
    await addIngredient(burger.id, v1Id, secTaneV1, '玉ねぎ', 0.5, '個');
    await addIngredient(burger.id, v1Id, secTaneV1, 'パン粉', 20, 'g');
    await addIngredient(burger.id, v1Id, secTaneV1, '牛乳', 30, 'ml');
    await addIngredient(burger.id, v1Id, secTaneV1, '塩', 3, 'g');

    // Ingredients for V1.0 - Source
    await addIngredient(burger.id, v1Id, secSourceV1, 'ケチャップ', 50, 'g');
    await addIngredient(burger.id, v1Id, secSourceV1, 'ウスターソース', 50, 'g');

    // Steps for V1.0
    await addStep(burger.id, v1Id, '玉ねぎをみじん切りにして炒め、冷ます', 0, [secTaneV1]);
    await addStep(burger.id, v1Id, 'ボウルにタネの材料をすべて入れ、粘りが出るまでこねる', 1, [secTaneV1]);
    await addStep(burger.id, v1Id, '成形してフライパンで両面を焼く', 2, [secTaneV1]);
    await addStep(burger.id, v1Id, '余分な油を捨て、ソースの材料を入れて煮詰める', 3, [secTaneV1, secSourceV1]);

    // --- Create Ver 1.1 (Modified Version) ---
    const v11Id = await createNewVersionFromExisting(burger.id, v1Id, '玉ねぎを増やしてジューシーさをアップ。ソースのケチャップを少し減らしてみた。');

    // In V1.1, find the sections (they are duplicated)
    const burgerDetails = (await import('./repository')).getRecipeDetails;
    const recipeV11 = await burgerDetails(burger.id);
    const ver11 = recipeV11?.versions?.find(v => v.id === v11Id);

    if (ver11) {
        const tane11 = ver11.sections?.find(s => s.name === 'タネ');
        const source11 = ver11.sections?.find(s => s.name === 'ソース');

        if (tane11 && tane11.ingredients) {
            const onion = tane11.ingredients.find(i => i.name === '玉ねぎ');
            if (onion) {
                await updateIngredient(burger.id, v11Id, onion.id, '玉ねぎ', 1.0, '個');
            }
        }

        if (source11 && source11.ingredients) {
            const ketchup = source11.ingredients.find(i => i.name === 'ケチャップ');
            if (ketchup) {
                await updateIngredient(burger.id, v11Id, ketchup.id, 'ケチャップ', 40, 'g');
            }
        }
    }

    // --- Recipe 2: 至高のペペロンチーノ ---
    const pasta = await createRecipe('至高のペペロンチーノ');
    const pv1Id = pasta.currentVersionId!;
    const secPasta = await addSection(pasta.id, pv1Id, 'メイン', 0);

    await addIngredient(pasta.id, pv1Id, secPasta, 'パスタ(1.6mm)', 100, 'g');
    await addIngredient(pasta.id, pv1Id, secPasta, 'にんにく', 2, '片');
    await addIngredient(pasta.id, pv1Id, secPasta, '唐辛子', 1, '本');
    await addIngredient(pasta.id, pv1Id, secPasta, 'オリーブオイル', 30, 'ml');
    await addIngredient(pasta.id, pv1Id, secPasta, 'ゆで汁', 50, 'ml');

    await addStep(pasta.id, pv1Id, 'にんにくを冷たいオイルから弱火でじっくり加熱する', 0, [secPasta]);
    await addStep(pasta.id, pv1Id, 'パスタを表記時間より1分短く茹でる', 1, [secPasta]);
    await addStep(pasta.id, pv1Id, 'オイルの中にゆで汁を入れ、乳化させる', 2, [secPasta]);

    console.log('Demo data seed completed successfully!');
};
