import { BscTradeAction } from '@/ai/bsc/actions/trade';
import { BSC_TRADE_NAME } from '@/ai/bsc/actions/trade/actions/name';
import { BscGetWalletAddressAction } from '@/ai/bsc/actions/wallet/get-wallet-address';
import { BSC_GET_WALLET_ADDRESS_NAME } from '@/ai/bsc/actions/wallet/get-wallet-address/name';
import { bscTool } from '@/ai/bsc';
import { UI_DECISION_RESPONSE_NAME } from '@/ai/ui/decision-response/name';
import { decisionResponseTool } from '@/ai/ui/decision-response/tool';

export const BSC_TRADING_TOOLS = {
  [`bsctrading-${UI_DECISION_RESPONSE_NAME}`]: decisionResponseTool,
  [`bsctrading-${BSC_GET_WALLET_ADDRESS_NAME}`]: bscTool(new BscGetWalletAddressAction()),
  [`bsctrading-${BSC_TRADE_NAME}`]: bscTool(new BscTradeAction()),
};
