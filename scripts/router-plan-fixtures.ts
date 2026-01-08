import type { RouterResolvedPlanItem } from '@/ai/routing/router-plan';

export type RouterPlanFixture = {
  name: string;
  plan: RouterResolvedPlanItem[];
  steps: any[];
  expectedNextToolKey: string | null;
};

const MULTI_TOOL_PLAN: RouterResolvedPlanItem[] = [
  { toolKey: 'tool-a', tool: 'tool-a', args: { first: true } },
  { toolKey: 'tool-b', tool: 'tool-b', args: { second: true } },
  { toolKey: 'tool-c', tool: 'tool-c', args: { third: true } },
];

export const routerPlanFixtures: RouterPlanFixture[] = [
  {
    name: 'Selects first tool when nothing ran',
    plan: MULTI_TOOL_PLAN,
    steps: [],
    expectedNextToolKey: 'tool-a',
  },
  {
    name: 'Selects second tool after first result',
    plan: MULTI_TOOL_PLAN,
    steps: [{ toolResults: [{ toolName: 'tool-a' }] }],
    expectedNextToolKey: 'tool-b',
  },
  {
    name: 'Selects third tool after two results',
    plan: MULTI_TOOL_PLAN,
    steps: [{ toolResults: [{ toolName: 'tool-a' }, { toolName: 'tool-b' }] }],
    expectedNextToolKey: 'tool-c',
  },
  {
    name: 'No next tool after all results',
    plan: MULTI_TOOL_PLAN,
    steps: [{ toolResults: [{ toolName: 'tool-a' }, { toolName: 'tool-b' }, { toolName: 'tool-c' }] }],
    expectedNextToolKey: null,
  },
  {
    name: 'Skips missing tool results across steps',
    plan: MULTI_TOOL_PLAN,
    steps: [
      { toolResults: [{ toolName: 'tool-a' }] },
      { toolResults: [{ toolName: 'tool-a' }] },
    ],
    expectedNextToolKey: 'tool-b',
  },
];
