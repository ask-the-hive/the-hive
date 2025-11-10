import 'server-only';

import {
  Container,
  ItemDefinition,
  OperationInput,
  OperationResponse,
  PatchOperation,
  SqlParameter,
} from '@azure/cosmos';

/**
 * **BASE DATABASE SERVICE**
 *
 * Add an item to the container
 *
 * @param {Container} container - The container to add the item to
 * @param {InputType} input - The item to add
 * @returns {Promise<ItemType | null>} - The added item or null if it failed
 */
export const add = async <InputType extends ItemDefinition, ItemType>(
  container: Container,
  input: InputType,
): Promise<ItemType | null> => {
  try {
    const item = await container.items.create(input);
    return item?.resource as ItemType | null;
  } catch (e: any) {
    if (e.code === 429) {
      const retryAfterMs = parseInt(e.headers?.['x-ms-retry-after-ms'] || '1000');
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
      return add(container, input);
    }
    if (e.code === 409) {
      // Item already exists - this is not critical, just skip it
      console.warn(`Item with id ${input.id} already exists, skipping duplicate`);
      return null;
    }
    console.error('Error adding item', e);
    return null;
  }
};

/**
 * **BASE DATABASE SERVICE**
 *
 * Get an item from the container
 *
 * @param {Container} container - The container to get the item from
 * @param {string} id - The id of the item
 * @param {string} partitionKey - The partition key of the item
 * @returns {Promise<ItemType | null>} - The item or null if it failed
 */
export const get = async <ItemType>(
  container: Container,
  id: string,
  partitionKey: string,
): Promise<ItemType | null> => {
  try {
    const item = await container.item(id, partitionKey).read();
    return item.resource ? (item.resource as ItemType) : null;
  } catch (e: any) {
    if (e.code === 429) {
      const retryAfterMs = parseInt(e.headers?.['x-ms-retry-after-ms'] || '1000');
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
      return get(container, id, partitionKey);
    }
    console.error('Error getting item', e);
    return null;
  }
};

/**
 * **BASE DATABASE SERVICE**
 *
 * Find items in the container
 *
 * @param {Container} container - The container to find the items in
 * @param {string} queryText - The query text
 * @param {SqlParameter[]} parameters - The parameters for the query
 * @returns {Promise<ItemType[]>} - The items found
 */
export const find = async <ItemType>(
  container: Container,
  queryText: string,
  parameters?: SqlParameter[],
): Promise<ItemType[]> => {
  try {
    const query = await container.items
      .query<ItemType>({
        query: queryText,
        parameters: parameters,
      })
      .fetchAll();
    return query.resources;
  } catch (e: any) {
    if (e.code === 429) {
      const retryAfterMs = parseInt(e.headers?.['x-ms-retry-after-ms'] || '1000');
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
      return find(container, queryText, parameters);
    }
    console.error('Error finding items', e);
    return [];
  }
};

/**
 * **BASE DATABASE SERVICE**
 *
 * Update an item in the container
 *
 * @param {Container} container - The container to update the item in
 * @param {string} id - The id of the item
 * @param {string} partitionKey - The partition key of the item
 * @param {PatchOperation[]} operations - The operations to update the item with
 * @returns {Promise<boolean>} - True if the item was updated, false otherwise
 */
export const update = async (
  container: Container,
  id: string,
  partitionKey: string,
  operations: PatchOperation[],
): Promise<boolean> => {
  try {
    await container.item(id, partitionKey).patch({
      operations,
    });
    return true;
  } catch (e: any) {
    if (e.code === 429) {
      const retryAfterMs = parseInt(e.headers?.['x-ms-retry-after-ms'] || '1000');
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
      return update(container, id, partitionKey, operations);
    }
    console.error('Error updating item', e);
    return false;
  }
};

/**
 * **BASE DATABASE SERVICE**
 *
 * Delete an item from the container
 *
 * @param {Container} container - The container to delete the item from
 * @param {string} id - The id of the item
 * @param {string} partitionKey - The partition key of the item
 * @returns {Promise<boolean>} - True if the item was deleted, false otherwise
 */
export const del = async (
  container: Container,
  id: string,
  partitionKey: string,
): Promise<boolean> => {
  try {
    await container.item(id, partitionKey).delete();
    return true;
  } catch (e: any) {
    if (e.code === 429) {
      const retryAfterMs = parseInt(e.headers?.['x-ms-retry-after-ms'] || '1000');
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
      return del(container, id, partitionKey);
    }
    console.error('Error deleting item', e);
    return false;
  }
};

/**
 * **BASE DATABASE SERVICE**
 *
 * Batch operations on the container
 *
 * @param {Container} container - The container to batch operations on
 * @param {OperationInput[]} operations - The operations to batch
 * @returns {Promise<OperationResponse[] | undefined>} - The operation responses or undefined if it failed
 */
export const batch = async (
  container: Container,
  operations: OperationInput[],
): Promise<OperationResponse[] | undefined> => {
  try {
    const batch = await container.items.batch(operations);
    return batch.result;
  } catch (e: any) {
    if (e.code === 429) {
      const retryAfterMs = parseInt(e.headers?.['x-ms-retry-after-ms'] || '1000');
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
      return batch(container, operations);
    }
    return undefined;
  }
};
