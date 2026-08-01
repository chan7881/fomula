import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function generateAnimation(
  latex,
  {
    transparentBackground = false,
    backgroundColor = "#000000",
    textColor = "#FFFFFF",
    fontSize = 48,
  } = {},
) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/generate`,
      {
        latex,
        transparent_background: transparentBackground,
        background_color: backgroundColor,
        text_color: textColor,
        font_size: fontSize,
      },
      { timeout: 90_000 },
    );
    const { gif_url, mp4_url, png_url } = response.data;
    return {
      gifUrl: `${API_BASE_URL}${gif_url}`,
      mp4Url: mp4_url ? `${API_BASE_URL}${mp4_url}` : null,
      pngUrl: png_url ? `${API_BASE_URL}${png_url}` : null,
    };
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function generateChart({
  chartType,
  series,
  title = "",
  xLabel = "",
  yLabel = "",
  xLog = false,
  yLog = false,
  showGrid = true,
  showLegend = true,
  transparentBackground = false,
  backgroundColor = "#FFFFFF",
  width = 1280,
  height = 720,
}) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/generate-chart`,
      {
        chart_type: chartType,
        series: series.map((s) => ({
          name: s.name,
          x: s.x,
          y: s.y,
          color: s.color,
          show_line: s.show_line,
          show_marker: s.show_marker,
        })),
        title,
        x_label: xLabel,
        y_label: yLabel,
        x_log: xLog,
        y_log: yLog,
        show_grid: showGrid,
        show_legend: showLegend,
        transparent_background: transparentBackground,
        background_color: backgroundColor,
        width,
        height,
      },
      { timeout: 90_000 },
    );
    const { gif_url, mp4_url, png_url } = response.data;
    return {
      gifUrl: `${API_BASE_URL}${gif_url}`,
      mp4Url: mp4_url ? `${API_BASE_URL}${mp4_url}` : null,
      pngUrl: png_url ? `${API_BASE_URL}${png_url}` : null,
    };
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

function extractErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (detail) return detail;
  if (error.code === "ECONNABORTED") {
    return "렌더링 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
  }
  if (error.code === "ERR_NETWORK") {
    return "백엔드 서버(localhost:8000)에 연결할 수 없습니다. run.bat의 Backend 창이 열려 있는지, 5173/8000 포트가 다른 프로그램에 점유되지 않았는지 확인해주세요.";
  }
  return error.message || "알 수 없는 오류가 발생했습니다.";
}
