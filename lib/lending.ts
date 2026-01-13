const PROJECT_ALIASES: Array<{ match: RegExp; key: string }> = [
  { match: /\bkamino\b/, key: 'kamino-lend' },
  { match: /\bjupiter\b/, key: 'jupiter-lend' },
  { match: /\bjup\b/, key: 'jupiter-lend' },
];

export const resolveLendingProjectKey = (project?: string): string | null => {
  if (!project) return null;
  const normalized = project.toLowerCase().replace(/[^a-z]/g, '');
  for (const alias of PROJECT_ALIASES) {
    if (alias.match.test(project.toLowerCase())) {
      return alias.key;
    }
  }
  if (normalized.endsWith('lend')) {
    // Fall back to normalized project string if it already looks like "something-lend".
    return project.toLowerCase();
  }
  return null;
};

