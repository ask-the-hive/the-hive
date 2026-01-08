import { routerFixtures } from '@/scripts/router-fixtures';
import { getSolanaRouterFallbackDecision } from '@/ai/routing/solana-router';

const fail = (message: string) => {
  throw new Error(message);
};

const assert = (condition: boolean, message: string) => {
  if (!condition) fail(message);
};

const matchesArgs = (
  expected: Record<string, unknown> | undefined,
  actual: Record<string, unknown> | undefined,
): boolean => {
  if (!expected) return true;
  if (!actual) return false;
  return Object.entries(expected).every(([key, value]) => {
    const actualValue = actual[key];
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value) === JSON.stringify(actualValue);
    }
    return actualValue === value;
  });
};

const run = () => {
  const failures: string[] = [];

  for (const fixture of routerFixtures) {
    try {
      const decision = getSolanaRouterFallbackDecision(
        fixture.lastUserText,
        fixture.context,
      );

      assert(
        decision.agent === fixture.expected.agent,
        `[${fixture.name}] expected agent=${fixture.expected.agent}, got ${decision.agent}`,
      );
      assert(
        decision.mode === fixture.expected.mode,
        `[${fixture.name}] expected mode=${fixture.expected.mode}, got ${decision.mode}`,
      );
      assert(
        decision.ui === fixture.expected.ui,
        `[${fixture.name}] expected ui=${fixture.expected.ui}, got ${decision.ui}`,
      );
      assert(
        decision.stopCondition === fixture.expected.stopCondition,
        `[${fixture.name}] expected stop=${fixture.expected.stopCondition}, got ${decision.stopCondition}`,
      );

      assert(
        decision.toolPlan.length === fixture.expected.toolPlan.length,
        `[${fixture.name}] expected toolPlan length=${fixture.expected.toolPlan.length}, got ${decision.toolPlan.length}`,
      );

      if (fixture.expected.toolPlan.length > 0) {
        const expectedPlan = fixture.expected.toolPlan[0];
        const actualPlan = decision.toolPlan[0];
        assert(
          actualPlan.tool === expectedPlan.tool,
          `[${fixture.name}] expected tool=${expectedPlan.tool}, got ${actualPlan.tool}`,
        );
        assert(
          matchesArgs(expectedPlan.args, actualPlan.args as Record<string, unknown> | undefined),
          `[${fixture.name}] expected args=${JSON.stringify(expectedPlan.args)}, got ${JSON.stringify(actualPlan.args)}`,
        );
      }
    } catch (error) {
      failures.push((error as Error).message);
    }
  }

  if (failures.length) {
    // eslint-disable-next-line no-console
    console.error(`validate-router failed:\n- ${failures.join('\n- ')}`);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`validate-router passed (${routerFixtures.length} fixtures)`);
};

run();
