from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.manim_service import (
    ManimRenderError,
    ManimTimeoutError,
    get_job_file,
    render_chart,
    render_latex,
)

app = FastAPI(title="Math Animation Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


HEX_COLOR_PATTERN = r"^#[0-9A-Fa-f]{6}$"


class LatexRequest(BaseModel):
    latex: str = Field(..., min_length=1, max_length=500)
    transparent_background: bool = False
    background_color: str = Field(default="#000000", pattern=HEX_COLOR_PATTERN)
    text_color: str = Field(default="#FFFFFF", pattern=HEX_COLOR_PATTERN)
    font_size: int = Field(default=48, ge=8, le=200)


DOWNLOAD_MEDIA_TYPES = {"gif": "image/gif", "mp4": "video/mp4", "png": "image/png"}


class GenerateResponse(BaseModel):
    job_id: str
    gif_url: str
    mp4_url: str | None = None
    png_url: str | None = None


def _build_generate_response(job_id: str) -> GenerateResponse:
    has_mp4 = get_job_file(job_id, "mp4") is not None
    has_png = get_job_file(job_id, "png") is not None
    return GenerateResponse(
        job_id=job_id,
        gif_url=f"/download/{job_id}/gif",
        mp4_url=f"/download/{job_id}/mp4" if has_mp4 else None,
        png_url=f"/download/{job_id}/png" if has_png else None,
    )


@app.post("/generate", response_model=GenerateResponse)
def generate_animation(request: LatexRequest):
    try:
        job_id = render_latex(
            request.latex,
            transparent_background=request.transparent_background,
            background_color=request.background_color,
            text_color=request.text_color,
            font_size=request.font_size,
        )
    except ManimTimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc))
    except ManimRenderError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return _build_generate_response(job_id)


class ChartSeries(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    x: list[float | str]
    y: list[float]
    color: str = Field(pattern=HEX_COLOR_PATTERN)
    show_line: bool = True
    show_marker: bool = True


class ChartRequest(BaseModel):
    chart_type: Literal["line_scatter", "bar"]
    title: str = Field("", max_length=200)
    x_label: str = Field("", max_length=100)
    y_label: str = Field("", max_length=100)
    x_log: bool = False
    y_log: bool = False
    show_grid: bool = True
    show_legend: bool = True
    transparent_background: bool = False
    background_color: str = Field(default="#FFFFFF", pattern=HEX_COLOR_PATTERN)
    width: int = Field(default=1280, ge=200, le=2560)
    height: int = Field(default=720, ge=200, le=2560)
    series: list[ChartSeries] = Field(..., min_length=1, max_length=8)


@app.post("/generate-chart", response_model=GenerateResponse)
def generate_chart_animation(request: ChartRequest):
    try:
        job_id = render_chart(
            request.chart_type,
            [s.model_dump() for s in request.series],
            title=request.title,
            x_label=request.x_label,
            y_label=request.y_label,
            x_log=request.x_log,
            y_log=request.y_log,
            show_grid=request.show_grid,
            show_legend=request.show_legend,
            transparent_background=request.transparent_background,
            background_color=request.background_color,
            width=request.width,
            height=request.height,
        )
    except ManimTimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc))
    except ManimRenderError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return _build_generate_response(job_id)


@app.get("/download/{job_id}/{fmt}")
def download_animation(job_id: str, fmt: str):
    path = get_job_file(job_id, fmt)
    if path is None:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다. 다시 생성해주세요.")
    media_type = DOWNLOAD_MEDIA_TYPES.get(fmt, "application/octet-stream")
    return FileResponse(path=path, media_type=media_type, filename=f"output.{fmt}")


@app.get("/health")
def health_check():
    return {"status": "ok"}
