import * as XLSX from "xlsx";

const DEFAULT_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#9333ea", "#0891b2"];
const DEFAULT_MARKERS = ["circle", "square", "triangle-up", "diamond", "cross"];

export function parseWorkbookFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
        if (!rows || rows.length === 0) {
          reject(new Error("데이터가 없습니다."));
          return;
        }
        resolve({ rows, columns: Object.keys(rows[0]) });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("파일을 읽을 수 없습니다."));
    reader.readAsArrayBuffer(file);
  });
}

export function getDefaultSeriesStyle(name, index) {
  return {
    display_name: name,
    color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    linewidth: 2,
    markersize: 8,
    marker: DEFAULT_MARKERS[index % DEFAULT_MARKERS.length],
    linestyle: "solid",
    show_line: true,
    show_marker: true,
  };
}

// Ported from chart-main's docs/app.js (btnPlot handler) — full feature set
// (sub axes, log/invert per axis, swap) for the on-screen Plotly preview.
export function buildPlotlyFigure(cfg) {
  const {
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
    xLabelMain,
    xLabelSub,
    yLabelMain,
    yLabelSub,
    gridEnabled,
    gridColor,
    legendShow,
    legendPos,
    chartWidth,
    chartHeight,
  } = cfg;

  const traces = displayFields.map((ycol, idx) => {
    const activeX = xAxisSub && idx > 0 ? xAxisSub : xAxisMain;
    let mapped = rows
      .map((row) => ({ x: row[activeX], y: row[ycol] }))
      .filter((d) => d.x !== null && d.y !== null);

    if (mapped.length > 0 && !isNaN(mapped[0].x)) {
      mapped.sort((a, b) => Number(a.x) - Number(b.x));
    }

    let finalX = mapped.map((d) => d.x);
    let finalY = mapped.map((d) => Number(d.y));
    if (isSwapped) [finalX, finalY] = [finalY, finalX];

    const sOpt = seriesStyles[ycol] || getDefaultSeriesStyle(ycol, idx);
    const trace = {
      x: finalX,
      y: finalY,
      name: sOpt.display_name,
      mode: (sOpt.show_line ? "lines" : "") + (sOpt.show_marker ? "+markers" : ""),
      line: { color: sOpt.color, width: sOpt.linewidth, dash: sOpt.linestyle },
      marker: {
        color: sOpt.color,
        size: sOpt.markersize,
        symbol: sOpt.marker,
        line: { color: "#333", width: 0.5 },
      },
      type: chartType,
    };

    if (!isSwapped) {
      if (yAxisSub && ycol === yAxisSub) trace.yaxis = "y2";
      if (xAxisSub && idx > 0) trace.xaxis = "x2";
    } else {
      if (yAxisSub && ycol === yAxisSub) trace.xaxis = "x2";
      if (xAxisSub && idx > 0) trace.yaxis = "y2";
    }
    return trace;
  });

  const visualXMainConfig = isSwapped ? axisOpts.yMain : axisOpts.xMain;
  const visualYMainConfig = isSwapped ? axisOpts.xMain : axisOpts.yMain;
  const visualXSubConfig = isSwapped ? axisOpts.ySub : axisOpts.xSub;
  const visualYSubConfig = isSwapped ? axisOpts.xSub : axisOpts.ySub;

  const layout = {
    title: { text: title || "" },
    template: "plotly_white",
    margin: { l: 80, r: 80, t: 80, b: 80 },
    showlegend: legendShow,
    legend: {
      x: legendPos.includes("left") ? 0.02 : 0.98,
      y: legendPos.includes("bottom") ? 0.02 : 0.98,
      xanchor: legendPos.includes("left") ? "left" : "right",
      yanchor: legendPos.includes("bottom") ? "bottom" : "top",
      bordercolor: "#ccc",
      borderwidth: 1,
    },
    xaxis: {
      title: { text: isSwapped ? yLabelMain : xLabelMain, font: { weight: "bold" } },
      showline: true,
      mirror: true,
      linewidth: 2,
      linecolor: "#333",
      showgrid: gridEnabled,
      zeroline: gridEnabled,
      gridcolor: gridColor,
      type: visualXMainConfig.log ? "log" : "-",
      autorange: visualXMainConfig.inv ? "reversed" : true,
    },
    yaxis: {
      title: { text: isSwapped ? xLabelMain : yLabelMain, font: { weight: "bold" } },
      showline: true,
      mirror: true,
      linewidth: 2,
      linecolor: "#333",
      showgrid: gridEnabled,
      zeroline: gridEnabled,
      gridcolor: gridColor,
      type: visualYMainConfig.log ? "log" : "-",
      autorange: visualYMainConfig.inv ? "reversed" : true,
    },
  };

  if (!isSwapped) {
    if (yAxisSub) {
      layout.yaxis2 = {
        title: { text: yLabelSub, font: { weight: "bold" } },
        overlaying: "y",
        side: "right",
        showline: true,
        linecolor: "#333",
        linewidth: 2,
        showgrid: false,
        zeroline: false,
        type: visualYSubConfig.log ? "log" : "-",
        autorange: visualYSubConfig.inv ? "reversed" : true,
      };
    }
    if (xAxisSub) {
      layout.xaxis2 = {
        title: { text: xLabelSub, font: { weight: "bold" } },
        overlaying: "x",
        side: "top",
        showline: true,
        linecolor: "#333",
        linewidth: 2,
        showgrid: false,
        zeroline: false,
        type: visualXSubConfig.log ? "log" : "-",
        autorange: visualXSubConfig.inv ? "reversed" : true,
      };
    }
  } else {
    if (yAxisSub) {
      layout.xaxis2 = {
        title: { text: yLabelSub, font: { weight: "bold" } },
        overlaying: "x",
        side: "top",
        showline: true,
        linecolor: "#333",
        linewidth: 2,
        showgrid: false,
        zeroline: false,
        type: visualXSubConfig.log ? "log" : "-",
        autorange: visualXSubConfig.inv ? "reversed" : true,
      };
    }
    if (xAxisSub) {
      layout.yaxis2 = {
        title: { text: xLabelSub, font: { weight: "bold" } },
        overlaying: "y",
        side: "right",
        showline: true,
        linecolor: "#333",
        linewidth: 2,
        showgrid: false,
        zeroline: false,
        type: visualYSubConfig.log ? "log" : "-",
        autorange: visualYSubConfig.inv ? "reversed" : true,
      };
    }
  }

  if (chartWidth) layout.width = Number(chartWidth);
  if (chartHeight) layout.height = Number(chartHeight);

  return { data: traces, layout };
}

// Main-axis-only series for the Manim export request — sub axes, log,
// invert and swap are preview-only (see plan: Manim has no dual-axis
// concept, and half-implementing invert/swap would just look broken).
export function buildExportSeries(cfg) {
  const { rows, xAxisMain, displayFields, seriesStyles, chartType } = cfg;
  return displayFields.map((ycol, idx) => {
    const mapped = rows
      .map((row) => ({ x: row[xAxisMain], y: row[ycol] }))
      .filter((d) => d.x !== null && d.y !== null);
    if (mapped.length > 0 && !isNaN(mapped[0].x)) {
      mapped.sort((a, b) => Number(a.x) - Number(b.x));
    }
    const sOpt = seriesStyles[ycol] || getDefaultSeriesStyle(ycol, idx);
    return {
      name: sOpt.display_name,
      x: chartType === "bar" ? mapped.map((d) => String(d.x)) : mapped.map((d) => Number(d.x)),
      y: mapped.map((d) => Number(d.y)),
      color: sOpt.color,
      show_line: sOpt.show_line,
      show_marker: sOpt.show_marker,
    };
  });
}
