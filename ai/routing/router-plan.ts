export type RouterResolvedPlanItem = {
  toolKey: string;
  tool: string;
  args?: Record<string, unknown>;
};

export const getNextRouterPlanItem = (plan: RouterResolvedPlanItem[], steps: any[]) => {
  const hasToolResult = (toolName: string) =>
    steps.some((step: any) =>
      (step.toolResults ?? []).some((result: any) => String(result.toolName ?? '') === toolName),
    );

  return plan.find((item) => item.toolKey && !hasToolResult(String(item.toolKey)));
};
