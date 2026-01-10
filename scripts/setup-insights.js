/**
 * Setup script for Zero-Argument Accounting system
 * This script creates the necessary database tables and loads query templates
 */

const path = require('path');
const DatabaseManager = require('../backend/database/manager').DatabaseManager;
const { ModelNameEnum } = require('../models/types');

async function setupInsights() {
  console.log('🔧 Setting up Zero-Argument Accounting system...\n');

  try {
    // Initialize database manager
    const dbManager = new DatabaseManager(path.join(__dirname, '../data'));
    await dbManager.init();

    console.log('✅ Database manager initialized');

    // Create tables
    await createInsightTables(dbManager);

    // Load query templates
    await loadQueryTemplates(dbManager);

    console.log('\n🎉 Zero-Argument Accounting system is ready!');
    console.log(
      '💡 You can now right-click on numeric values in reports to ask questions'
    );
  } catch (error) {
    console.error('❌ Error setting up insights:', error);
    process.exit(1);
  }
}

async function createInsightTables(dbManager) {
  const db = dbManager.db;

  console.log('📊 Creating insight tables...');

  // Check if tables already exist
  const hasQueryTemplateTable = await db.knex.schema.hasTable(
    ModelNameEnum.InsightQueryTemplate
  );
  const hasNarrativeTable = await db.knex.schema.hasTable(
    ModelNameEnum.InsightNarrative
  );

  if (hasQueryTemplateTable && hasNarrativeTable) {
    console.log('✅ Tables already exist, skipping creation');
    return;
  }

  // Create InsightQueryTemplate table
  if (!hasQueryTemplateTable) {
    await db.knex.schema.createTable(
      ModelNameEnum.InsightQueryTemplate,
      (table) => {
        table.string('name').primary();
        table.string('templateId', 255).notNullable().unique();
        table.string('contextType', 50).notNullable();
        table.string('contextField', 255).notNullable();
        table.text('questionText').notNullable();
        table.string('queryFunction', 255).notNullable();
        table.text('answerTemplate').notNullable();
        table.text('requiredDoctypes');
        table.integer('isActive').defaultTo(1);
        table.string('trustLevel', 10).defaultTo('1');
        table.integer('displayOrder').defaultTo(10);
        table.text('availableParameters');
        table
          .timestamp('createdAt', { useTz: false })
          .defaultTo(db.knex.fn.now());
        table
          .timestamp('modifiedAt', { useTz: false })
          .defaultTo(db.knex.fn.now());
      }
    );
    console.log('✅ Created InsightQueryTemplate table');
  }

  // Create InsightNarrative table
  if (!hasNarrativeTable) {
    await db.knex.schema.createTable(
      ModelNameEnum.InsightNarrative,
      (table) => {
        table.increments('name', { primaryKey: false }).primary();
        table.string('narrativeId', 255);
        table.string('user', 255).notNullable().defaultTo('Unknown');
        table.datetime('timestamp').notNullable();
        table.text('contextReference');
        table.string('queryTemplateUsed', 255);
        table.text('questionAsked');
        table.text('parametersApplied');
        table.text('narrativeAnswer');
        table.text('dataSnapshot');
        table.text('sourceDocuments');
        table.text('breadcrumbTrail');
        table.string('sessionId', 255);
        table
          .timestamp('createdAt', { useTz: false })
          .defaultTo(db.knex.fn.now());
        table
          .timestamp('modifiedAt', { useTz: false })
          .defaultTo(db.knex.fn.now());
      }
    );
    console.log('✅ Created InsightNarrative table');
  }
}

async function loadQueryTemplates(dbManager) {
  const db = dbManager.db;

  console.log('📝 Loading query templates...');

  // Load fixtures
  const fixtures = require('../fixtures/insightQueryTemplates.json');

  // Check if templates already exist
  const existingTemplates = await db.getAll(
    `SELECT name FROM ${ModelNameEnum.InsightQueryTemplate}`
  );

  if (existingTemplates.length > 0) {
    console.log(
      `✅ Found ${existingTemplates.length} existing templates, skipping load`
    );
    return;
  }

  // Insert templates
  for (const template of fixtures) {
    const {
      name,
      templateId,
      contextType,
      contextField,
      questionText,
      queryFunction,
      answerTemplate,
      requiredDoctypes,
      isActive,
      trustLevel,
      displayOrder,
      availableParameters,
    } = template;

    await db.insert(ModelNameEnum.InsightQueryTemplate, {
      name,
      templateId,
      contextType,
      contextField,
      questionText,
      queryFunction,
      answerTemplate,
      requiredDoctypes,
      isActive,
      trustLevel,
      displayOrder,
      availableParameters: availableParameters || null,
    });
  }

  console.log(`✅ Loaded ${fixtures.length} query templates`);
}

// Run setup
setupInsights();
