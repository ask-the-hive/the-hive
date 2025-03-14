import { AddressType, KnownAddress } from "@/types/known-address";

export const bscKnownAddresses: Record<string, KnownAddress> = {
    // PancakeSwap related addresses
    "0x10ED43C718714eb63d5aA57B78B54704E256024E": {
        name: "PancakeSwap Router",
        logo: "/dexes/pancakeswap.png",
        type: AddressType.DecentralizedExchange
    },
    "0x73feaa1eE314F8c655E354234017bE2193C9E24E": {
        name: "PancakeSwap: MasterChef",
        logo: "/dexes/pancakeswap.png",
        type: AddressType.DecentralizedExchange
    },
    "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82": {
        name: "PancakeSwap Token",
        logo: "/dexes/pancakeswap.png",
        type: AddressType.DecentralizedExchange
    },

    // Binance related addresses
    "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3": {
        name: "Binance Hot Wallet",
        logo: "/exchanges/binance.png",
        type: AddressType.CentralizedExchange
    },
    "0x28C6c06298d514Db089934071355E5743bf21d60": {
        name: "Binance Hot Wallet 2",
        logo: "/exchanges/binance.png",
        type: AddressType.CentralizedExchange
    },
    "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549": {
        name: "Binance Hot Wallet 3",
        logo: "/exchanges/binance.png",
        type: AddressType.CentralizedExchange
    },

    // Other major exchanges
    "0xF977814e90dA44bFA03b6295A0616a897441aceC": {
        name: "Binance-Peg BSC-USD",
        logo: "/exchanges/binance.png",
        type: AddressType.CentralizedExchange
    },
    "0x5a52E96BAcdaBb82fd05763E25335261B270Efcb": {
        name: "Binance-Peg BTCB",
        logo: "/exchanges/binance.png",
        type: AddressType.CentralizedExchange
    },

    // Other DEXes
    "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F": {
        name: "BakerySwap Router",
        logo: "/dexes/bakeryswap.png",
        type: AddressType.DecentralizedExchange
    },
    "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8": {
        name: "BiSwap Router",
        logo: "/dexes/biswap.png",
        type: AddressType.DecentralizedExchange
    },

    // Major lending protocols
    "0xfD36E2c2a6789Db23113685031d7F16329158384": {
        name: "Venus: USDC",
        logo: "/defi/venus.png",
        type: AddressType.DecentralizedExchange
    },
    "0x95c78222B3D6e262426483D42CfA53685A67Ab9D": {
        name: "Venus: BUSD",
        logo: "/defi/venus.png",
        type: AddressType.DecentralizedExchange
    },

    // Other major BSC addresses
    "0x0000000000000000000000000000000000001004": {
        name: "BSC Validator",
        logo: "/chains/bsc.png",
        type: AddressType.EOA
    },
    "0x000000000000000000000000000000000000dead": {
        name: "Burn Address",
        logo: "/misc/burn.png",
        type: AddressType.EOA
    },
    "0x0000000000000000000000000000000000000000": {
        name: "Zero Address",
        logo: "/misc/zero.png",
        type: AddressType.EOA
    }
} as const; 