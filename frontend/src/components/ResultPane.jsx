const DOWNLOAD_BUTTON_CLASS =
  "rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900";
const DISABLED_BUTTON_CLASS =
  "cursor-not-allowed rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400";

export default function ResultPane({
  gifUrl,
  mp4Url,
  pngUrl,
  isLoading,
  altText = "생성된 애니메이션",
  downloadName = "output",
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-lg border border-slate-200 bg-white p-6">
      {isLoading && (
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="text-sm">Manim이 애니메이션을 렌더링하고 있습니다...</p>
        </div>
      )}
      {!isLoading && !gifUrl && (
        <p className="text-sm text-slate-400">생성된 애니메이션이 여기에 표시됩니다.</p>
      )}
      {!isLoading && gifUrl && (
        <>
          <img
            src={gifUrl}
            alt={altText}
            className="max-w-full rounded-md border border-slate-100"
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={gifUrl} download={`${downloadName}.gif`} className={DOWNLOAD_BUTTON_CLASS}>
              GIF 다운로드
            </a>
            {mp4Url ? (
              <a href={mp4Url} download={`${downloadName}.mp4`} className={DOWNLOAD_BUTTON_CLASS}>
                MP4 다운로드
              </a>
            ) : (
              <span
                title="투명 배경에서는 MP4를 지원하지 않습니다. 배경색을 지정하면 이용할 수 있습니다."
                className={DISABLED_BUTTON_CLASS}
              >
                MP4 다운로드
              </span>
            )}
            {pngUrl ? (
              <a href={pngUrl} download={`${downloadName}.png`} className={DOWNLOAD_BUTTON_CLASS}>
                PNG 다운로드
              </a>
            ) : (
              <span className={DISABLED_BUTTON_CLASS}>PNG 다운로드</span>
            )}
          </div>
          <p className="text-xs text-slate-400">PNG는 애니메이션 마지막 프레임을 동일한 크기로 저장합니다.</p>
        </>
      )}
    </div>
  );
}
