import * as SQLite from 'expo-sqlite';

export const initDatabase = async (db: SQLite.SQLiteDatabase) => {
  try {
    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Recipes table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        current_version_id TEXT
      );
    `);

    // Versions table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS versions (
        id TEXT PRIMARY KEY NOT NULL,
        recipe_id TEXT NOT NULL,
        parent_version_id TEXT,
        version_number TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_version_id) REFERENCES versions(id) ON DELETE SET NULL
      );
    `);

    // Sections table (material groups)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sections (
        id TEXT PRIMARY KEY NOT NULL,
        version_id TEXT NOT NULL,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
      );
    `);

    // Ingredients table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id TEXT PRIMARY KEY NOT NULL,
        section_id TEXT NOT NULL,
        name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
      );
    `);

    // Steps table (version-level, chronological)
    // NOTE: If this table already existed with section_id, we might need to handle it.
    // For now, we attempt to create it.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS steps (
        id TEXT PRIMARY KEY NOT NULL,
        version_id TEXT NOT NULL,
        description TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        duration_seconds INTEGER,
        image_url TEXT,
        FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
      );
    `);

    // Step-Section relationship table (many-to-many)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS step_sections (
        id TEXT PRIMARY KEY NOT NULL,
        step_id TEXT NOT NULL,
        section_id TEXT NOT NULL,
        FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE,
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
      );
    `);

    // Create indexes individually
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_versions_recipe ON versions(recipe_id);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_sections_version ON sections(version_id);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_ingredients_section ON ingredients(section_id);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_steps_version ON steps(version_id);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_step_sections_step ON step_sections(step_id);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_step_sections_section ON step_sections(section_id);');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};
