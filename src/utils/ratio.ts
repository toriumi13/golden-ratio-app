import { getDensity, getTasteData, TasteCategory, TASTE_LABELS } from '../constants/densities';

/**
 * Get an estimated "virtual weight" in grams for a given quantity, unit, and ingredient name.
 * This is used to normalize the visualization of the ratio bars when units are mixed.
 */
export const getVirtualWeight = (quantity: number, unit: string, name: string = ''): number => {
    if (!unit || unit.includes('適量') || unit.includes('少々')) return 0;

    const u = unit.toLowerCase();
    const density = getDensity(name);

    // 1. Weight/Volume (Base 1.0)
    if (u === 'g' || u === 'ml' || u === 'cc' || u === 'グラム' || u === 'ミリリットル') {
        return quantity;
    }
    if (u === 'kg' || u === 'キロ') {
        return quantity * 1000;
    }

    // 2. Tablespoon/Teaspoon (Density aware)
    if (u.includes('大さじ') || u.includes('tbsp')) {
        return quantity * (density ? density.tbsp : 15);
    }
    if (u.includes('小さじ') || u.includes('tsp')) {
        return quantity * (density ? density.tsp : 5);
    }
    if (u.includes('カップ') || u.includes('cup')) {
        return quantity * (density?.cup ? density.cup : 200);
    }

    // 3. Large standalone items (Onion, Egg, etc.) ~ 150g-200g
    if (u.includes('個') || u.includes('玉') || u.includes('かけ') || u.includes('片') || u.includes('個分')) {
        return quantity * 150;
    }

    // 4. Long items (Carrot, Cucumber, Green onion) ~ 100g
    if (u.includes('本') || u.includes('束')) {
        return quantity * 100;
    }

    // 5. Leafs/Small items
    if (u.includes('枚')) {
        return quantity * 10;
    }

    // Default fallback: treat as weight
    return quantity;
};

/**
 * Calculate the width percentage for a ratio bar based on virtual weights.
 */
export const getRatioWidth = (quantity: number, unit: string, name: string, maxVirtualWeight: number): string => {
    const weight = getVirtualWeight(quantity, unit, name);

    // If weight is 0 (e.g. "to taste"), show a minimal visible bar (5%)
    if (weight === 0) return '5%';
    if (maxVirtualWeight === 0) return '0%';

    // Linear normalization
    const percentage = (weight / maxVirtualWeight) * 100;
    // Ensure at least 5% width for visibility
    return `${Math.min(100, Math.max(5, percentage))}%`;
};

/**
 * Calculate taste scores for radar chart based on normalized weights and intensity (potency) of ingredients.
 */
export const calculateTasteScores = (ingredients: { name: string; quantity: number; unit: string }[]) => {
    // Re-ordered 6 keys for clockwise radar chart placement
    const scores: Record<TasteCategory, number> = {
        salt: 0,   // 12 o'clock
        sweet: 0,  // 2 o'clock
        umami: 0,  // 4 o'clock
        bitter: 0, // 6 o'clock
        sour: 0,   // 8 o'clock
        spicy: 0   // 10 o'clock
    };

    ingredients.forEach(ing => {
        const tasteData = getTasteData(ing.name);
        if (tasteData) {
            const weight = getVirtualWeight(ing.quantity, ing.unit, ing.name);
            // Multiply weight by potency to get "perceived" intensity
            scores[tasteData.category] += weight * tasteData.potency;
        }
    });

    // Normalize scores to 0-100 range for the chart
    const values = Object.values(scores);
    const maxScore = Math.max(...values, 0);

    return Object.entries(scores).map(([key, value]) => ({
        key: key as TasteCategory,
        label: TASTE_LABELS[key as TasteCategory],
        value: maxScore > 0 ? (value / maxScore) * 100 : 0
    }));
};
