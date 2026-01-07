import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export class InsightQueryTemplate extends Doc {
  templateId?: string;
  contextType?: string;
  contextField?: string;
  questionText?: string;
  queryFunction?: string;
  answerTemplate?: string;
  requiredDoctypes?: string;
  isActive?: boolean;
  trustLevel?: string;
  displayOrder?: number;
  availableParameters?: string;

  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'templateId',
        'contextType',
        'contextField',
        'questionText',
        'isActive',
        'trustLevel',
        'displayOrder',
      ],
    };
  }
}
