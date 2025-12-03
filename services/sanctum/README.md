# Sanctum Integration

This service integrates with Sanctum's API to fetch liquid staking token (LST) data and combine it
with DeFiLlama data for comprehensive liquid staking yield information.

## Setup

1. Get an API key from Sanctum: https://learn.sanctum.so/docs/for-developers/sanctum-api
2. Add the API key to your environment variables:
   ```
   SANCTUM_API_KEY=your-api-key-here
   ```

## Data Mapping

The Sanctum API response is transformed to match the `LiquidStakingYieldsPoolData` format:

| **LiquidStakingYieldsPoolData** | **Sanctum API Response** | **Notes**                                 |
| ------------------------------- | ------------------------ | ----------------------------------------- |
| `name`                          | `name`                   | Direct mapping                            |
| `symbol`                        | `symbol`                 | Direct mapping                            |
| `yield`                         | `latestApy`              | Sanctum provides current APY              |
| `apyBase`                       | `latestApy`              | Use latestApy as base                     |
| `apyReward`                     | `0`                      | Sanctum doesn't separate reward APY       |
| `tvlUsd`                        | `tvl`                    | Direct mapping                            |
| `project`                       | `pool.program`           | Use the underlying program                |
| `poolMeta`                      | `oneLiner`               | Use the one-liner description             |
| `url`                           | `website`                | Direct mapping                            |
| `rewardTokens`                  | `[]`                     | Empty array                               |
| `underlyingTokens`              | `[mint]`                 | Use the LST mint address                  |
| `predictions`                   | `undefined`              | Not provided by Sanctum                   |
| `tokenData`                     | `null`                   | Fetched separately via `getTokenBySymbol` |

## Usage

The integration is automatically used in the `getLiquidStakingYields()` function, which now fetches
data from both DeFiLlama and Sanctum APIs in parallel and combines the results.
