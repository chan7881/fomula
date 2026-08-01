import { useEffect, useState } from "react";
import { BlockMath } from "react-katex";
import katex from "katex";

// Validity is checked separately from rendering (via katex.renderToString)
// instead of relying on <BlockMath>'s renderError callback, because that
// callback fires mid-render and calling setState from it triggers React's
// "update while rendering a different component" warning.
export default function PreviewPane({ latex }) {
  const [error, setError] = useState(null);
  const trimmed = latex.trim();

  useEffect(() => {
    if (!trimmed) {
      setError(null);
      return;
    }
    try {
      katex.renderToString(trimmed, { throwOnError: true, displayMode: true });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [trimmed]);

  return (
    <div className="flex min-h-[120px] items-center justify-center overflow-x-auto rounded-lg border border-slate-200 bg-white p-6">
      {!trimmed && (
        <span className="text-sm text-slate-400">
          수식을 입력하면 여기에 미리보기가 표시됩니다.
        </span>
      )}
      {trimmed && error && (
        <span className="text-sm text-red-500">
          LaTeX 문법 오류: 수식을 확인해주세요.
        </span>
      )}
      {trimmed && !error && <BlockMath math={trimmed} />}
    </div>
  );
}
