import { SidebarGroup } from "../../_types/sidebar";

export const platformGroup: SidebarGroup = {
    label: 'Platform',
    items: [
        {
            icon: 'MessageSquare',
            label: 'Chat',
            href: '/chat'
        },
        {
            icon: 'Book',
            label: 'Docs',
            href: 'https://docs.askthehive.ai',
            external: true
        },
        {
            icon: 'Twitter',
            label: 'Follow Twitter',
            href: 'https://x.com/askthehive_ai',
            external: true
        },
        {
            icon: 'Github',
            label: 'Source Code',
            href: 'https://github.com/jasonhedman/the-hive',
            external: true
        }
    ]
}