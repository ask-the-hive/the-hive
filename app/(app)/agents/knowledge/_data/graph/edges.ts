import { Edge } from '@xyflow/react';

export const edges: Edge[] = [
    {
        id: 'root-protocols',
        source: 'root',
        target: 'protocols',
        data: { label: 'Researches' },
        type: 'custom',
        animated: true,
    },
    {
        id: 'root-strategies',
        source: 'root',
        target: 'strategies',
        data: { label: 'Develops' },
        type: 'custom',
        animated: true,
    },
    {
        id: 'root-insights',
        source: 'root',
        target: 'insights',
        data: { label: 'Generates' },
        type: 'custom',
        animated: true,
    }
]; 