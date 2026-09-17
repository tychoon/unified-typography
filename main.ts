import {Plugin, PluginSettingTab, Setting, MarkdownRenderChild, MarkdownView, type MarkdownPostProcessorContext} from 'obsidian';
import {typographyField} from './src/editor';
import {buildPlan, readingGap, type Plan} from './src/model';
import {decorateBreaks} from './src/reading';
import {DEFAULTS, normalize, variables, type TypographySettings} from './src/settings';

class ReadingChild extends MarkdownRenderChild {
  constructor(element: HTMLElement, private restore: () => void) { super(element); }
  onunload(): void { this.restore(); }
}
export default class UnifiedTypography extends Plugin {
  settings: TypographySettings = normalize(DEFAULTS);
  private documents = new Map<Document, HTMLStyleElement>();
  private cleanups = new Set<() => void>();
  private marked = new WeakSet<HTMLElement>();
  private cachedSource = '';
  private cachedPlan?: Plan;
  private saveQueue: Promise<void> = Promise.resolve();

  async onload(): Promise<void> {
    this.settings = normalize(await this.loadData());
    this.apply();
    this.registerEditorExtension(typographyField);
    this.registerMarkdownPostProcessor((el, ctx) => this.process(el, ctx));
    this.addSettingTab(new TypographyTab(this));
    this.registerEvent(this.app.workspace.on('layout-change', () => this.apply()));
    this.registerEvent(this.app.workspace.on('window-open', (_win, win) => this.ensureDocument(win.document)));
    this.app.workspace.onLayoutReady(() => { this.apply(); this.refreshReading(); });
  }
  private ensureDocument(doc: Document): void {
    let style = this.documents.get(doc);
    if (!style) {
      style = doc.createElement('style'); style.dataset.unifiedTypography = 'variables';
      doc.head.appendChild(style); this.documents.set(doc, style);
    }
    style.textContent = `.markdown-source-view.mod-cm6, .markdown-preview-view, .markdown-rendered {${variables(this.settings)}}`;
  }
  apply(): void {
    this.ensureDocument(document);
    this.app.workspace.iterateAllLeaves(leaf => this.ensureDocument(leaf.view.containerEl.ownerDocument));
    for (const [doc, style] of this.documents) {
      if (doc.defaultView?.closed) { style.remove(); this.documents.delete(doc); }
      else style.textContent = `.markdown-source-view.mod-cm6, .markdown-preview-view, .markdown-rendered {${variables(this.settings)}}`;
    }
  }
  async updateSettings(): Promise<void> {
    this.settings = normalize(this.settings);
    this.apply();
    const snapshot = structuredClone(this.settings);
    this.saveQueue = this.saveQueue.catch(() => {}).then(() => this.saveData(snapshot));
    await this.saveQueue;
  }
  private refreshReading(): void {
    this.app.workspace.iterateAllLeaves(leaf => {
      if (leaf.view instanceof MarkdownView) leaf.view.previewMode.rerender(true);
    });
  }
  private process(el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
    this.ensureDocument(el.ownerDocument);
    const elements = [el, ...Array.from(el.querySelectorAll<HTMLElement>('p,h1,h2,h3,h4,h5,h6'))]
      .filter(node => /^(P|H[1-6])$/.test(node.tagName) && !node.closest('li, blockquote, table, pre, .callout, .internal-embed'));
    const used = new Set<number>();
    for (const node of elements) {
      if (this.marked.has(node)) continue;
      const info = ctx.getSectionInfo(node);
      if (!info) continue;
      if (!this.cachedPlan || this.cachedSource !== info.text) {
        this.cachedSource = info.text; this.cachedPlan = buildPlan(info.text);
      }
      const plan = this.cachedPlan;
      const level = node.tagName === 'P' ? 0 : Number(node.tagName[1]);
      const block = plan.blocks.find(b => b.start >= info.lineStart && b.start <= info.lineEnd && b.level === level && !used.has(b.start));
      if (!block) continue;
      used.add(block.start); this.marked.add(node);
      node.classList.add('ut-reading', level ? `ut-h${level}` : 'ut-prose');
      node.style.setProperty('--ut-before', readingGap(plan, block));
      node.style.setProperty('--ut-after', plan.lines.get(block.end)?.after ?? '0px');
      const restoreBreaks = level ? () => {} : decorateBreaks(node);
      let restored = false;
      const cleanup = () => {
        if (restored) return; restored = true;
        restoreBreaks(); node.classList.remove('ut-reading', level ? `ut-h${level}` : 'ut-prose');
        node.style.removeProperty('--ut-before'); node.style.removeProperty('--ut-after');
        this.marked.delete(node); this.cleanups.delete(cleanup);
      };
      this.cleanups.add(cleanup); ctx.addChild(new ReadingChild(node, cleanup));
    }
  }
  onunload(): void {
    for (const cleanup of [...this.cleanups]) cleanup();
    for (const style of this.documents.values()) style.remove();
    this.documents.clear();
  }
}
class TypographyTab extends PluginSettingTab {
  constructor(private typography: UnifiedTypography) { super(typography.app, typography); }
  display(): void {
    const {containerEl} = this; const plugin = this.typography;
    containerEl.empty();
    containerEl.createEl('p', {text: 'Apply the same settings to reading view, Live Preview, and source mode. Changes take effect immediately. Only top-level body text and ATX (#) headings are adjusted.'});
    const slider = (name: string, desc: string, value: number, min: number, max: number, step: number, change: (value: number) => void) => {
      new Setting(containerEl).setName(name).setDesc(desc).addSlider(control => control
        .setLimits(min, max, step).setValue(value).setDynamicTooltip().onChange(async v => {change(v); await plugin.updateSettings();}));
    };
    slider('Body line height', 'Line height as a multiple of the body font size. Automatically wrapped lines use this value without additional spacing.', plugin.settings.lineHeight, 1, 3, 0.05, v => plugin.settings.lineHeight = v);
    slider('Source line break spacing', 'Extra spacing in pixels at each source line break in body text. Blank separator lines do not add another full gap.', plugin.settings.paragraphGap, 0, 80, 1, v => plugin.settings.paragraphGap = v);
    for (let i = 0; i < 6; i++) {
      new Setting(containerEl).setName(`Heading ${i + 1}`).setHeading();
      slider('Font size', 'Size as a multiple of the current body font size.', plugin.settings.headings[i].size, 0.6, 4, 0.05, v => plugin.settings.headings[i].size = v);
      slider('Space before', 'Spacing in pixels. Uses the larger of this value and the space after the previous block.', plugin.settings.headings[i].before, 0, 120, 1, v => plugin.settings.headings[i].before = v);
      slider('Space after', 'Spacing in pixels. Uses the larger of this value and the space before the next heading.', plugin.settings.headings[i].after, 0, 120, 1, v => plugin.settings.headings[i].after = v);
    }
    new Setting(containerEl).setName('Reset to defaults').addButton(button => button.setButtonText('Reset to defaults').onClick(async () => {
      plugin.settings = normalize(DEFAULTS); await plugin.updateSettings(); this.display();
    }));
  }
}
