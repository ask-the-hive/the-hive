import { CosmosClient } from '@azure/cosmos';

let client: CosmosClient;

export const getCosmosClient = () => {
  if (!client) {
    client = new CosmosClient({
      endpoint: process.env.COSMOS_ENDPOINT as string,
      key: process.env.COSMOS_KEY as string,
    });
  }
  return client;
};
