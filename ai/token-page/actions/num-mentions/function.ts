import { getNumMentions as getNumMentionsService } from '@/services/twitter';
import { calculateDailyMetrics, calculateHourlyStats, calculateTimeOfDayStats } from './utils';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

import type { TokenPageActionResult } from '../token-page-action';
import type {
  TokenPageNumMentionsResultBodyType,
  TokenPageNumMentionsArgumentsType,
} from './types';

/**, TwitterSearchRecentArgumentsType, TwitterSearchRecentResultBodyType
 * Gets the balance of a Solana wallet or token account.
 *
 * @param twitterApi - The Twitter API instance
 * @param args - The input arguments for the action
 * @returns A message containing the tweets information
 */
export async function getNumMentions(
  username: string,
  _: TokenPageNumMentionsArgumentsType,
): Promise<TokenPageActionResult<TokenPageNumMentionsResultBodyType>> {
  try {
    const numMentionsResponse = await getNumMentionsService(username);

    const numMentions = numMentionsResponse?.meta?.total_tweet_count || 0;

    let trendMetrics = {
      dailyAverage: 0,
      maxDailyMentions: 0,
      growthRate: 0,
      mostActiveDay: '',
      hourlyStats: {
        maxHourlyMentions: 0,
        mostActiveHour: '',
        averageHourlyMentions: 0,
        quietestHour: '',
        minHourlyMentions: Infinity,
      },
      timeOfDayStats: {
        morningAvg: 0,
        afternoonAvg: 0,
        eveningAvg: 0,
        nightAvg: 0,
        mostActiveTimeOfDay: '',
      },
    };

    if (numMentionsResponse?.data && numMentionsResponse.data.length > 0) {
      const dailyMetrics = calculateDailyMetrics(numMentionsResponse.data);
      const hourlyStats = calculateHourlyStats(numMentionsResponse.data);
      const timeOfDayStats = calculateTimeOfDayStats(numMentionsResponse.data);

      trendMetrics = {
        ...dailyMetrics,
        hourlyStats,
        timeOfDayStats,
      };
    }

    return {
      message:
        `The token has been mentioned ${numMentions} times in the last 7 days. ` +
        `Daily average: ${trendMetrics.dailyAverage.toFixed(1)} mentions. ` +
        `Most active time: ${trendMetrics.timeOfDayStats.mostActiveTimeOfDay} with peak of ${trendMetrics.hourlyStats.maxHourlyMentions} mentions. ` +
        `Growth rate: ${trendMetrics.growthRate.toFixed(1)}%.`,
      body: {
        numMentions,
        trendMetrics,
      },
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load recent mentions right now.", error),
    };
  }
}
