export interface Recipe {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  isPublic?: boolean;
  originRecipeId?: string | null; // ID of the original recipe this was copied/imported from
  currentVersionId?: string;
  latestVersionNumber?: string;
  latestVersionDate?: string;
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
