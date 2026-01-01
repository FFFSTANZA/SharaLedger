import { BalanceSheet } from './BalanceSheet/BalanceSheet';
import { GeneralLedger } from './GeneralLedger/GeneralLedger';
import { GSTR1 } from './GoodsAndServiceTax/GSTR1';
import { GSTR2 } from './GoodsAndServiceTax/GSTR2';
import { GSTR3B } from './GoodsAndServiceTax/GSTR3B';
import { PayablesAgeing } from './PayablesAgeing';
import { ProfitAndLoss } from './ProfitAndLoss/ProfitAndLoss';
import { ReceivablesAgeing } from './ReceivablesAgeing';
import { TrialBalance } from './TrialBalance/TrialBalance';
import { StockBalance } from './inventory/StockBalance';
import { StockLedger } from './inventory/StockLedger';

export const reports = {
  GeneralLedger,
  ProfitAndLoss,
  BalanceSheet,
  TrialBalance,
  ReceivablesAgeing,
  PayablesAgeing,
  GSTR1,
  GSTR2,
  GSTR3B,
  StockLedger,
  StockBalance,
} as const;
