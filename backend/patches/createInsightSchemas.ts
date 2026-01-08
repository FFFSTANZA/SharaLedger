import { ModelNameEnum } from 'models/types';
import { DatabaseManager } from '../database/manager';

/**
 * Create InsightQueryTemplate and InsightNarrative tables
 * This patch ensures tables exist for Zero-Argument Accounting system
 */
async function execute(dm: DatabaseManager) {
  const db = dm.db;

  // Check if tables already exist
  const hasQueryTemplateTable = await db.knex?.schema.hasTable(
    ModelNameEnum.InsightQueryTemplate
  );
  const hasNarrativeTable = await db.knex?.schema.hasTable(
    ModelNameEnum.InsightNarrative
  );

  if (hasQueryTemplateTable && hasNarrativeTable) {
    // Tables already exist, skip
    return;
  }

  // Create InsightQueryTemplate table if not exists
  if (!hasQueryTemplateTable) {
    await db.knex?.schema.createTable(
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
          .defaultTo(db.knex?.fn.now());
        table
          .timestamp('modifiedAt', { useTz: false })
          .defaultTo(db.knex?.fn.now());
      }
    );
  }

  // Create InsightNarrative table if not exists
  if (!hasNarrativeTable) {
    await db.knex?.schema.createTable(
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
          .defaultTo(db.knex?.fn.now());
        table
          .timestamp('modifiedAt', { useTz: false })
          .defaultTo(db.knex?.fn.now());
      }
    );
  }
}

export default { execute };
