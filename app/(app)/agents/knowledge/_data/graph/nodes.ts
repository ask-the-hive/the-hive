import { Node } from '@xyflow/react';

import styles from '@/app/styles.module.css';

export const nodes: Node[] = [
    {
        id: 'root',
        position: { x: 0, y: 0 },
        data: { 
            icon: 'Brain',
            name: 'Knowledge Agent'
        },
        className: styles.node,
        type: 'central',
    },
    {
        id: 'protocols',
        position: { x: -200, y: 200 },
        data: { 
            icon: 'Network',
            name: 'DeFi Protocols'
        },
        className: styles.node,
        type: 'agent',
    },
    {
        id: 'strategies',
        position: { x: 200, y: 200 },
        data: { 
            icon: 'GitBranch',
            name: 'Strategies'
        },
        className: styles.node,
        type: 'agent',
    },
    {
        id: 'insights',
        position: { x: 0, y: -200 },
        data: { 
            icon: 'Lightbulb',
            name: 'Market Insights'
        },
        className: styles.node,
        type: 'agent',
    }
]; 