import { Edge } from '@xyflow/react';

export const edges: Edge[] = [
    {
        id: 'root-portfolio',
        source: 'root',
        target: 'portfolio',
        data: { label: 'Tracks' },
        type: 'custom',
        animated: true,
    },
    {
        id: 'root-transactions',
        source: 'root',
        target: 'transactions',
        data: { label: 'Monitors' },
        type: 'custom',
        animated: true,
    },
    {
        id: 'root-allocation',
        source: 'root',
        target: 'allocation',
        data: { label: 'Optimizes' },
        type: 'custom',
        animated: true,
    }
]; 