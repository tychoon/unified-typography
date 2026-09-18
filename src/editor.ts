import {StateField, RangeSetBuilder} from '@codemirror/state';
import {Decoration, EditorView, type DecorationSet} from '@codemirror/view';
import {buildPlan} from './model';
function decorate(source: string): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const line of [...buildPlan(source).lines.values()].sort((a, b) => a.from - b.from)) {
    builder.add(line.from, line.from, Decoration.line({
      attributes: {class: `ut-line ut-${line.kind}${line.level ? ` ut-h${line.level}` : ''}`,
        style: `--ut-before:${line.before};--ut-after:${line.after};`}
    }));
  }
  return builder.finish();
}
export const typographyField = StateField.define<DecorationSet>({
  create: state => decorate(state.doc.toString()),
  update: (value, transaction) => transaction.docChanged ? decorate(transaction.newDoc.toString()) : value,
  provide: field => EditorView.decorations.from(field)
});
