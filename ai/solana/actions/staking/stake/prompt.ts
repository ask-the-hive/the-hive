import { SOLANA_GET_TOKEN_ADDRESS_ACTION } from '../../names';

export const SOLANA_STAKE_PROMPT = `Stake SOL for yield using a liquid staking provider.

There are two parameters, one required and one optional:

1. Amount of SOL to stake. (optional)
2. The contract address of the liquid staking provider to use.

IMPORTANT - User Experience Flow:
- If user provides a provider symbol (e.g., "stake SOL using hsol"):
  1. Use ${SOLANA_GET_TOKEN_ADDRESS_ACTION} to get the contract address
  2. Then immediately call this stake action to show the staking UI
  3. DO NOT ask for additional information - show the interface directly

- If user provides both amount and provider (e.g., "stake 5 SOL using hsol"):
  1. Use ${SOLANA_GET_TOKEN_ADDRESS_ACTION} to get the contract address
  2. Then immediately call this stake action with both amount and contract address

- If user asks to stake without a provider:
  1. Use the get-liquid-staking-yields tool to show available providers
  2. Let them choose from the list

- If user asks to stake without a symbol or name:
  1. Use the get-liquid-staking-yields tool to get the best liquid staking yields
  2. Ask the user to choose one

If the user does not provide an amount, leave the amount parameter empty. The staking UI will allow them to input the amount directly.`;
