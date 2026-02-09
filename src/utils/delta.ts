import { Version, Ingredient, Step } from '../types';

export interface IngredientDiff {
    name: string;
    unit: string;
    oldQuantity?: number;
    newQuantity?: number;
    change: 'added' | 'removed' | 'changed' | 'unchanged';
}

export interface StepDiff {
    description: string;
    change: 'added' | 'removed' | 'unchanged';
}

export const compareVersions = (oldVer: Version, newVer: Version) => {
    // 1. Flat list of ingredients for both versions
    const oldIngs: Record<string, Ingredient> = {};
    oldVer.sections?.forEach(s => {
        s.ingredients?.forEach(ing => {
            oldIngs[ing.name] = ing;
        });
    });

    const newIngs: Record<string, Ingredient> = {};
    newVer.sections?.forEach(s => {
        s.ingredients?.forEach(ing => {
            newIngs[ing.name] = ing;
        });
    });

    // 2. Calculate Ingredient Diffs
    const allNames = Array.from(new Set([...Object.keys(oldIngs), ...Object.keys(newIngs)]));
    const ingredientDiffs: IngredientDiff[] = allNames.map(name => {
        const oldI = oldIngs[name];
        const newI = newIngs[name];

        if (!oldI) return { name, unit: newI.unit, newQuantity: newI.quantity, change: 'added' };
        if (!newI) return { name, unit: oldI.unit, oldQuantity: oldI.quantity, change: 'removed' };

        if (oldI.quantity !== newI.quantity) {
            return { name, unit: newI.unit, oldQuantity: oldI.quantity, newQuantity: newI.quantity, change: 'changed' };
        }

        return { name, unit: newI.unit, oldQuantity: oldI.quantity, newQuantity: newI.quantity, change: 'unchanged' };
    });

    // 3. Step Diff (Simple description based check for MVP)
    const oldStepDescs = oldVer.steps?.map(s => s.description) || [];
    const newStepDescs = newVer.steps?.map(s => s.description) || [];

    const stepDiffs: StepDiff[] = [];

    // Basic comparison: just show what's new or removed in the lists
    newStepDescs.forEach(desc => {
        if (!oldStepDescs.includes(desc)) {
            stepDiffs.push({ description: desc, change: 'added' });
        }
    });

    oldStepDescs.forEach(desc => {
        if (!newStepDescs.includes(desc)) {
            stepDiffs.push({ description: desc, change: 'removed' });
        }
    });

    return {
        ingredientDiffs: ingredientDiffs.filter(d => d.change !== 'unchanged'),
        stepDiffs
    };
};
