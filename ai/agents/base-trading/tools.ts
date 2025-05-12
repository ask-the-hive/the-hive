import { BaseTradeAction } from "@/ai/base/actions/trade";
import { BASE_TRADE_NAME } from "@/ai/base/actions/trade/actions/name";
import { BaseGetWalletAddressAction } from "@/ai/base/actions/wallet/get-wallet-address";
import { BASE_GET_WALLET_ADDRESS_NAME } from "@/ai/base/actions/wallet/get-wallet-address/name";
import { baseTool } from "@/ai/base";

export const BASE_TRADING_TOOLS = {
    [`basetrading-${BASE_GET_WALLET_ADDRESS_NAME}`]: baseTool(new BaseGetWalletAddressAction()),
    [`basetrading-${BASE_TRADE_NAME}`]: baseTool(new BaseTradeAction()),
}; 