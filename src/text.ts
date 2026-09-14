const WORD_PATTERN_CACHE = new Map<string, RegExp>();

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function wordPattern(word: string): RegExp {
  const cached = WORD_PATTERN_CACHE.get(word);
  if (cached) {
    return cached;
  }
  const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi");
  WORD_PATTERN_CACHE.set(word, pattern);
  return pattern;
}

export function countWords(value: string): number {
  const matches = value.match(/[\p{L}\p{N}]+/gu);
  return matches ? matches.length : 0;
}

export function countOccurrences(haystack: string, needles: readonly string[]): number {
  let count = 0;
  for (const needle of needles) {
    const matches = haystack.match(wordPattern(needle));
    count += matches ? matches.length : 0;
  }
  return count;
}

export function hasAny(haystack: string, needles: readonly string[]): boolean {
  for (const needle of needles) {
    if (wordPattern(needle).test(haystack)) {
      return true;
    }
  }
  return false;
}

export function extractCodeBlocks(value: string): string[] {
  const blocks: string[] = [];
  const pattern = /```[\s\S]*?```/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value)) !== null) {
    blocks.push(match[0]);
  }
  return blocks;
}

export function stripCodeBlocks(value: string): string {
  return value.replace(/```[\s\S]*?```/g, " ");
}

export function extractUrls(value: string): string[] {
  const matches = value.match(/https?:\/\/[^\s<>)]+/g);
  return matches ? matches.map((m) => m.replace(/[.,;:!?]+$/, "")) : [];
}

export function extractIssueReferences(value: string): string[] {
  const matches = value.match(/(?:closes?|fixes?|resolves?|refs?|related to)\s+#(\d+)/gi);
  return matches ? matches : [];
}

export function hasSection(value: string, headings: readonly string[]): boolean {
  const lower = value.toLowerCase();
  return headings.some((heading) => {
    const escaped = escapeRegExp(heading.toLowerCase());
    const pattern = new RegExp(
      `^\\s{0,3}(?:#{1,6}\\s*|\\*{1,2}\\s*|[*+-]\\s+|\\d+[.)]\\s+)?${escaped}[^\\p{L}\\p{N}_]*\\s*:?\\s*$`,
      "m",
    );
    return pattern.test(lower);
  });
}

export function containsCheckboxes(value: string): boolean {
  return /-\s*\[[\sxX]\]/.test(value);
}

export function countCheckboxes(value: string): number {
  const matches = value.match(/-\s*\[[\sxX]\]/g);
  return matches ? matches.length : 0;
}

export function extractFileReferences(value: string): string[] {
  const matches = value.match(
    /(?:\b[\w./-]+\.(?:ts|tsx|js|jsx|rs|py|sol|json|md|yml|yaml|toml|css|html|vue|svelte)\b|`[^`]+`)/g,
  );
  if (!matches) {
    return [];
  }
  return [...new Set(matches.map((m) => m.replace(/^`|`$/g, "")))];
}
