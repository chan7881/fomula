import { useState } from "react";
import toast from "react-hot-toast";
import FileUploadCard from "../components/chart/FileUploadCard.jsx";
import AxisConfigPanel from "../components/chart/AxisConfigPanel.jsx";
import SeriesSelector from "../components/chart/SeriesSelector.jsx";
import StylePanel from "../components/chart/StylePanel.jsx";
import ChartPreview from "../components/chart/ChartPreview.jsx";
import ResultPane from "../components/ResultPane.jsx";
import { parseWorkbookFile, getDefaultSeriesStyle, buildPlotlyFigure, buildExportSeries } from "../utils/chartData.js";
import { generateChart } from "../api.js";

const DEFAULT_AXIS_OPTS = { log: false, inv: false };

export default function ChartTab() {
  const [rows, setRows] = useState(null);
  const [columns, setColumns] = useState([]);

  const [xAxisMain, setXAxisMain] = useState("");
  const [xAxisSub, setXAxisSub] = useState("");
  const [yAxisMain, setYAxisMain] = useState("");
  const [yAxisSub, setYAxisSub] = useState("");
  const [axisOpts, setAxisOpts] = useState({
    xMain: { ...DEFAULT_AXIS_OPTS },
    xSub: { ...DEFAULT_AXIS_OPTS },
    yMain: { ...DEFAULT_AXIS_OPTS },
    ySub: { ...DEFAULT_AXIS_OPTS },
  });

  const [displayFields, setDisplayFields] = useState([]);
  const [seriesStyles, setSeriesStyles] = useState({});

  const [chartType, setChartType] = useState("scatter");
  const [isSwapped, setIsSwapped] = useState(false);

  const [title, setTitle] = useState("");
  const [xLabelMain, setXLabelMain] = useState("");
  const [xLabelSub, setXLabelSub] = useState("");
  const [yLabelMain, setYLabelMain] = useState("");
  const [yLabelSub, setYLabelSub] = useState("");
  const [gridEnabled, setGridEnabled] = useState(true);
  const [gridColor, setGridColor] = useState("#f1f1f1");
  const [legendShow, setLegendShow] = useState(true);
  const [legendPos, setLegendPos] = useState("top right");
  const [chartWidth, setChartWidth] = useState("");
  const [chartHeight, setChartHeight] = useState("");

  const [transparentBackground, setTransparentBackground] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [isLoading, setIsLoading] = useState(false);
  const [gifUrl, setGifUrl] = useState(null);
  const [mp4Url, setMp4Url] = useState(null);
  const [pngUrl, setPngUrl] = useState(null);

  const handleFileLoad = async (file) => {
    try {
      const { rows: newRows, columns: newColumns } = await parseWorkbookFile(file);
      setRows(newRows);
      setColumns(newColumns);
      setDisplayFields([]);
      setSeriesStyles({});
      setXAxisMain("");
      setXAxisSub("");
      setYAxisMain("");
      setYAxisSub("");
      toast.success("데이터 로드 완료");
    } catch (error) {
      toast.error(error.message || "파일을 불러오지 못했습니다.");
    }
  };

  const handleAxisOptChange = (axisKey, optKey, value) => {
    setAxisOpts((prev) => ({ ...prev, [axisKey]: { ...prev[axisKey], [optKey]: value } }));
  };

  const handleToggleField = (col) => {
    setDisplayFields((prev) => {
      if (prev.includes(col)) return prev.filter((c) => c !== col);
      setSeriesStyles((styles) =>
        styles[col] ? styles : { ...styles, [col]: getDefaultSeriesStyle(col, prev.length) },
      );
      return [...prev, col];
    });
  };

  const handleSeriesStyleChange = (col, key, value) => {
    setSeriesStyles((prev) => ({ ...prev, [col]: { ...prev[col], [key]: value } }));
  };

  const buildConfig = () => ({
    rows,
    xAxisMain,
    xAxisSub,
    yAxisMain,
    yAxisSub,
    displayFields,
    axisOpts,
    isSwapped,
    chartType,
    seriesStyles,
    title,
    xLabelMain: xLabelMain || xAxisMain,
    xLabelSub: xLabelSub || xAxisSub,
    yLabelMain: yLabelMain || (displayFields[0] ?? ""),
    yLabelSub: yLabelSub || yAxisSub,
    gridEnabled,
    gridColor,
    legendShow,
    legendPos,
    chartWidth,
    chartHeight,
  });

  // Derived, not stateful: the preview re-renders on every relevant change,
  // same live-preview feel as the equation tab's KaTeX pane — no separate
  // "generate preview" button to remember to click after tweaking style.
  const canPreview = Boolean(rows && xAxisMain && displayFields.length > 0);
  const figure = canPreview ? buildPlotlyFigure(buildConfig()) : null;

  const handleGenerateAnimation = async () => {
    if (!rows) {
      toast.error("먼저 엑셀 파일을 로드해주세요.");
      return;
    }
    if (!xAxisMain || displayFields.length === 0) {
      toast.error("Main X축과 계열을 선택하세요.");
      return;
    }

    const cfg = buildConfig();
    let series = buildExportSeries(cfg);
    if (chartType === "bar" && series.length > 1) {
      series = series.slice(0, 1);
      toast("막대그래프는 첫 번째 계열만 애니메이션에 반영됩니다.", { icon: "ℹ️" });
    }

    setGifUrl(null);
    setMp4Url(null);
    setPngUrl(null);
    setIsLoading(true);
    try {
      const {
        gifUrl: newGifUrl,
        mp4Url: newMp4Url,
        pngUrl: newPngUrl,
      } = await generateChart({
        chartType: chartType === "bar" ? "bar" : "line_scatter",
        series,
        title,
        xLabel: cfg.xLabelMain,
        yLabel: cfg.yLabelMain,
        xLog: axisOpts.xMain.log,
        yLog: axisOpts.yMain.log,
        showGrid: gridEnabled,
        showLegend: legendShow,
        transparentBackground,
        backgroundColor,
        width: Number(chartWidth) || 1280,
        height: Number(chartHeight) || 720,
      });
      setGifUrl(newGifUrl);
      setMp4Url(newMp4Url);
      setPngUrl(newPngUrl);
      toast.success("애니메이션 생성 완료!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-6">
        <FileUploadCard onLoad={handleFileLoad} />

        {columns.length > 0 && (
          <>
            <AxisConfigPanel
              columns={columns}
              xAxisMain={xAxisMain}
              xAxisSub={xAxisSub}
              yAxisMain={yAxisMain}
              yAxisSub={yAxisSub}
              onXMainChange={setXAxisMain}
              onXSubChange={setXAxisSub}
              onYMainChange={setYAxisMain}
              onYSubChange={setYAxisSub}
              axisOpts={axisOpts}
              onAxisOptChange={handleAxisOptChange}
            />

            <SeriesSelector columns={columns} displayFields={displayFields} onToggle={handleToggleField} />

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="rounded-lg border bg-white p-2.5 text-sm font-medium shadow-sm sm:w-56"
              >
                <option value="scatter">산점도 / 선 그래프</option>
                <option value="bar">막대 그래프</option>
              </select>
              <button
                type="button"
                onClick={() => setIsSwapped((prev) => !prev)}
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition ${
                  isSwapped ? "bg-indigo-600" : "bg-slate-800 hover:bg-slate-900"
                }`}
              >
                🔄 X-Y축 교차 {isSwapped ? "On" : "Off"}
              </button>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-medium text-slate-700">실시간 미리보기</h2>
              <ChartPreview figure={figure} />
            </div>

            <StylePanel
              title={title}
              onTitleChange={setTitle}
              xLabelMain={xLabelMain}
              onXLabelMainChange={setXLabelMain}
              xLabelSub={xLabelSub}
              onXLabelSubChange={setXLabelSub}
              showXSub={Boolean(xAxisSub)}
              yLabelMain={yLabelMain}
              onYLabelMainChange={setYLabelMain}
              yLabelSub={yLabelSub}
              onYLabelSubChange={setYLabelSub}
              showYSub={Boolean(yAxisSub)}
              gridEnabled={gridEnabled}
              onGridEnabledChange={setGridEnabled}
              gridColor={gridColor}
              onGridColorChange={setGridColor}
              legendShow={legendShow}
              onLegendShowChange={setLegendShow}
              legendPos={legendPos}
              onLegendPosChange={setLegendPos}
              displayFields={displayFields}
              seriesStyles={seriesStyles}
              onSeriesStyleChange={handleSeriesStyleChange}
              chartWidth={chartWidth}
              onChartWidthChange={setChartWidth}
              chartHeight={chartHeight}
              onChartHeightChange={setChartHeight}
            />
          </>
        )}
      </section>

      <section className="mt-6 space-y-6 lg:mt-0 lg:sticky lg:top-6 lg:self-start">
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-700">애니메이션 다운로드 옵션</p>
          <p className="text-xs text-slate-400">
            보조축·로그·반전·축교차는 미리보기에만 반영되고, 애니메이션은 주축(Main X/Y) 기준으로만
            만들어집니다. 막대그래프는 첫 번째 계열만 애니메이션됩니다.
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={transparentBackground}
              onChange={(e) => setTransparentBackground(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            배경 없음 (투명 GIF, MP4 다운로드 비활성화)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className={transparentBackground ? "text-slate-300" : undefined}>배경색</span>
            <input
              type="color"
              value={backgroundColor}
              disabled={transparentBackground}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
            />
          </label>
          <button
            type="button"
            onClick={handleGenerateAnimation}
            disabled={isLoading || columns.length === 0}
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

        <div>
          <h2 className="mb-2 text-sm font-medium text-slate-700">렌더링 결과</h2>
          <ResultPane
            gifUrl={gifUrl}
            mp4Url={mp4Url}
            pngUrl={pngUrl}
            isLoading={isLoading}
            altText="그래프 애니메이션"
            downloadName="chart"
          />
        </div>
      </section>
    </main>
  );
}
