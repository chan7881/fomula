const MARKER_OPTIONS = [
  { value: "circle", label: "●" },
  { value: "square", label: "■" },
  { value: "triangle-up", label: "▲" },
  { value: "diamond", label: "◆" },
];

export default function StylePanel({
  title,
  onTitleChange,
  xLabelMain,
  onXLabelMainChange,
  xLabelSub,
  onXLabelSubChange,
  showXSub,
  yLabelMain,
  onYLabelMainChange,
  yLabelSub,
  onYLabelSubChange,
  showYSub,
  gridEnabled,
  onGridEnabledChange,
  gridColor,
  onGridColorChange,
  legendShow,
  onLegendShowChange,
  legendPos,
  onLegendPosChange,
  displayFields,
  seriesStyles,
  onSeriesStyleChange,
  chartWidth,
  onChartWidthChange,
  chartHeight,
  onChartHeightChange,
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium text-slate-700">라벨 커스텀</p>
          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="그래프 제목"
              className="w-full rounded border p-2 text-sm"
            />
            <input
              value={xLabelMain}
              onChange={(e) => onXLabelMainChange(e.target.value)}
              placeholder="메인 X축 라벨"
              className="w-full rounded border p-2 text-xs"
            />
            {showXSub && (
              <input
                value={xLabelSub}
                onChange={(e) => onXLabelSubChange(e.target.value)}
                placeholder="보조 X축 라벨"
                className="w-full rounded border p-2 text-xs"
              />
            )}
            <input
              value={yLabelMain}
              onChange={(e) => onYLabelMainChange(e.target.value)}
              placeholder="메인 Y축 라벨"
              className="w-full rounded border p-2 text-xs"
            />
            {showYSub && (
              <input
                value={yLabelSub}
                onChange={(e) => onYLabelSubChange(e.target.value)}
                placeholder="보조 Y축 라벨"
                className="w-full rounded border p-2 text-xs"
              />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium text-slate-700">그리드 · 범례</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={gridEnabled}
                  onChange={(e) => onGridEnabledChange(e.target.checked)}
                  className="mr-2"
                />
                격자 표시
              </label>
              <input
                type="color"
                value={gridColor}
                onChange={(e) => onGridColorChange(e.target.value)}
                className="h-8 w-12 rounded border"
              />
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <label className="text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={legendShow}
                  onChange={(e) => onLegendShowChange(e.target.checked)}
                  className="mr-2"
                />
                범례 표시
              </label>
              <select
                value={legendPos}
                onChange={(e) => onLegendPosChange(e.target.value)}
                className="rounded border p-1 text-xs"
              >
                <option value="top right">오른쪽 위</option>
                <option value="top left">왼쪽 위</option>
                <option value="bottom right">오른쪽 아래</option>
                <option value="bottom left">왼쪽 아래</option>
              </select>
            </div>
            <div className="flex items-center gap-3 border-t pt-3">
              <span className="text-sm text-slate-600">차트 크기</span>
              <input
                type="number"
                placeholder="가로"
                value={chartWidth}
                onChange={(e) => onChartWidthChange(e.target.value)}
                className="w-20 rounded border p-1.5 text-sm"
              />
              <span className="text-slate-400">×</span>
              <input
                type="number"
                placeholder="세로"
                value={chartHeight}
                onChange={(e) => onChartHeightChange(e.target.value)}
                className="w-20 rounded border p-1.5 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-slate-700">계열 상세 설정</p>
        {displayFields.length === 0 ? (
          <p className="text-sm text-slate-400">계열을 먼저 선택해주세요.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {displayFields.map((name) => {
              const s = seriesStyles[name];
              if (!s) return null;
              return (
                <div key={name} className="rounded-lg border bg-slate-50 p-3 text-xs shadow-sm">
                  <div className="mb-2 border-b pb-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="max-w-[80px] truncate font-medium text-slate-500">{name}</span>
                      <span className="text-[9px] text-slate-400">범례 이름</span>
                    </div>
                    <input
                      value={s.display_name}
                      onChange={(e) => onSeriesStyleChange(name, "display_name", e.target.value)}
                      className="w-full rounded border bg-white p-1 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label>
                      색상
                      <input
                        type="color"
                        value={s.color}
                        onChange={(e) => onSeriesStyleChange(name, "color", e.target.value)}
                        className="h-4 w-full"
                      />
                    </label>
                    <label>
                      기호
                      <select
                        value={s.marker}
                        onChange={(e) => onSeriesStyleChange(name, "marker", e.target.value)}
                        className="w-full rounded border"
                      >
                        {MARKER_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      굵기
                      <input
                        type="number"
                        step={0.5}
                        value={s.linewidth}
                        onChange={(e) => onSeriesStyleChange(name, "linewidth", Number(e.target.value))}
                        className="w-full rounded border"
                      />
                    </label>
                    <label>
                      크기
                      <input
                        type="number"
                        value={s.markersize}
                        onChange={(e) => onSeriesStyleChange(name, "markersize", Number(e.target.value))}
                        className="w-full rounded border"
                      />
                    </label>
                    <div className="col-span-2 mt-1 flex items-center gap-3">
                      <label>
                        <input
                          type="checkbox"
                          checked={s.show_line}
                          onChange={(e) => onSeriesStyleChange(name, "show_line", e.target.checked)}
                        />{" "}
                        선
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={s.show_marker}
                          onChange={(e) => onSeriesStyleChange(name, "show_marker", e.target.checked)}
                        />{" "}
                        점
                      </label>
                      <select
                        value={s.linestyle}
                        onChange={(e) => onSeriesStyleChange(name, "linestyle", e.target.value)}
                        className="ml-auto rounded border"
                      >
                        <option value="solid">실선</option>
                        <option value="dash">파선</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
