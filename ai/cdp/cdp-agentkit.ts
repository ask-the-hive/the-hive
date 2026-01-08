import { Wallet, WalletData, Coinbase } from '@coinbase/coinbase-sdk';
import { z } from 'zod';
import { CdpAction, CdpActionResult, CdpActionSchemaAny } from './actions/cdp-action';

/**
 * Configuration options for the CDP Agentkit
 */
interface CdpAgentkitOptions {
  cdpApiKeyName?: string;
  cdpApiKeyPrivateKey?: string;
  source?: string;
  sourceVersion?: string;
}

/**
 * Configuration options for the CDP Agentkit with a Wallet.
 */
interface ConfigureCdpAgentkitWithWalletOptions {
  cdpApiKeyName?: string;
  cdpApiKeyPrivateKey?: string;
  source?: string;
  sourceVersion?: string;
  networkId?: string;
  cdpWalletData?: string;
}

/**
 * CDP Agentkit
 */
export class CdpAgentkit {
  private wallet?: Wallet;

  /**
   * Initializes a new CDP Agentkit instance
   *
   * @param config - Configuration options for the CDP Agentkit
   */
  public constructor(config: CdpAgentkitOptions = {}) {
    const cdpApiKeyName = config.cdpApiKeyName || process.env.CDP_API_KEY_NAME;
    const cdpApiKeyPrivateKey = config.cdpApiKeyPrivateKey || process.env.CDP_API_KEY_PRIVATE_KEY;
    const source = config.source;

    if (!cdpApiKeyName) {
      throw new Error('CDP_API_KEY_NAME is required but not provided');
    }
    if (!cdpApiKeyPrivateKey) {
      throw new Error('CDP_API_KEY_PRIVATE_KEY is required but not provided');
    }

    Coinbase.configure({
      apiKeyName: cdpApiKeyName,
      privateKey: cdpApiKeyPrivateKey.replace(/\\n/g, '\n'),
      source: source || 'agentkit-core',
    });
  }

  /**
   * Configures CDP Agentkit with a Wallet.
   *
   * @param config - Optional configuration parameters
   * @returns A Promise that resolves to a new CdpAgentkit instance
   * @throws Error if required environment variables are missing or wallet initialization fails
   */
  public static async configureWithWallet(
    config: ConfigureCdpAgentkitWithWalletOptions = {},
  ): Promise<CdpAgentkit> {
    const agentkit = new CdpAgentkit(config);

    const networkId = config.networkId || process.env.NETWORK_ID || Coinbase.networks.BaseSepolia;

    try {
      if (config.cdpWalletData) {
        const walletData = JSON.parse(config.cdpWalletData) as WalletData;
        agentkit.wallet = await Wallet.import(walletData);
      } else {
        agentkit.wallet = await Wallet.create({ networkId: networkId });
      }
    } catch (error) {
      console.error('Failed to initialize CDP wallet:', error);
      throw new Error('Failed to initialize wallet');
    }

    return agentkit;
  }

  /**
   * Executes a CDP action
   *
   * @param action - The CDP action to execute
   * @param args - Arguments for the action
   * @returns Result of the action execution
   * @throws Error if action execution fails
   */
  async run<TActionSchema extends CdpActionSchemaAny, TResultBody>(
    action: CdpAction<TActionSchema, TResultBody>,
    args: TActionSchema,
  ): Promise<CdpActionResult<TResultBody>> {
    if (!action.func) {
      throw new Error(`Action ${action.name} does not have a function defined`);
    }
    if (action.func.length > 1) {
      if (!this.wallet) {
        return {
          message: `Unable to run CDP Action: ${action.name}. A Wallet is required. Please configure CDP Agentkit with a Wallet to run this action.`,
        };
      }

      return await action.func(this.wallet!, args);
    }

    return await (
      action.func as (args: z.infer<TActionSchema>) => Promise<CdpActionResult<TResultBody>>
    )(args);
  }

  /**
   * Exports wallet data required to re-instantiate the wallet
   *
   * @returns JSON string of wallet data including wallet_id and seed
   */
  async exportWallet(): Promise<string> {
    if (!this.wallet) {
      throw Error('Unable to export wallet. Agentkit is not configured with a wallet.');
    }

    const walletData = this.wallet.export();
    return JSON.stringify({
      ...walletData,
      defaultAddressId: (await this.wallet.getDefaultAddress()).getId(),
    });
  }
}
