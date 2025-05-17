import { Node } from '@xyflow/react';

import styles from '@/app/styles.module.css';

export const nodes: Node[] = [
    {
        id: 'root',
        position: { x: 0, y: 0 },
        data: { 
            icon: 'Droplet',
            name: 'Liquidity Agent'
        },
        className: styles.node,
        type: 'central',
    },
    {
        id: 'pools',
        position: { x: -200, y: 200 },
        data: { 
            icon: 'Database',
            name: 'DeFi Pools'
        },
        className: styles.node,
        type: 'agent',
    },
    {
        id: 'positions',
        position: { x: 200, y: 200 },
        data: { 
            icon: 'LayoutGrid',
            name: 'LP Positions'
        },
        className: styles.node,
        type: 'agent',
    },
    {
        id: 'yield',
        position: { x: 0, y: -200 },
        data: { 
            icon: 'TrendingUp',
            name: 'Yield Analysis'
        },
        className: styles.node,
        type: 'agent',
    }
]; 