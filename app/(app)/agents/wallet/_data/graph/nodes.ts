import { Node } from '@xyflow/react';

import styles from '@/app/styles.module.css';

export const nodes: Node[] = [
    {
        id: 'root',
        position: { x: 0, y: 0 },
        data: { 
            icon: 'Wallet',
            name: 'Wallet Agent'
        },
        className: styles.node,
        type: 'central',
    },
    {
        id: 'portfolio',
        position: { x: -200, y: 200 },
        data: { 
            icon: 'PieChart',
            name: 'Portfolio'
        },
        className: styles.node,
        type: 'agent',
    },
    {
        id: 'transactions',
        position: { x: 200, y: 200 },
        data: { 
            icon: 'History',
            name: 'Transactions'
        },
        className: styles.node,
        type: 'agent',
    },
    {
        id: 'allocation',
        position: { x: 0, y: -200 },
        data: { 
            icon: 'Shuffle',
            name: 'Asset Allocation'
        },
        className: styles.node,
        type: 'agent',
    }
]; 