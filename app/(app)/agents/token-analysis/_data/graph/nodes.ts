import { Node } from '@xyflow/react';

import styles from '@/app/styles.module.css';

export const nodes: Node[] = [
    {
        id: 'root',
        position: { x: 0, y: 0 },
        data: { 
            icon: 'Coins',
            name: 'Token Analysis Agent'
        },
        className: styles.node,
        type: 'central',
    },
    {
        id: 'tokenomics',
        position: { x: -200, y: 200 },
        data: { 
            icon: 'Coins',
            name: 'Tokenomics'
        },
        className: styles.node,
        type: 'agent',
    },
    {
        id: 'market',
        position: { x: 200, y: 200 },
        data: { 
            icon: 'LineChart',
            name: 'Market Data'
        },
        className: styles.node,
        type: 'agent',
    },
    {
        id: 'signals',
        position: { x: 0, y: -200 },
        data: { 
            icon: 'Signal',
            name: 'Trading Signals'
        },
        className: styles.node,
        type: 'agent',
    }
]; 