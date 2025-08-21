export const getSwapObj = async (userPublicKey: string, quoteResponse: any) => {
	try {
		// Use Jupiter lite API for swap
		const response = await fetch('https://lite-api.jup.ag/swap/v1/swap', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				quoteResponse,
				userPublicKey,
				
				// ADDITIONAL PARAMETERS TO OPTIMIZE FOR TRANSACTION LANDING
				// See next guide to optimize for transaction landing
				dynamicComputeUnitLimit: true,
				dynamicSlippage: true,
				prioritizationFeeLamports: {
					priorityLevelWithMaxLamports: {
						maxLamports: 1000000,
						priorityLevel: "veryHigh"
					}
				}
			})
		});

		if (!response.ok) {
			throw new Error(`Jupiter swap API error: ${response.statusText}`);
		}

		const swapResponse = await response.json();
		console.log('Jupiter swap response:', JSON.stringify(swapResponse, null, 2));
		
		return swapResponse;
	} catch (error) {
		console.error('Error getting Jupiter swap:', error);
		throw error;
	}
}