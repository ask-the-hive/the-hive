import { Node } from '@xyflow/react';

import styles from '@/app/styles.module.css';

export const nodes: Node[] = [
    {
        id: 'root',
        position: { x: 0, y: 0 },
        data: { 
            icon: 'Beef',
            name: 'Staking Agent'
        },
        className: styles.node,
        type: 'central',
    },
    {
        id: 'validators',
        position: { x: -200, y: 200 },
        data: { 
            icon: 'Shield',
            name: 'Validators'
        },
        className: styles.node,
        type: 'agent',
    },
    {
        id: 'rewards',
        position: { x: 200, y: 200 },
        data: { 
            icon: 'Award',
            name: 'Rewards'
        },
        className: styles.node,
        type: 'agent',
    },
    {
        id: 'risk',
        position: { x: 0, y: -200 },
        data: { 
            icon: 'AlertTriangle',
            name: 'Risk Analysis'
        },
        className: styles.node,
        type: 'agent',
    }
]; 