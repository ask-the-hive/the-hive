import { BaseTradeAction } from '@/ai/base/actions/trade';
import { BASE_TRADE_NAME } from '@/ai/base/actions/trade/actions/name';
import { BaseGetWalletAddressAction } from '@/ai/base/actions/wallet/get-wallet-address';
import { BASE_GET_WALLET_ADDRESS_NAME } from '@/ai/base/actions/wallet/get-wallet-address/name';
import { baseTool } from '@/ai/base';
import { UI_DECISION_RESPONSE_NAME } from '@/ai/ui/decision-response/name';
import { decisionResponseTool } from '@/ai/ui/decision-response/tool';

export const BASE_TRADING_TOOLS = {
  [`basetrading-${UI_DECISION_RESPONSE_NAME}`]: decisionResponseTool,
  [`basetrading-${BASE_GET_WALLET_ADDRESS_NAME}`]: baseTool(new BaseGetWalletAddressAction()),
  [`basetrading-${BASE_TRADE_NAME}`]: baseTool(new BaseTradeAction()),
};
