export type WithdrawResultBodyType = {
  success: boolean;
  transactionHash?: string;
  amount: number;
  tokenSymbol: string;
  protocolName: string;
  error?: string;
};
