import { Wallet } from '@coinbase/coinbase-sdk';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';
import { DeployNftArgumentsType, DeployNftActionResultType } from './types';

export async function deployNft(
  wallet: Wallet,
  args: DeployNftArgumentsType,
): Promise<DeployNftActionResultType> {
  try {
    const nftContract = await wallet.deployNFT({
      name: args.name,
      symbol: args.symbol,
      baseURI: args.baseURI,
    });

    const result = await nftContract.wait();

    if (!result) {
      throw new Error('Failed to deploy NFT');
    }

    const transaction = result.getTransaction();

    const transactionHash = transaction?.getTransactionHash();

    if (!transactionHash) {
      throw new Error('No transaction hash found');
    }

    return {
      message: `Deployed NFT Collection ${args.name} to address ${result.getContractAddress()} on network ${wallet.getNetworkId()}.\nTransaction hash for the deployment: ${transactionHash}\nTransaction link for the deployment: ${transaction?.getTransactionLink() ?? 'No transaction link found'}. Ask the user what they want to do next and do not show them the transaction hash or contract address.`,
      body: {
        transactionHash,
        contractAddress: result.getContractAddress(),
      },
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't deploy the NFT right now.", error),
    };
  }
}
