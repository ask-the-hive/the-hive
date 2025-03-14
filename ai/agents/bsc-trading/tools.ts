import { BscTradeAction } from "@/ai/bsc/actions/trade";
import { BSC_TRADE_NAME } from "@/ai/bsc/actions/trade/actions/name";
import { BscGetWalletAddressAction } from "@/ai/bsc/actions/wallet/get-wallet-address";
import { BSC_GET_WALLET_ADDRESS_NAME } from "@/ai/bsc/actions/wallet/get-wallet-address/name";
import { bscTool } from "@/ai/bsc";

export const BSC_TRADING_TOOLS = {
    [`bsctrading-${BSC_GET_WALLET_ADDRESS_NAME}`]: bscTool(new BscGetWalletAddressAction()),
    [`bsctrading-${BSC_TRADE_NAME}`]: bscTool(new BscTradeAction()),
}; 