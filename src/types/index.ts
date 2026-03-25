export interface Recipe {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  isPublic?: boolean;
  isShowcase?: boolean;
  originRecipeId?: string | null; // ID of the original recipe this was copied/imported from
  currentVersionId?: string;
  latestVersionNumber?: string;
  latestVersionDate?: string;
  tags?: string[];
  category?: string; // Standardized category ID
  imageUrl?: string; // Main recipe image URL from Firebase Storage
  likeCount?: number; // Total number of likes for this recipe
  versions?: Version[];
}

export interface Version {
  id: string;
  recipeId: string;
  isPublic?: boolean;
  parentVersionId?: string;
  versionNumber: string;
  notes?: string;
  createdAt: string;
  baseServings: number;
  sections?: Section[];
  steps?: Step[];              // Version-level steps in chronological order
}

export interface Section {
  id: string;
  versionId: string;
  name: string;
  orderIndex: number;
  ingredients?: Ingredient[];
}

export interface Step {
  id: string;
  versionId: string;          // Belongs to Version, not Section
  description: string;
  orderIndex: number;
  durationSeconds?: number;
  imageUrl?: string;
  stepSections?: StepSection[]; // Which sections this step uses
}

export interface StepSection {
  id: string;
  stepId: string;
  sectionId: string;
  section?: Section;          // Optional: populated section data
}

export interface Ingredient {
  id: string;
  sectionId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface PresetRecipe {
    id: string;
    name: string;
    description: string;
    category: string;
    baseServings?: number;
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
export type UserPlan = 'free' | 'standard';

export interface UserProfile {
    uid: string;
    plan: UserPlan;
    isPremium: boolean;
}
