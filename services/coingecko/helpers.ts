import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const COINGECKO_API_KEY = 'CG-CLU3hw6My9aUzWJzGqujZ6MH';

/**
 * Wrapper function for CoinGecko API calls with authentication header.
 * @param url - The CoinGecko API endpoint URL
 * @param config - Optional axios config (params, headers, etc.)
 * @returns Promise<AxiosResponse<T>> - Axios response with typed data
 */
export async function coinGeckoRequest<T = any>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
  const requestConfig: AxiosRequestConfig = {
    ...config,
    headers: {
      'x-cg-demo-api-key': COINGECKO_API_KEY,
      ...config?.headers,
    },
  };

  return axios.get<T>(url, requestConfig);
}
