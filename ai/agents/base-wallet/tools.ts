import { BASE_GET_WALLET_ADDRESS_NAME } from '@/ai/base/actions/wallet/get-wallet-address/name';
import { BASE_BALANCE_NAME } from '@/ai/base/actions/wallet/balance/name';
import { BASE_ALL_BALANCES_NAME } from '@/ai/base/actions/wallet/all-balances/name';
import { BASE_TRANSFER_NAME } from '@/ai/base/actions/wallet/transfer/name';
import { baseTool } from '@/ai/base/index';
import { BaseGetWalletAddressAction } from '@/ai/base/actions/wallet/get-wallet-address';
import { BaseBalanceAction } from '@/ai/base/actions/wallet/balance';
import { BaseAllBalancesAction } from '@/ai/base/actions/wallet/all-balances';
import { BaseTransferAction } from '@/ai/base/actions/wallet/transfer';
import { UI_DECISION_RESPONSE_NAME } from '@/ai/ui/decision-response/name';
import { decisionResponseTool } from '@/ai/ui/decision-response/tool';

export const BASE_WALLET_TOOLS = {
  [`basewallet-${UI_DECISION_RESPONSE_NAME}`]: decisionResponseTool,
  [`basewallet-${BASE_GET_WALLET_ADDRESS_NAME}`]: baseTool(new BaseGetWalletAddressAction()),
  [`basewallet-${BASE_BALANCE_NAME}`]: baseTool(new BaseBalanceAction()),
  [`basewallet-${BASE_ALL_BALANCES_NAME}`]: baseTool(new BaseAllBalancesAction()),
  [`basewallet-${BASE_TRANSFER_NAME}`]: baseTool(new BaseTransferAction()),
};
