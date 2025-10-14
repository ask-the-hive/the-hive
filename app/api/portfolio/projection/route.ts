import { NextRequest, NextResponse } from 'next/server';
import { ChainType } from '@/app/_contexts/chain-context';
import { withErrorHandling } from '@/lib/api-error-handler';

interface ProjectionData {
  baseNetWorth: number;
  historical: Array<{
    date: string;
    netWorth: number;
  }>;
  projection: Array<{
    date: string;
    netWorth: number;
  }>;
}

interface BirdeyeNetWorthResponse {
  success: boolean;
  data: {
    wallet_address: string;
    currency: string;
    current_timestamp: string;
    past_timestamp: string;
    history: Array<{
      timestamp: string;
      net_worth: number;
      net_worth_change: number;
      net_worth_change_percent: number;
    }>;
  };
}

// Fetch net worth data from appropriate API based on chain
const fetchNetWorthData = async (
  wallet: string,
  chain: ChainType,
): Promise<BirdeyeNetWorthResponse> => {
  if (chain === 'solana') {
    // Use Birdeye for Solana
    const response = await fetch(
      `https://public-api.birdeye.so/wallet/v2/net-worth?wallet=${wallet}&chain=solana`,
      {
        headers: {
          'X-API-KEY': process.env.BIRDEYE_API_KEY || 'dbb829c2c25f44229284754bfe5c99c6',
          'x-chain': 'solana',
          accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Birdeye API error: ${response.status}`);
    }

    return response.json();
  } else {
    // Use Mobula API for other chains (Base, BSC, etc.)
    const chainMap: Record<string, string> = {
      base: 'base',
      bsc: '56',
      ethereum: 'ethereum',
    };

    const mobulaChain = chainMap[chain] || 'base';
    const response = await fetch(
      `https://explorer-api.mobula.io/api/1/wallet/history?wallet=${wallet}&blockchains=${mobulaChain}&period=30d`,
      {
        headers: {
          accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Mobula API error: ${response.status}`);
    }

    const mobulaData = await response.json();

    // Convert Mobula format to Birdeye format
    // Mobula returns data with balance_history as array of [timestamp, value] pairs
    const historyData = mobulaData.data?.balance_history || [];
    const history = historyData.map((entry: [number, number], index: number) => {
      const [timestamp, value] = entry;
      const prevValue = index > 0 ? historyData[index - 1][1] : value;
      const change = value - prevValue;
      const changePercent = prevValue > 0 ? (change / prevValue) * 100 : 0;

      return {
        timestamp: new Date(timestamp).toISOString(),
        net_worth: value,
        net_worth_change: change,
        net_worth_change_percent: changePercent,
      };
    });

    return {
      success: true,
      data: {
        wallet_address: wallet,
        currency: 'usd',
        current_timestamp: history.length > 0 ? history[0].timestamp : new Date().toISOString(),
        past_timestamp:
          history.length > 0
            ? history[history.length - 1].timestamp
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        history: history,
      },
    };
  }
};

// Generate projection using historical trend analysis
const generateProjectionWithLLM = async (
  netWorthData: BirdeyeNetWorthResponse,
  days: number,
): Promise<Array<{ date: string; netWorth: number }>> => {
  const { data } = netWorthData;

  if (!data.history || data.history.length === 0) {
    return [];
  }

  // Get current net worth (most recent entry)
  const currentNetWorth = data.history[0].net_worth;

  // Calculate average daily change from historical data
  const recentChanges = data.history.slice(0, 3); // Last 3 days
  const avgDailyChange =
    recentChanges.reduce((sum, entry) => sum + entry.net_worth_change_percent, 0) /
    recentChanges.length;

  // Generate projection
  const projection: Array<{ date: string; netWorth: number }> = [];
  const today = new Date();

  for (let i = 1; i <= days; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const date = futureDate.toISOString().split('T')[0];

    // Apply trend-based projection (conservative approach)
    const dailyGrowthRate = (avgDailyChange / 100) * 0.3; // 30% of historical trend
    const projectedValue = currentNetWorth * Math.pow(1 + dailyGrowthRate, i);

    projection.push({
      date,
      netWorth: projectedValue,
    });
  }

  return projection;
};

// Generate historical data from Birdeye API data
const generateHistoricalData = (
  netWorthData: BirdeyeNetWorthResponse,
  days: number,
): Array<{ date: string; netWorth: number }> => {
  const { data } = netWorthData;

  if (!data.history || data.history.length === 0) {
    return [];
  }

  // Convert Birdeye historical data to our format
  return data.history
    .slice(0, Math.min(days, data.history.length)) // Limit to requested days
    .map((entry) => ({
      date: entry.timestamp.split('T')[0], // Extract date part
      netWorth: entry.net_worth,
    }))
    .reverse(); // Reverse to show oldest first
};

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const days = parseInt(searchParams.get('days') || '30');
  const chain = (searchParams.get('chain') as ChainType) || 'solana';

  // Validate required parameters
  if (!wallet) {
    return NextResponse.json({ error: 'Missing required parameter: wallet' }, { status: 400 });
  }

  if (days < 1 || days > 365) {
    return NextResponse.json({ error: 'Days must be between 1 and 365' }, { status: 400 });
  }

  // Fetch net worth data from Birdeye
  console.log(`Fetching net worth for wallet: ${wallet} on chain: ${chain}`);
  const netWorthData = await fetchNetWorthData(wallet, chain);

  if (
    !netWorthData.success ||
    !netWorthData.data ||
    !netWorthData.data.history ||
    netWorthData.data.history.length === 0
  ) {
    return NextResponse.json({
      baseNetWorth: 0,
      historical: [],
      projection: [],
    });
  }

  const baseNetWorth = netWorthData.data.history[0].net_worth;

  // Generate historical data
  const historical = generateHistoricalData(netWorthData, Math.min(days, 30));

  // Generate projection using LLM-like analysis
  const projection = await generateProjectionWithLLM(netWorthData, days);

  const response: ProjectionData = {
    baseNetWorth,
    historical,
    projection,
  };

  return NextResponse.json(response, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
});

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
