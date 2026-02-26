/**
 * Get an estimated "virtual weight" in grams for a given quantity and unit.
 * This is used to normalize the visualization of the ratio bars when units are mixed (e.g., grams vs pieces).
 */
export const getVirtualWeight = (quantity: number, unit: string): number => {
    if (!unit || unit.includes('適量') || unit.includes('少々')) return 0;

    const u = unit.toLowerCase();

    // 1. Weight/Volume (Base 1.0)
    if (u === 'g' || u === 'ml' || u === 'cc' || u === 'グラム' || u === 'ミリリットル') {
        return quantity;
    }
    if (u === 'kg' || u === 'キロ') {
        return quantity * 1000;
    }

    // 2. Large standalone items (Onion, Egg, etc.) ~ 150g-200g
    if (u.includes('個') || u.includes('玉') || u.includes('かけ') || u.includes('片') || u.includes('個分')) {
        return quantity * 150;
    }

    // 3. Long items (Carrot, Cucumber, Green onion) ~ 100g
    if (u.includes('本') || u.includes('束')) {
        return quantity * 100;
    }

    // 4. Tablespoon/Teaspoon
    if (u.includes('大さじ') || u.includes('tbsp')) {
        return quantity * 15;
    }
    if (u.includes('小さじ') || u.includes('tsp')) {
        return quantity * 5;
    }

    // 5. Leafs/Small items
    if (u.includes('枚') || u.includes('片')) {
        return quantity * 10;
    }

    // Default fallback: treat as weight
    return quantity;
};

/**
 * Calculate the width percentage for a ratio bar based on virtual weights.
 * Using a slight logarithmic adjustment can help to keep very small items visible,
 * but for now, we'll start with linear comparison of virtual weights.
 */
export const getRatioWidth = (quantity: number, unit: string, maxVirtualWeight: number): string => {
    const weight = getVirtualWeight(quantity, unit);
    if (weight === 0 || maxVirtualWeight === 0) return '0%';

    // Linear normalization
    const percentage = (weight / maxVirtualWeight) * 100;
    return `${Math.min(100, Math.max(2, percentage))}%`;
};
