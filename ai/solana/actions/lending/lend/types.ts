export type LendResultBodyType = {
  success: boolean;
  transactionHash?: string;
  amount: number;
  tokenSymbol: string;
  protocolName: string;
  error?: string;
};
