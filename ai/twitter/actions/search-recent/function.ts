import type { TwitterApi } from 'twitter-api-v2';
import { TwitterActionResult } from '../twitter-action';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

import { TwitterSearchRecentArgumentsType, TwitterSearchRecentResultBodyType } from './types';

/**, TwitterSearchRecentArgumentsType, TwitterSearchRecentResultBodyType
 * Gets the balance of a Solana wallet or token account.
 *
 * @param twitterApi - The Twitter API instance
 * @param args - The input arguments for the action
 * @returns A message containing the tweets information
 */
export async function searchRecent(
  twitterApi: TwitterApi,
  args: TwitterSearchRecentArgumentsType,
): Promise<TwitterActionResult<TwitterSearchRecentResultBodyType>> {
  const query = `${args.keyword} is:verified lang:en`;

  try {
    const tweets = await twitterApi.v2.search({
      query: query,
      max_results: 10,
      expansions: ['author_id'],
    });

    const tweetsArray = Array.from(tweets);

    const tweetsWithUsers = await Promise.all(
      tweetsArray.map(async (tweet) => {
        const user = await twitterApi.v2.user(tweet.author_id!, {
          'user.fields': ['profile_image_url'],
        });
        return {
          tweet: tweet,
          user: user.data,
        };
      }),
    );

    return {
      message: `Tweets queried and displayed. Ask the user what they want to do next. Do not mention the tweets or users in your response.`,
      body: {
        tweets: tweetsWithUsers,
      },
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load tweets right now.", error),
    };
  }
}
