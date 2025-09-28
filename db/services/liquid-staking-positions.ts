import { Container, SqlQuerySpec } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';

import { getContainer } from '@/db/containers/utils';
import type { LiquidStakingPosition, CreateLiquidStakingPositionInput } from '../types';

const CONTAINER_ID = 'liquid-staking-positions';

let container: Container | null = null;

async function getPositionsContainer(): Promise<Container> {
  try {
    if (!container) {
      container = await getContainer(CONTAINER_ID, 'walletAddress');
    }
    return container;
  } catch (error) {
    console.error('Error getting positions container:', error);
    throw new Error('Failed to initialize database container');
  }
}

export async function upsertLiquidStakingPosition(
  input: CreateLiquidStakingPositionInput,
): Promise<LiquidStakingPosition> {
  try {
    const container = await getPositionsContainer();

    // Check if position already exists
    const querySpec: SqlQuerySpec = {
      query:
        'SELECT * FROM c WHERE c.walletAddress = @walletAddress AND c.lstToken.symbol = @symbol',
      parameters: [
        {
          name: '@walletAddress',
          value: input.walletAddress,
        },
        {
          name: '@symbol',
          value: input.lstToken.symbol,
        },
      ],
    };

    let existingPosition: LiquidStakingPosition | null = null;
    try {
      const { resources } = await container.items
        .query<LiquidStakingPosition>(querySpec)
        .fetchAll();
      existingPosition = resources[0];
    } catch (error) {
      console.error('Error querying for existing position:', error);
      throw new Error('Failed to check for existing position');
    }

    const now = new Date();

    if (existingPosition) {
      // Update existing position with new amount
      const updatedPosition: LiquidStakingPosition = {
        ...existingPosition,
        amount: existingPosition.amount + input.amount,
        poolData: input.poolData, // Update pool data in case APY/stats changed
        updatedAt: now,
      };

      try {
        const { resource } = await container
          .item(existingPosition.id, existingPosition.walletAddress)
          .replace<LiquidStakingPosition>(updatedPosition);
        return resource!;
      } catch (error) {
        console.error('Error updating existing position:', error);
        throw new Error('Failed to update existing position');
      }
    } else {
      // Create new position
      const newPosition: LiquidStakingPosition = {
        id: uuidv4(),
        walletAddress: input.walletAddress,
        chainId: input.chainId,
        amount: input.amount,
        lstToken: input.lstToken,
        poolData: input.poolData,
        createdAt: now,
        updatedAt: now,
      };

      try {
        const { resource } = await container.items.create<LiquidStakingPosition>(newPosition);
        return resource!;
      } catch (error) {
        console.error('Error creating new position:', error);
        throw new Error('Failed to create new position');
      }
    }
  } catch (error) {
    console.error('Error in upsertLiquidStakingPosition:', error);
    throw error;
  }
}

export async function getLiquidStakingPosition(
  walletAddress: string,
  symbol: string,
): Promise<LiquidStakingPosition | null> {
  try {
    const container = await getPositionsContainer();

    const querySpec: SqlQuerySpec = {
      query:
        'SELECT * FROM c WHERE c.walletAddress = @walletAddress AND c.lstToken.symbol = @symbol',
      parameters: [
        {
          name: '@walletAddress',
          value: walletAddress,
        },
        {
          name: '@symbol',
          value: symbol,
        },
      ],
    };

    const { resources } = await container.items.query<LiquidStakingPosition>(querySpec).fetchAll();
    return resources[0] || null;
  } catch (error) {
    console.error('Error getting liquid staking position:', error);
    throw new Error('Failed to fetch liquid staking position');
  }
}

export async function getAllLiquidStakingPositions(
  walletAddress: string,
): Promise<LiquidStakingPosition[]> {
  try {
    const container = await getPositionsContainer();

    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.walletAddress = @walletAddress',
      parameters: [
        {
          name: '@walletAddress',
          value: walletAddress,
        },
      ],
    };

    const { resources } = await container.items.query<LiquidStakingPosition>(querySpec).fetchAll();
    return resources;
  } catch (error) {
    console.error('Error getting all liquid staking positions:', error);
    throw new Error('Failed to fetch liquid staking positions');
  }
}
