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
    user: () => 'Unknown',
  };

  /* eslint-disable @typescript-eslint/require-await */
  async beforeSync() {
    // Auto-populate narrativeId and timestamp if not set
    if (!this.narrativeId && this.name) {
      this.narrativeId = this.name;
    }

    if (!this.timestamp) {
      this.timestamp = new Date();
    }

    // Set user from auth if not already set
    if (!this.user || this.user === 'Unknown') {
      this.user = this.fyo.auth?.user ?? 'Unknown';
    }
  }
  /* eslint-enable @typescript-eslint/require-await */

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
