import { Edge } from '@xyflow/react';

export const edges: Edge[] = [
    {
        id: 'root-pools',
        source: 'root',
        target: 'pools',
        data: { label: 'Analyzes' },
        type: 'custom',
        animated: true,
    },
    {
        id: 'root-positions',
        source: 'root',
        target: 'positions',
        data: { label: 'Manages' },
        type: 'custom',
        animated: true,
    },
    {
        id: 'root-yield',
        source: 'root',
        target: 'yield',
        data: { label: 'Optimizes' },
        type: 'custom',
        animated: true,
    }
]; 