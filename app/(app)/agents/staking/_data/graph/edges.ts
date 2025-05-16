import { Edge } from '@xyflow/react';

export const edges: Edge[] = [
    {
        id: 'root-validators',
        source: 'root',
        target: 'validators',
        data: { label: 'Monitors' },
        type: 'custom',
        animated: true,
    },
    {
        id: 'root-rewards',
        source: 'root',
        target: 'rewards',
        data: { label: 'Tracks' },
        type: 'custom',
        animated: true,
    },
    {
        id: 'root-risk',
        source: 'root',
        target: 'risk',
        data: { label: 'Evaluates' },
        type: 'custom',
        animated: true,
    }
]; 