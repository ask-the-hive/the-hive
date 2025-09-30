import { getDatabase } from "@/db/database";

import { 
    ComputedProperty, 
    IndexingPolicy, 
    VectorEmbeddingDataType, 
    VectorEmbeddingDistanceFunction, 
    VectorEmbeddingPolicy, 
    VectorIndexType 
} from "@azure/cosmos";

export interface VectorSearchOptions<ItemType> {
    embeddingPaths?: (keyof ItemType)[];
    computedProperties?: ComputedProperty[];
}

export const getContainer = async <ItemType>(containerId: string, partitionKey: keyof ItemType, vectorSearchOptions?: VectorSearchOptions<ItemType>) => {
    const database = await getDatabase();
    return (await database.containers.createIfNotExists({ 
        id: containerId,
        partitionKey: `/${partitionKey as string}`,
        ...(vectorSearchOptions && {
            vectorEmbeddingPolicy: getVectorEmbeddingPolicy(vectorSearchOptions.embeddingPaths || []),
            indexingPolicy: getIndexingPolicy(vectorSearchOptions.embeddingPaths || []),
        }),
        ...(vectorSearchOptions && {
            computedProperties: vectorSearchOptions.computedProperties
        })
    })).container;
}

export const getVectorEmbeddingPolicy = <ItemType>(embeddingPaths: (keyof ItemType)[]): VectorEmbeddingPolicy => {
    return {
        vectorEmbeddings: embeddingPaths.map(embeddingPath => ({
            path: `/${embeddingPath as string}`,
            dimensions: 1536,
            dataType: VectorEmbeddingDataType.Float32,
            distanceFunction: VectorEmbeddingDistanceFunction.Cosine
        }))
    }
}

export const getIndexingPolicy = <ItemType>(embeddingPaths: (keyof ItemType)[]): IndexingPolicy => {
    return {
        indexingMode: "consistent",
        automatic: true,
        vectorIndexes: embeddingPaths.map(embeddingPath => ({
            path: `/${embeddingPath as string}`,
            type: VectorIndexType.QuantizedFlat
        }))
    }
}