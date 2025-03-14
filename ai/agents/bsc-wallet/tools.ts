import { BscGetWalletAddressAction } from "@/ai/bsc/actions/wallet/get-wallet-address";
import { BSC_GET_WALLET_ADDRESS_NAME } from "@/ai/bsc/actions/wallet/get-wallet-address/name";
import { BscBalanceAction } from "@/ai/bsc/actions/wallet/balance";
import { BSC_BALANCE_NAME } from "@/ai/bsc/actions/wallet/balance/name";
import { BscAllBalancesAction } from "@/ai/bsc/actions/wallet/all-balances";
import { BSC_ALL_BALANCES_NAME } from "@/ai/bsc/actions/wallet/all-balances/name";
import { BscTransferAction } from "@/ai/bsc/actions/wallet/transfer";
import { BSC_TRANSFER_NAME } from "@/ai/bsc/actions/wallet/transfer/name";
import { bscTool } from "@/ai/bsc";

export const BSC_WALLET_TOOLS = {
    [`bscwallet-${BSC_GET_WALLET_ADDRESS_NAME}`]: bscTool(new BscGetWalletAddressAction()),
    [`bscwallet-${BSC_BALANCE_NAME}`]: bscTool(new BscBalanceAction()),
    [`bscwallet-${BSC_ALL_BALANCES_NAME}`]: bscTool(new BscAllBalancesAction()),
    [`bscwallet-${BSC_TRANSFER_NAME}`]: bscTool(new BscTransferAction()),
}; 