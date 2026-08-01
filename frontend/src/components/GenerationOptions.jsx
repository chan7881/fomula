const MIN_FONT_SIZE = 20;
const MAX_FONT_SIZE = 120;

export default function GenerationOptions({
  transparentBackground,
  onTransparentChange,
  backgroundColor,
  onBackgroundColorChange,
  textColor,
  onTextColorChange,
  fontSize,
  onFontSizeChange,
  onGenerate,
  isLoading,
}) {
  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-700">색상 옵션</p>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={transparentBackground}
          onChange={(e) => onTransparentChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        배경 없음 (투명 GIF)
      </label>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className={transparentBackground ? "text-slate-300" : undefined}>배경색</span>
          <input
            type="color"
            value={backgroundColor}
            disabled={transparentBackground}
            onChange={(e) => onBackgroundColorChange(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span>글자색</span>
          <input
            type="color"
            value={textColor}
            onChange={(e) => onTextColorChange(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-slate-300"
          />
        </label>
      </div>

      <label className="block text-sm text-slate-600">
        <div className="mb-1 flex items-center justify-between">
          <span>글자 크기</span>
          <span className="font-mono text-xs text-slate-400">{fontSize}px</span>
        </div>
        <input
          type="range"
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          step={2}
          value={fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
      </label>

      <button
        type="button"
        onClick={onGenerate}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Loading...
          </>
        ) : (
          "애니메이션 생성"
        )}
      </button>
    </div>
  );
}
