import { BscGetWalletAddressAction } from "@/ai/bsc/actions/wallet/get-wallet-address";
import { BSC_GET_WALLET_ADDRESS_NAME } from "@/ai/bsc/actions/wallet/get-wallet-address/name";
import { bscTool } from "@/ai/bsc";

export const BSC_WALLET_TOOLS = {
    [`bscwallet-${BSC_GET_WALLET_ADDRESS_NAME}`]: bscTool(new BscGetWalletAddressAction()),
}; 