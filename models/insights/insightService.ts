import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { ModelNameEnum } from 'models/types';
import { queryFunctions } from './queryFunctions';
import { InsightContext, InsightResult } from './types';

/**
 * InsightService
 * Main service for executing insight queries and generating narratives
 */
export class InsightService {
  fyo: Fyo;

  constructor(fyo: Fyo) {
    this.fyo = fyo;
  }

  /**
   * Get available query templates for a given context
   */
  async getTemplatesForContext(
    contextType: string,
    contextField: string,
    trustLevel: string[] = ['1', '2']
  ): Promise<Doc[]> {
    const templates = await this.fyo.db.getAll(
      ModelNameEnum.InsightQueryTemplate,
      {
        filters: {
          contextType,
          contextField,
          isActive: true,
          trustLevel: ['in', trustLevel],
        },
        orderBy: 'displayOrder',
        limit: 5,
      }
    );

    return templates;
  }

  /**
   * Execute a query template and return the result
   */
  async executeQueryTemplate(
    templateId: string,
    context: InsightContext
  ): Promise<InsightResult> {
    const template = await this.fyo.db.get(
      ModelNameEnum.InsightQueryTemplate,
      templateId
    );

    if (!template) {
      return {
        success: false,
        error: `Template ${templateId} not found`,
      };
    }

    const queryFunctionName = template.queryFunction as string;
    const queryFunction =
      queryFunctions[queryFunctionName as keyof typeof queryFunctions];

    if (!queryFunction) {
      return {
        success: false,
        error: `Query function ${queryFunctionName} not found`,
      };
    }

    try {
      const result = await queryFunction(this.fyo, context);
      return result;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Generate a narrative answer from query result
   */
  generateNarrative(template: Doc, queryResult: InsightResult): string {
    if (!queryResult.success || !queryResult.data) {
      return 'Unable to generate insight. Please try again.';
    }

    const answerTemplate = template.answerTemplate as string;
    let narrative = answerTemplate;

    for (const [key, value] of Object.entries(queryResult.data)) {
      const placeholder = `{${key}}`;
      const stringValue =
        typeof value === 'object' ? JSON.stringify(value) : String(value);
      narrative = narrative.replace(new RegExp(placeholder, 'g'), stringValue);
    }

    return narrative;
  }

  /**
   * Save insight narrative to database
   */
  async saveNarrative(
    templateId: string,
    context: InsightContext,
    questionAsked: string,
    narrativeAnswer: string,
    dataSnapshot: Record<string, unknown>,
    sourceDocuments: string[] = []
  ): Promise<Doc> {
    const narrative = this.fyo.doc.getNewDoc(ModelNameEnum.InsightNarrative);

    await narrative.set('queryTemplateUsed', templateId);
    await narrative.set(
      'contextReference',
      JSON.stringify({
        contextType: context.contextType,
        contextField: context.contextField,
      })
    );
    await narrative.set('questionAsked', questionAsked);
    await narrative.set('parametersApplied', JSON.stringify(context));
    await narrative.set('narrativeAnswer', narrativeAnswer);
    await narrative.set('dataSnapshot', JSON.stringify(dataSnapshot));
    await narrative.set('sourceDocuments', sourceDocuments.join(','));
    await narrative.set('sessionId', this.generateSessionId());

    await narrative.insert();
    return narrative;
  }

  /**
   * Generate a session ID for grouping related queries
   */
  generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recent narratives for a user
   */
  async getRecentNarratives(limit = 10): Promise<Doc[]> {
    const narratives = await this.fyo.db.getAll(
      ModelNameEnum.InsightNarrative,
      {
        orderBy: 'timestamp',
        order: 'desc',
        limit,
      }
    );

    return narratives;
  }

  /**
   * Complete workflow: Get templates, execute, generate narrative, and save
   */
  async generateInsight(
    contextType: string,
    contextField: string,
    templateId: string,
    context: InsightContext
  ): Promise<{ narrative: string; doc: Doc }> {
    context.contextType = contextType;
    context.contextField = contextField;

    const template = await this.fyo.db.get(
      ModelNameEnum.InsightQueryTemplate,
      templateId
    );

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const result = await this.executeQueryTemplate(templateId, context);

    if (!result.success) {
      throw new Error(result.error || 'Failed to execute query');
    }

    const narrative = this.generateNarrative(template, result);
    const doc = await this.saveNarrative(
      templateId,
      context,
      template.questionText as string,
      narrative,
      result.data || {},
      []
    );

    return { narrative, doc };
  }
}

/**
 * Factory function to create InsightService instance
 */
export function createInsightService(fyo: Fyo): InsightService {
  return new InsightService(fyo);
}
