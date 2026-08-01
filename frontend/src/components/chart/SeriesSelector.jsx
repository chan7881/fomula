export default function SeriesSelector({ columns, displayFields, onToggle }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-slate-700">데이터 계열 선택</p>
      <div className="grid max-h-60 grid-cols-2 gap-3 overflow-y-auto rounded-xl border bg-slate-50 p-4 shadow-inner sm:grid-cols-4 lg:grid-cols-6">
        {columns.map((c) => (
          <label
            key={c}
            className="flex cursor-pointer items-center gap-2 rounded border bg-white p-2 shadow-sm"
          >
            <input
              type="checkbox"
              checked={displayFields.includes(c)}
              onChange={() => onToggle(c)}
              className="h-4 w-4 cursor-pointer"
            />
            <span className="flex-1 truncate text-xs font-medium text-slate-700">{c}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
