import { Doc } from 'fyo/model/doc';
import { ListViewSettings, DefaultMap } from 'fyo/model/types';

export class InsightNarrative extends Doc {
  narrativeId?: string;
  user?: string;
  timestamp?: Date;
  contextReference?: string;
  queryTemplateUsed?: string;
  questionAsked?: string;
  parametersApplied?: string;
  narrativeAnswer?: string;
  dataSnapshot?: string;
  sourceDocuments?: string;
  breadcrumbTrail?: string;
  sessionId?: string;

  static defaults: DefaultMap = {
    timestamp: () => new Date().toISOString(),
  };

  beforeInsert() {
    this.narrativeId = this.name;
    this.user = this.fyo.auth?.user ?? 'Unknown';
    this.timestamp = new Date();
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'name',
        'user',
        'timestamp',
        'queryTemplateUsed',
        'questionAsked',
      ],
    };
  }
}
