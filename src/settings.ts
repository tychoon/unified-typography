export interface HeadingSettings { size: number; before: number; after: number }
export interface TypographySettings { lineHeight: number; paragraphGap: number; listBefore: number; listAfter: number; headings: HeadingSettings[] }
export const DEFAULTS: TypographySettings = {
  lineHeight: 1.65, paragraphGap: 8, listBefore: 8, listAfter: 8,
  headings: [
    {size: 2, before: 24, after: 12}, {size: 1.65, before: 20, after: 10},
    {size: 1.4, before: 16, after: 8}, {size: 1.2, before: 14, after: 6},
    {size: 1.1, before: 12, after: 6}, {size: 1, before: 10, after: 4}
  ]
};
function number(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}
export function normalize(value: unknown): TypographySettings {
  const s = (value && typeof value === 'object' ? value : {}) as Partial<TypographySettings>;
  return {
    lineHeight: number(s.lineHeight, DEFAULTS.lineHeight, 1, 3),
    paragraphGap: number(s.paragraphGap, DEFAULTS.paragraphGap, 0, 80),
    listBefore: number(s.listBefore, DEFAULTS.listBefore, 0, 120),
    listAfter: number(s.listAfter, DEFAULTS.listAfter, 0, 120),
    headings: DEFAULTS.headings.map((h, i) => {
      const v = Array.isArray(s.headings) ? s.headings[i] : undefined;
      return {size: number(v?.size, h.size, 0.6, 4), before: number(v?.before, h.before, 0, 120), after: number(v?.after, h.after, 0, 120)};
    })
  };
}
export function variables(s: TypographySettings): string {
  return `--ut-line-height:${s.lineHeight};--ut-paragraph-gap:${s.paragraphGap}px;--ut-list-before:${s.listBefore}px;--ut-list-after:${s.listAfter}px;` + s.headings.map((h, i) =>
    `--ut-h${i + 1}-size:${h.size};--ut-h${i + 1}-before:${h.before}px;--ut-h${i + 1}-after:${h.after}px;`
  ).join('');
}
