#!/usr/bin/env node

/**
 * Setup script for Zero-Argument Accounting system
 * This creates the necessary database tables and loads query templates
 */

const fs = require('fs');
const path = require('path');

async function setupInsights() {
  console.log('🔧 Setting up Zero-Argument Accounting system...\n');

  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ Created data directory');
    }

    // Initialize simple SQLite database with the correct path
    const dbPath = path.join(__dirname, 'demo.db');

    // Check if database already exists and has insight tables
    const hasDb = fs.existsSync(dbPath);
    let needsSetup = true;

    if (hasDb) {
      // Try to connect and check if insight tables exist
      try {
        const Database = require('better-sqlite3');
        const db = new Database(dbPath, { readonly: true });

        const tables = db
          .prepare("SELECT name FROM sqlite_master WHERE type='table'")
          .all();
        const tableNames = tables.map((t) => t.name);

        if (
          tableNames.includes('InsightQueryTemplate') &&
          tableNames.includes('InsightNarrative')
        ) {
          needsSetup = false;
          console.log('✅ Insight tables already exist');
        }

        db.close();
      } catch (error) {
        console.log(
          '⚠️  Database exists but could not be checked:',
          error.message
        );
      }
    }

    if (needsSetup) {
      await createInsightTables(dbPath);
      await loadQueryTemplates(dbPath);
    }

    console.log('\n🎉 Zero-Argument Accounting system is ready!');
    console.log(
      '💡 You can now right-click on numeric values in reports to ask questions'
    );
    console.log(
      '📊 The feature will work after you create a company and some transactions'
    );
    console.log('\n🚀 To use the feature:');
    console.log('   1. Start the app');
    console.log('   2. Create a company and add some transactions');
    console.log('   3. Go to any report with numeric values');
    console.log('   4. Right-click on any numeric value');
    console.log('   5. Select "Ask a question about this value"');
  } catch (error) {
    console.error('❌ Error setting up insights:', error);
    process.exit(1);
  }
}

async function createInsightTables(dbPath) {
  console.log('📊 Creating insight tables...');

  const Database = require('better-sqlite3');
  const db = new Database(dbPath);

  try {
    // Create InsightQueryTemplate table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS InsightQueryTemplate (
        name TEXT PRIMARY KEY,
        templateId TEXT NOT NULL UNIQUE,
        contextType TEXT NOT NULL,
        contextField TEXT NOT NULL,
        questionText TEXT NOT NULL,
        queryFunction TEXT NOT NULL,
        answerTemplate TEXT NOT NULL,
        requiredDoctypes TEXT,
        isActive INTEGER DEFAULT 1,
        trustLevel TEXT DEFAULT '1',
        displayOrder INTEGER DEFAULT 10,
        availableParameters TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        modifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create InsightNarrative table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS InsightNarrative (
        name INTEGER PRIMARY KEY AUTOINCREMENT,
        narrativeId TEXT,
        user TEXT NOT NULL DEFAULT 'Unknown',
        timestamp DATETIME NOT NULL,
        contextReference TEXT,
        queryTemplateUsed TEXT,
        questionAsked TEXT,
        parametersApplied TEXT,
        narrativeAnswer TEXT,
        dataSnapshot TEXT,
        sourceDocuments TEXT,
        breadcrumbTrail TEXT,
        sessionId TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        modifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Created insight tables');
  } finally {
    db.close();
  }
}

async function loadQueryTemplates(dbPath) {
  console.log('📝 Loading query templates...');

  const Database = require('better-sqlite3');
  const db = new Database(dbPath);

  try {
    // Load fixtures
    const fixturesPath = path.join(
      __dirname,
      'fixtures/insightQueryTemplates.json'
    );
    const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));

    // Check if templates already exist
    const existingCount = db
      .prepare('SELECT COUNT(*) as count FROM InsightQueryTemplate')
      .get();

    if (existingCount.count > 0) {
      console.log(
        `✅ Found ${existingCount.count} existing templates, skipping load`
      );
      return;
    }

    // Insert templates
    const insertStmt = db.prepare(`
      INSERT INTO InsightQueryTemplate (
        name, templateId, contextType, contextField, questionText,
        queryFunction, answerTemplate, requiredDoctypes, isActive,
        trustLevel, displayOrder, availableParameters
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const template of fixtures) {
      insertStmt.run(
        template.name,
        template.templateId,
        template.contextType,
        template.contextField,
        template.questionText,
        template.queryFunction,
        template.answerTemplate,
        template.requiredDoctypes || null,
        template.isActive || 1,
        template.trustLevel || '1',
        template.displayOrder || 10,
        template.availableParameters || null
      );
    }

    console.log(`✅ Loaded ${fixtures.length} query templates`);
  } finally {
    db.close();
  }
}

// Run setup
setupInsights().catch(console.error);
