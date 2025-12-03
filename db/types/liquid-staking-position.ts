import { Token } from './token';
import { LiquidStakingYieldsPoolData } from '@/ai';

export interface LiquidStakingPosition {
  id: string;
  walletAddress: string;
  chainId: string;
  amount: number;
  lstToken: Token;
  poolData: LiquidStakingYieldsPoolData;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLiquidStakingPositionInput {
  walletAddress: string;
  chainId: string;
  amount: number;
  lstToken: Token;
  poolData: LiquidStakingYieldsPoolData;
}

export interface UpdateLiquidStakingPositionInput {
  id: string;
  amount: number;
}
