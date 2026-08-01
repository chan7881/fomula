import { InlineMath } from "react-katex";

export default function AutocompleteDropdown({ items, activeIndex, position, onSelect }) {
  if (items.length === 0) return null;

  return (
    <ul
      className="absolute z-20 max-h-56 w-56 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {items.map((item, index) => (
        <li key={item.id}>
          <button
            type="button"
            // onMouseDown (not onClick) so this fires before the textarea's
            // blur/selection-change would otherwise dismiss the dropdown.
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(item);
            }}
            className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm ${
              index === activeIndex ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className="font-mono text-xs text-slate-500">\{item.trigger}</span>
            <InlineMath math={item.preview} errorColor="#94a3b8" />
          </button>
        </li>
      ))}
    </ul>
  );
}
