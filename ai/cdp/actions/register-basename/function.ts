import { Wallet, Coinbase } from '@coinbase/coinbase-sdk';
import { Abi, encodeFunctionData, namehash } from 'viem';
import { Decimal } from 'decimal.js';
import { RegisterBasenameArgumentsType, RegisterBasenameActionResultType } from './types';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

export const BASENAMES_REGISTRAR_CONTROLLER_ADDRESS_MAINNET =
  '0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5';
export const BASENAMES_REGISTRAR_CONTROLLER_ADDRESS_TESTNET =
  '0x49aE3cC2e3AA768B1e5654f5D3C6002144A59581';

export const L2_RESOLVER_ADDRESS_MAINNET = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD';
export const L2_RESOLVER_ADDRESS_TESTNET = '0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA';

export const REGISTRATION_DURATION = '31557600';

export const L2_RESOLVER_ABI: Abi = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { internalType: 'address', name: 'a', type: 'address' },
    ],
    name: 'setAddr',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { internalType: 'string', name: 'newName', type: 'string' },
    ],
    name: 'setName',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export const REGISTRAR_ABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'name',
            type: 'string',
          },
          {
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'duration',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'resolver',
            type: 'address',
          },
          {
            internalType: 'bytes[]',
            name: 'data',
            type: 'bytes[]',
          },
          {
            internalType: 'bool',
            name: 'reverseRecord',
            type: 'bool',
          },
        ],
        internalType: 'struct RegistrarController.RegisterRequest',
        name: 'request',
        type: 'tuple',
      },
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
];

function createRegisterContractMethodArgs(
  baseName: string,
  addressId: string,
  isMainnet: boolean,
): object {
  const l2ResolverAddress = isMainnet ? L2_RESOLVER_ADDRESS_MAINNET : L2_RESOLVER_ADDRESS_TESTNET;
  const suffix = isMainnet ? '.base.eth' : '.basetest.eth';

  const addressData = encodeFunctionData({
    abi: L2_RESOLVER_ABI,
    functionName: 'setAddr',
    args: [namehash(baseName), addressId],
  });
  const nameData = encodeFunctionData({
    abi: L2_RESOLVER_ABI,
    functionName: 'setName',
    args: [namehash(baseName), baseName],
  });

  const registerArgs = {
    request: [
      baseName.replace(suffix, ''),
      addressId,
      REGISTRATION_DURATION,
      l2ResolverAddress,
      [addressData, nameData],
      true,
    ],
  };

  return registerArgs;
}

export async function registerBasename(
  wallet: Wallet,
  args: RegisterBasenameArgumentsType,
): Promise<RegisterBasenameActionResultType> {
  const addressId = (await wallet.getDefaultAddress()).getId();
  const isMainnet = wallet.getNetworkId() === Coinbase.networks.BaseMainnet;

  const suffix = isMainnet ? '.base.eth' : '.basetest.eth';
  if (!args.basename.endsWith(suffix)) {
    args.basename += suffix;
  }

  const registerArgs = createRegisterContractMethodArgs(args.basename, addressId, isMainnet);

  try {
    const contractAddress = isMainnet
      ? BASENAMES_REGISTRAR_CONTROLLER_ADDRESS_MAINNET
      : BASENAMES_REGISTRAR_CONTROLLER_ADDRESS_TESTNET;

    const invocation = await wallet.invokeContract({
      contractAddress,
      method: 'register',
      args: registerArgs,
      abi: REGISTRAR_ABI,
      amount: new Decimal(args.amount),
      assetId: 'eth',
    });

    await invocation.wait();

    const transaction = invocation.getTransaction();

    if (!transaction) {
      throw new Error('Failed to get transaction');
    }

    const transactionHash = transaction.getTransactionHash();

    if (!transactionHash) {
      throw new Error('Failed to get transaction hash');
    }

    return {
      message: `Successfully registered basename ${args.basename} for address ${addressId}`,
      body: {
        basename: args.basename,
        transactionHash,
      },
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext(
        "Couldn't register that basename right now.",
        error,
      ),
    };
  }
}
