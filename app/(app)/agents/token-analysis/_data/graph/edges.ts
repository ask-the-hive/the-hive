import { Edge } from '@xyflow/react';

export const edges: Edge[] = [
    {
        id: 'root-tokenomics',
        source: 'root',
        target: 'tokenomics',
        data: { label: 'Analyzes' },
        type: 'custom',
        animated: true,
    },
    {
        id: 'root-market',
        source: 'root',
        target: 'market',
        data: { label: 'Monitors' },
        type: 'custom',
        animated: true,
    },
    {
        id: 'root-signals',
        source: 'root',
        target: 'signals',
        data: { label: 'Generates' },
        type: 'custom',
        animated: true,
    }
]; 