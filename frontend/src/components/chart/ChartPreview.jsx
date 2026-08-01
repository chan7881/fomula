import { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";

export default function ChartPreview({ figure }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !figure) return;
    Plotly.react(containerRef.current, figure.data, figure.layout, {
      responsive: true,
      displayModeBar: true,
    });
  }, [figure]);

  return (
    <div className="rounded-lg border-2 border-slate-200 bg-white">
      {figure ? (
        <div ref={containerRef} className="min-h-[450px] w-full" />
      ) : (
        <div className="flex min-h-[450px] items-center justify-center text-sm text-slate-400">
          엑셀을 업로드하고 축/계열을 설정한 뒤 "그래프 생성"을 눌러주세요.
        </div>
      )}
    </div>
  );
}
