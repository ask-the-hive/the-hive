import { SanctumAPIResponse } from './types';

export const getSanctumLSTs = async (): Promise<SanctumAPIResponse> => {
  try {
    // Note: You'll need to get an API key from Sanctum
    // For now, using placeholder - replace with actual API key
    const apiKey = process.env.SANCTUM_API_KEY || 'your-api-key-here';

    const response = await fetch(`https://sanctum-api.ironforge.network/lsts?apiKey=${apiKey}`, {
      method: 'GET',
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json',
      },
    });

    if (!response || !response.ok || response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Sanctum LST data:', error);
    throw error;
  }
};
