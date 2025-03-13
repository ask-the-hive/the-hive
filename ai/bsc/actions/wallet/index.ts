import { BscGetWalletAddressAction } from "./get-wallet-address";
import { BscBalanceAction } from "./balance";
import { BscAllBalancesAction } from "./all-balances";
import { BscTransferAction } from "./transfer";
export * from "./get-wallet-address";

export const bscWalletActions = [
    new BscGetWalletAddressAction(),
    new BscBalanceAction(),
    new BscAllBalancesAction(),
    new BscTransferAction(),
]; 