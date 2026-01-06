import { SchemaStub } from '../../types';
import AccountingSettings from './AccountingSettings.json';
import Address from './Address.json';
import InvoiceItem from './InvoiceItem.json';
import Item from './Item.json';
import Party from './Party.json';
import TDSSection from './TDSSection.json';
import TDSCategory from './TDSCategory.json';
import EWayBill from './EWayBill.json';

export default [
  AccountingSettings,
  Address,
  Party,
  Item,
  InvoiceItem,
  TDSSection,
  TDSCategory,
  EWayBill,
] as SchemaStub[];
