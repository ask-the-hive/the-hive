import { MarketSource } from "../types";

// Known BSC DEX factory addresses and router addresses
// These can be used to identify the DEX based on the pool address
export const BSC_DEX_IDENTIFIERS = {
    // PancakeSwap v2 factory and router
    PANCAKESWAP: {
        factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
        router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
        patterns: ['pancake', 'cake']
    },
    // Uniswap v2 on BSC
    UNISWAP: {
        factory: '0xBCfCcbde45cE874adCB698cC183deBcF17952812',
        router: '0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F',
        patterns: ['uniswap', 'uni']
    },
    // BiSwap
    BISWAP: {
        factory: '0x858E3312ed3A876947EA49d572A7C42DE08af7EE',
        router: '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8',
        patterns: ['biswap', 'bsw']
    },
    // ApeSwap
    APESWAP: {
        factory: '0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6',
        router: '0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7',
        patterns: ['apeswap', 'banana']
    },
    // MDEX
    MDEX: {
        factory: '0x3CD1C46068dAEa5Ebb0d3f55F6915B10648062B8',
        router: '0x7DAe51BD3E3376B8c7c4900E9107f12Be3AF1bA8',
        patterns: ['mdex']
    },
    // BabySwap
    BABYSWAP: {
        factory: '0x86407bEa2078ea5f5EB5A52B2caA963bC1F889Da',
        router: '0x325E343f1dE602396E256B67eFd1F61C3A6B38Bd',
        patterns: ['babyswap', 'baby']
    },
    // BakerySwap
    BAKERYSWAP: {
        factory: '0x01bF7C66c6BD861915CdaaE475042d3c4BaE16A7',
        router: '0xCDe540d7eAFE93aC5fE6233Bee57E1270D3E330F',
        patterns: ['bakery', 'bakeryswap']
    },
    // Thena
    THENA: {
        factory: '0xAFD89d21BdB66d00817d4153E055830B1c2B3970', // Thena Fusion factory
        router: '0xd4ae6eCA985340Dd434D38F470aCCce4DC78D109', // Thena router
        patterns: ['thena']
    },
    // BSWSwap
    BSWSWAP: {
        factory: '0x01bF7C66c6BD861915CdaaE475042d3c4BaE16A7', // Example address, replace with actual
        router: '0xCDe540d7eAFE93aC5fE6233Bee57E1270D3E330F', // Example address, replace with actual
        patterns: ['bsw', 'bswswap']
    }
};

/**
 * Helper function to identify BSC DEX based on the address and name
 * @param address The contract address
 * @param name The market name
 * @returns The identified MarketSource enum value
 */
export const identifyBscDex = (address: string, name: string = ''): MarketSource => {
    // Convert address and name to lowercase for case-insensitive matching
    const lowerAddress = address.toLowerCase();
    const lowerName = name.toLowerCase();
    
    // Check if the address contains any of the factory or router addresses
    for (const [dex, identifiers] of Object.entries(BSC_DEX_IDENTIFIERS)) {
        // Check if the address is related to this DEX's factory or router
        if (lowerAddress.includes(identifiers.factory.toLowerCase()) || 
            lowerAddress.includes(identifiers.router.toLowerCase())) {
            
            // Map the DEX identifier to the corresponding MarketSource enum
            switch (dex) {
                case 'PANCAKESWAP': return MarketSource.PancakeSwap;
                case 'UNISWAP': return MarketSource.Uniswap;
                case 'BISWAP': return MarketSource.BiSwap;
                case 'APESWAP': return MarketSource.ApeSwap;
                case 'MDEX': return MarketSource.MDEX;
                case 'BABYSWAP': return MarketSource.BabySwap;
                case 'BAKERYSWAP': return MarketSource.BakerySwap;
                case 'BSWSWAP': return MarketSource.BSWSwap;
                case 'THENA': 
                    // Differentiate between Thena Fusion and Algebra based on additional patterns
                    return lowerName.includes('algebra') ? 
                        MarketSource.ThenaAlgebra : MarketSource.ThenaFusion;
            }
        }
        
        // Check if the name contains any patterns associated with this DEX
        for (const pattern of identifiers.patterns) {
            if (lowerName.includes(pattern)) {
                // Map the DEX identifier to the corresponding MarketSource enum
                switch (dex) {
                    case 'PANCAKESWAP': return MarketSource.PancakeSwap;
                    case 'UNISWAP': return MarketSource.Uniswap;
                    case 'BISWAP': return MarketSource.BiSwap;
                    case 'APESWAP': return MarketSource.ApeSwap;
                    case 'MDEX': return MarketSource.MDEX;
                    case 'BABYSWAP': return MarketSource.BabySwap;
                    case 'BAKERYSWAP': return MarketSource.BakerySwap;
                    case 'BSWSWAP': return MarketSource.BSWSwap;
                    case 'THENA': 
                        // Differentiate between Thena Fusion and Algebra based on additional patterns
                        return lowerName.includes('algebra') ? 
                            MarketSource.ThenaAlgebra : MarketSource.ThenaFusion;
                }
            }
        }
    }
    
    // If we can't identify the DEX, default to PancakeSwap as it's the most common on BSC
    return MarketSource.PancakeSwap;
}; 