import { InlineMath } from "react-katex";
import { LATEX_CATEGORIES, LATEX_SYMBOLS } from "../data/latexSymbols.js";

export default function SymbolPalette({ onInsert }) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
      {LATEX_CATEGORIES.map((category) => (
        <div key={category}>
          <p className="mb-1.5 text-xs font-medium text-slate-500">{category}</p>
          <div className="flex flex-wrap gap-1.5">
            {LATEX_SYMBOLS.filter((s) => s.category === category).map((symbol) => (
              <button
                key={symbol.id}
                type="button"
                title={symbol.preview}
                onClick={() => onInsert(symbol.insert)}
                className="flex min-w-[2.5rem] items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-800 transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <InlineMath math={symbol.preview} errorColor="#94a3b8" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
