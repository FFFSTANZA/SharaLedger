import { Doc } from 'fyo/model/doc';

export class TDSCategory extends Doc {
  name?: string;
  tdsSection?: string;
  notes?: string;
}
