function AxisSelectBlock({ label, dashed, columns, value, onChange, optKey, axisOpts, onOptChange }) {
  return (
    <div className={`rounded border border-slate-100 bg-slate-50 p-2 ${dashed ? "border-dashed" : ""}`}>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border bg-white p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">선택 안함</option>
        {columns.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <div className="mt-1 flex gap-3 pl-1">
        <label className="flex cursor-pointer items-center text-xs text-slate-500">
          <input
            type="checkbox"
            checked={axisOpts.log}
            onChange={(e) => onOptChange(optKey, "log", e.target.checked)}
            className="mr-1 h-3 w-3"
          />
          로그 스케일
        </label>
        <label className="flex cursor-pointer items-center text-xs text-slate-500">
          <input
            type="checkbox"
            checked={axisOpts.inv}
            onChange={(e) => onOptChange(optKey, "inv", e.target.checked)}
            className="mr-1 h-3 w-3"
          />
          반전
        </label>
      </div>
    </div>
  );
}

export default function AxisConfigPanel({
  columns,
  xAxisMain,
  xAxisSub,
  yAxisMain,
  yAxisSub,
  onXMainChange,
  onXSubChange,
  onYMainChange,
  onYSubChange,
  axisOpts,
  onAxisOptChange,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-slate-700">X축 설정</p>
        <div className="space-y-3">
          <AxisSelectBlock
            label="메인 X축"
            columns={columns}
            value={xAxisMain}
            onChange={onXMainChange}
            optKey="xMain"
            axisOpts={axisOpts.xMain}
            onOptChange={onAxisOptChange}
          />
          <AxisSelectBlock
            label="보조 X축 (선택)"
            dashed
            columns={columns}
            value={xAxisSub}
            onChange={onXSubChange}
            optKey="xSub"
            axisOpts={axisOpts.xSub}
            onOptChange={onAxisOptChange}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-slate-700">Y축 설정</p>
        <div className="space-y-3">
          <AxisSelectBlock
            label="메인 Y축"
            columns={columns}
            value={yAxisMain}
            onChange={onYMainChange}
            optKey="yMain"
            axisOpts={axisOpts.yMain}
            onOptChange={onAxisOptChange}
          />
          <AxisSelectBlock
            label="보조 Y축 (오른쪽)"
            dashed
            columns={columns}
            value={yAxisSub}
            onChange={onYSubChange}
            optKey="ySub"
            axisOpts={axisOpts.ySub}
            onOptChange={onAxisOptChange}
          />
        </div>
      </div>
    </div>
  );
}
