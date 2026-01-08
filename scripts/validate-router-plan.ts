import { getNextRouterPlanItem } from '@/ai/routing/router-plan';
import { routerPlanFixtures } from '@/scripts/router-plan-fixtures';

const fail = (message: string) => {
  throw new Error(message);
};

const assert = (condition: boolean, message: string) => {
  if (!condition) fail(message);
};

const run = () => {
  const failures: string[] = [];

  for (const fixture of routerPlanFixtures) {
    try {
      const next = getNextRouterPlanItem(fixture.plan, fixture.steps);
      const nextKey = next?.toolKey ?? null;
      assert(
        nextKey === fixture.expectedNextToolKey,
        `[${fixture.name}] expected next=${String(fixture.expectedNextToolKey)}, got ${String(nextKey)}`,
      );
    } catch (error) {
      failures.push((error as Error).message);
    }
  }

  if (failures.length) {
    // eslint-disable-next-line no-console
    console.error(`validate-router-plan failed:\n- ${failures.join('\n- ')}`);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`validate-router-plan passed (${routerPlanFixtures.length} fixtures)`);
};

run();
