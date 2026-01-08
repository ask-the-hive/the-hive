import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

type PromptHit = {
  file: string;
  name: string;
  chars: number;
  estTokens: number;
  preview: string;
};

const WORKSPACE_ROOT = process.cwd();
const DEFAULT_ROOTS = ['ai', 'app', 'lib', 'components', 'hooks', 'services', 'scripts'];

const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'out', 'coverage']);

const isTsFile = (filename: string) => filename.endsWith('.ts') || filename.endsWith('.tsx');

const walk = (dir: string, out: string[] = []): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(full, out);
      continue;
    }
    if (entry.isFile() && isTsFile(entry.name)) out.push(full);
  }
  return out;
};

const extractTemplateText = (node: ts.TemplateExpression): string => {
  let text = node.head.text;
  for (const span of node.templateSpans) text += span.literal.text;
  return text;
};

const extractString = (node: ts.Expression): string | null => {
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return extractTemplateText(node);
  return null;
};

const normalizePreview = (text: string) => text.replace(/\s+/g, ' ').trim().slice(0, 140);

const isRoleSystemObjectLiteral = (obj: ts.ObjectLiteralExpression): boolean => {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (!ts.isIdentifier(prop.name) && !ts.isStringLiteral(prop.name)) continue;
    const key = ts.isIdentifier(prop.name) ? prop.name.text : prop.name.text;
    if (key !== 'role') continue;
    const value = prop.initializer;
    if (ts.isStringLiteral(value) && value.text === 'system') return true;
  }
  return false;
};

const collectPromptsFromFile = (filePath: string): PromptHit[] => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const source = ts.createSourceFile(filePath, raw, ts.ScriptTarget.Latest, true);
  const hits: PromptHit[] = [];

  const addHit = (name: string, text: string) => {
    const chars = text.length;
    const estTokens = Math.ceil(chars / 4);
    hits.push({
      file: path.relative(WORKSPACE_ROOT, filePath),
      name,
      chars,
      estTokens,
      preview: normalizePreview(text),
    });
  };

  const visit = (node: ts.Node) => {
    // Variable declarations like: export const FOO_DESCRIPTION = `...`;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const name = node.name.text;
      const value = extractString(node.initializer);
      if (value) {
        const looksLikePromptName =
          name.endsWith('_DESCRIPTION') ||
          name.endsWith('_PROMPT') ||
          name.toLowerCase().includes('system');
        if (looksLikePromptName) addHit(name, value);
      }
    }

    // Object literal property: systemPrompt: `...`
    if (ts.isPropertyAssignment(node) && node.initializer) {
      const key = ts.isIdentifier(node.name)
        ? node.name.text
        : ts.isStringLiteral(node.name)
          ? node.name.text
          : null;
      if (key) {
        const value = extractString(node.initializer);
        if (value && key === 'systemPrompt') addHit('systemPrompt', value);

        // CoreMessage { role: 'system', content: `...` }
        if (value && key === 'content') {
          const parent = node.parent;
          if (ts.isObjectLiteralExpression(parent) && isRoleSystemObjectLiteral(parent)) {
            addHit('system.content', value);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(source);
  return hits;
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const quiet = args.includes('--quiet');
  const minTokensArg = args.find((a) => a.startsWith('--minTokens='));
  const minTokens = minTokensArg ? Number(minTokensArg.split('=')[1]) : 150;
  const maxTokensArg = args.find((a) => a.startsWith('--maxTokens='));
  const maxTokens = maxTokensArg ? Number(maxTokensArg.split('=')[1]) : undefined;
  const rootsArg = args.find((a) => a.startsWith('--roots='));
  const roots = rootsArg ? rootsArg.split('=')[1].split(',').filter(Boolean) : DEFAULT_ROOTS;
  return { json, quiet, minTokens, maxTokens, roots };
};

const main = () => {
  const { json, quiet, minTokens, maxTokens, roots } = parseArgs();
  const files = roots
    .map((r) => path.join(WORKSPACE_ROOT, r))
    .filter((p) => fs.existsSync(p))
    .flatMap((p) => walk(p));

  const allHits = files.flatMap(collectPromptsFromFile);
  const offenders =
    typeof maxTokens === 'number'
      ? allHits
          .filter((h) => h.estTokens > maxTokens)
          .sort((a, b) => b.estTokens - a.estTokens || a.file.localeCompare(b.file))
      : [];
  const filtered = allHits
    .filter((h) => h.estTokens >= minTokens)
    .sort((a, b) => b.estTokens - a.estTokens || a.file.localeCompare(b.file));

  if (typeof maxTokens === 'number' && offenders.length) {
    // eslint-disable-next-line no-console
    console.error(`Prompt audit failed (maxTokens=${maxTokens}) — ${offenders.length} offenders\n`);
    // eslint-disable-next-line no-console
    console.error(`estTokens\tchars\tfile\tname\tpreview`);
    for (const hit of offenders) {
      // eslint-disable-next-line no-console
      console.error(`${hit.estTokens}\t${hit.chars}\t${hit.file}\t${hit.name}\t${hit.preview}`);
    }
    process.exit(1);
  }

  if (json) {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        { minTokens, maxTokens: maxTokens ?? null, count: filtered.length, prompts: filtered },
        null,
        2,
      ),
    );
    return;
  }

  if (typeof maxTokens === 'number' && quiet) return;

  // eslint-disable-next-line no-console
  console.log(`Prompt audit (minTokens=${minTokens}) — ${filtered.length} hits\n`);
  // eslint-disable-next-line no-console
  console.log(`estTokens\tchars\tfile\tname\tpreview`);
  for (const hit of filtered) {
    // eslint-disable-next-line no-console
    console.log(`${hit.estTokens}\t${hit.chars}\t${hit.file}\t${hit.name}\t${hit.preview}`);
  }
};

main();
