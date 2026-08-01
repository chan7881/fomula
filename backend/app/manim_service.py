"""Dynamically generate Manim scenes (equations or charts), render them to a
trimmed GIF (+ MP4 derived from it), and reclaim job folders after a TTL.

Rendered files live at TEMP_ROOT/<job_id>/output.{gif,mp4} so a single
generate call can be downloaded as either format afterwards, instead of
re-rendering per format.
"""

import math
import re
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path

from PIL import Image, ImageChops, ImageSequence

# Deliberately kept outside the backend/app source tree: uvicorn --reload
# watches that tree, and every dynamically-written scene.py used to trigger
# a reload mid-render, killing the in-flight request.
TEMP_ROOT = Path(tempfile.gettempdir()) / "math_animator_jobs"
SCENE_NAME = "GeneratedScene"
RENDER_TIMEOUT_SECONDS = 60
FFMPEG_TIMEOUT_SECONDS = 30
MAX_LATEX_LENGTH = 500
JOB_TTL_SECONDS = 600
JOB_ID_PATTERN = re.compile(r"^[0-9a-f]{12}$")

# Pixels of breathing room left around the content's bounding box when
# trimming, at the baseline render resolution (scaled with resolution).
TRIM_PADDING = 30
# Below this per-pixel difference (out of 255), a pixel counts as "background"
# rather than "content" — GIF palette quantization dithers solid backgrounds
# by a few values even when nothing is drawn there.
TRIM_DIFF_THRESHOLD = 24

# "font_size" doubles as the output-resolution control for equations:
# MathTex's font_size only changes how large the equation is drawn *within*
# Manim's coordinate space, so without this a bigger font just fills more of
# the same 1280x720 canvas — after trimming, the cropped GIF ends up roughly
# the same pixel size regardless of font_size. Scaling the render resolution
# together with font_size makes "bigger font" actually mean "bigger,
# higher-resolution output image", which is what users expect.
BASE_FONT_SIZE = 48
BASE_WIDTH = 1280
BASE_HEIGHT = 720
MIN_RENDER_SCALE = 0.4
MAX_RENDER_SCALE = 3.0

CHART_AXIS_COLOR = "#1E293B"
MAX_CHART_SERIES = 8
MAX_CHART_POINTS = 500


class ManimRenderError(Exception):
    """Raised when the Manim/ffmpeg subprocess fails (e.g. invalid input)."""


class ManimTimeoutError(ManimRenderError):
    """Raised when rendering exceeds RENDER_TIMEOUT_SECONDS."""


def _render_settings_for_font_size(font_size: int) -> tuple[int, int, int]:
    """Returns (pixel_width, pixel_height, trim_padding) scaled from font_size."""
    scale = max(MIN_RENDER_SCALE, min(font_size / BASE_FONT_SIZE, MAX_RENDER_SCALE))
    width = round(BASE_WIDTH * scale / 2) * 2
    height = round(BASE_HEIGHT * scale / 2) * 2
    padding = max(12, round(TRIM_PADDING * scale))
    return width, height, padding


def _build_scene_source(
    latex: str,
    transparent_background: bool,
    background_color: str,
    text_color: str,
    font_size: int,
) -> str:
    # repr() turns each user-controlled string into a Python string *literal*,
    # so it can never break out of the quotes or inject code — safer than
    # f-string interpolation into a hand-written r"""...""" block.
    lines = ["from manim import *", "", "", f"class {SCENE_NAME}(Scene):", "    def construct(self):"]
    if not transparent_background:
        lines.append(f"        self.camera.background_color = {background_color!r}")
    lines.append(f"        eq = MathTex({latex!r}, color={text_color!r}, font_size={font_size!r})")
    lines.append("        self.play(Write(eq))")
    lines.append("        self.wait(1)")
    return "\n".join(lines) + "\n"


def _nice_padded_range(data_min: float, data_max: float, use_log: bool) -> tuple[float, float, float]:
    """Returns (range_min, range_max, step) for a Manim Axes x_range/y_range.

    For log axes these are *exponents* (Manim's LogBase expects the Axes
    range itself in exponent-space, e.g. [-2, 4] means 10**-2 .. 10**4;
    the actual plotted x/y values passed to plot_line_graph stay real-valued).
    """
    if use_log:
        if data_min <= 0:
            raise ManimRenderError("로그 스케일은 0 이하의 값을 표시할 수 없습니다.")
        lo = math.floor(math.log10(data_min))
        hi = math.ceil(math.log10(data_max))
        if lo == hi:
            hi += 1
        return float(lo), float(hi), 1.0

    if data_min == data_max:
        data_min, data_max = data_min - 1, data_max + 1
    pad = (data_max - data_min) * 0.1
    lo, hi = round(data_min - pad, 3), round(data_max + pad, 3)
    step = round((hi - lo) / 5, 3) or 1.0
    return lo, hi, step


def _build_chart_scene_source(
    chart_type: str,
    series: list[dict],
    title: str,
    x_label: str,
    y_label: str,
    x_log: bool,
    y_log: bool,
    show_grid: bool,
    show_legend: bool,
    transparent_background: bool,
    background_color: str,
) -> str:
    lines = ["from manim import *", "", "", f"class {SCENE_NAME}(Scene):", "    def construct(self):"]
    if not transparent_background:
        lines.append(f"        self.camera.background_color = {background_color!r}")

    if chart_type == "bar":
        first = series[0]
        bar_names = [str(v) for v in first["x"]]
        values = [float(v) for v in first["y"]]
        y_lo, y_hi, y_step = _nice_padded_range(min(0, min(values)), max(0, max(values)), False)
        lines.append(
            "        chart = BarChart("
            f"values={values!r}, bar_names={bar_names!r}, "
            f"y_range=[{y_lo!r}, {y_hi!r}, {y_step!r}], "
            f"bar_colors=[{first['color']!r}], x_length=10, y_length=5.5, "
            f"x_axis_config={{'label_constructor': Text, 'font_size': 24, 'color': {CHART_AXIS_COLOR!r}}}, "
            f"y_axis_config={{'color': {CHART_AXIS_COLOR!r}}}, "
            f"axis_config={{'color': {CHART_AXIS_COLOR!r}}})"
        )
        # Bar/tick number labels default to Manim's white mobject color, which
        # is invisible against a light background — recolor them explicitly.
        lines.append(f"        chart.y_axis.numbers.set_color({CHART_AXIS_COLOR!r})")
        lines.append(f"        chart.x_axis.labels.set_color({CHART_AXIS_COLOR!r})")
        lines.append("        self.play(Create(chart), run_time=1.5)")
        content_lines = ["chart"]
        legend_series = []  # single-series bar chart: a legend would be redundant
    else:
        all_x = [float(v) for s in series for v in s["x"]]
        all_y = [float(v) for s in series for v in s["y"]]
        x_lo, x_hi, x_step = _nice_padded_range(min(all_x), max(all_x), x_log)
        y_lo, y_hi, y_step = _nice_padded_range(min(all_y), max(all_y), y_log)
        x_axis_cfg = "{'scaling': LogBase(10)}" if x_log else "{}"
        y_axis_cfg = "{'scaling': LogBase(10)}" if y_log else "{}"
        lines.append(
            "        axes = Axes("
            f"x_range=[{x_lo!r}, {x_hi!r}, {x_step!r}], "
            f"y_range=[{y_lo!r}, {y_hi!r}, {y_step!r}], "
            f"x_length=10, y_length=5.5, tips=False, "
            f"x_axis_config={x_axis_cfg}, y_axis_config={y_axis_cfg}, "
            f"axis_config={{'color': {CHART_AXIS_COLOR!r}, 'font_size': 20}})"
        )
        lines.append("        axes.add_coordinates()")
        # Tick labels default to Manim's white mobject color, invisible
        # against a light background — recolor them explicitly. Linear axes
        # expose the labels via `.numbers`, log axes (custom_labels) via
        # `.labels`, so cover both rather than guessing which applies.
        lines.append(
            "        for _axis in (axes.x_axis, axes.y_axis):\n"
            f"            if hasattr(_axis, 'numbers'): _axis.numbers.set_color({CHART_AXIS_COLOR!r})\n"
            f"            if hasattr(_axis, 'labels'): _axis.labels.set_color({CHART_AXIS_COLOR!r})"
        )
        lines.append("        self.play(Create(axes), run_time=1)")
        content_lines = ["axes"]
        for i, s in enumerate(series):
            var = f"graph_{i}"
            x_vals = [float(v) for v in s["x"]]
            y_vals = [float(v) for v in s["y"]]
            stroke_width = 3 if s["show_line"] else 0
            lines.append(
                f"        {var} = axes.plot_line_graph("
                f"x_values={x_vals!r}, y_values={y_vals!r}, "
                f"line_color={s['color']!r}, add_vertex_dots={bool(s['show_marker'])!r}, "
                f"stroke_width={stroke_width!r}, vertex_dot_radius=0.06)"
            )
            lines.append(f"        self.play(Create({var}), run_time=1.2)")
            content_lines.append(var)
        legend_series = series

    if not (chart_type == "bar"):
        x_axis_label_var = None
        if x_label or y_label:
            lines.append(
                f"        labels = axes.get_axis_labels(x_label=Text({x_label!r}, font_size=28, color={CHART_AXIS_COLOR!r}), "
                f"y_label=Text({y_label!r}, font_size=28, color={CHART_AXIS_COLOR!r}))"
            )
            lines.append("        self.play(FadeIn(labels), run_time=0.5)")

        # Grid lines are placed via axes.c2p(), which expects real data
        # values — but axes.x_range/y_range are in *exponent* space for a
        # LogBase axis, so a direct read-and-plot would hand c2p exponents
        # and crash on log(0). Skipping the grid on log axes avoids that
        # conversion entirely rather than special-casing it for a cosmetic
        # extra.
        if show_grid and not x_log and not y_log:
            lines.append(
                "        grid_lines = VGroup(*["
                "Line(axes.c2p(x, axes.y_range[0]), axes.c2p(x, axes.y_range[1]), "
                f"stroke_color={CHART_AXIS_COLOR!r}, stroke_opacity=0.15, stroke_width=1) "
                "for x in np.arange(axes.x_range[0], axes.x_range[1] + 1e-9, axes.x_range[2])] + ["
                "Line(axes.c2p(axes.x_range[0], y), axes.c2p(axes.x_range[1], y), "
                f"stroke_color={CHART_AXIS_COLOR!r}, stroke_opacity=0.15, stroke_width=1) "
                "for y in np.arange(axes.y_range[0], axes.y_range[1] + 1e-9, axes.y_range[2])])"
            )
            lines.append("        self.add(grid_lines)")
            lines.append("        grid_lines.set_z_index(-1)")

    if title:
        lines.append(f"        title_text = Text({title!r}, font_size=32, color={CHART_AXIS_COLOR!r}).to_edge(UP)")
        lines.append("        self.play(FadeIn(title_text), run_time=0.5)")

    if show_legend and len(legend_series) > 1:
        lines.append("        legend_items = VGroup()")
        for s in legend_series:
            lines.append(
                f"        swatch = Line(ORIGIN, RIGHT * 0.4, stroke_color={s['color']!r}, stroke_width=4)"
            )
            lines.append(f"        label = Text({s['name']!r}, font_size=20, color={CHART_AXIS_COLOR!r})")
            lines.append("        label.next_to(swatch, RIGHT, buff=0.15)")
            lines.append("        legend_items.add(VGroup(swatch, label))")
        lines.append("        legend_items.arrange(DOWN, aligned_edge=LEFT, buff=0.15)")
        lines.append("        legend_items.to_corner(UR, buff=0.3)")
        lines.append("        self.play(FadeIn(legend_items), run_time=0.5)")

    lines.append("        self.wait(1)")
    return "\n".join(lines) + "\n"


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _trim_gif(
    gif_path: Path, transparent_background: bool, background_color: str, padding: int
) -> None:
    """Crop every frame of the GIF at gif_path to the union bounding box of
    the drawn content across all frames, so the output isn't mostly empty canvas."""
    im = Image.open(gif_path)
    frames = []
    durations = []
    for frame in ImageSequence.Iterator(im):
        frames.append(frame.convert("RGBA"))
        durations.append(frame.info.get("duration", 50))

    union_box = None
    bg_rgb = None if transparent_background else _hex_to_rgb(background_color)
    for frame in frames:
        if transparent_background:
            bbox = frame.split()[3].point(lambda a: 255 if a > 16 else 0).getbbox()
        else:
            bg_img = Image.new("RGB", frame.size, bg_rgb)
            diff = ImageChops.difference(frame.convert("RGB"), bg_img)
            mask = diff.convert("L").point(lambda p: 255 if p > TRIM_DIFF_THRESHOLD else 0)
            bbox = mask.getbbox()
        if bbox is None:
            continue
        union_box = bbox if union_box is None else (
            min(union_box[0], bbox[0]),
            min(union_box[1], bbox[1]),
            max(union_box[2], bbox[2]),
            max(union_box[3], bbox[3]),
        )

    if union_box is None:
        return  # nothing detected as "content" (e.g. blank scene) — leave as-is

    width, height = frames[0].size
    left = max(union_box[0] - padding, 0)
    top = max(union_box[1] - padding, 0)
    right = min(union_box[2] + padding, width)
    bottom = min(union_box[3] + padding, height)

    cropped = [frame.crop((left, top, right, bottom)) for frame in frames]
    if not transparent_background:
        cropped = [frame.convert("RGB") for frame in cropped]

    cropped[0].save(
        gif_path,
        save_all=True,
        append_images=cropped[1:],
        duration=durations,
        loop=im.info.get("loop", 0),
        disposal=2,
        optimize=True,
    )


def _convert_gif_to_mp4(gif_path: Path, mp4_path: Path) -> None:
    # GIF's 256-color palette is a non-issue here (flat-colored content), so
    # converting the already-trimmed GIF is far simpler than re-rendering +
    # re-cropping a second time in Manim for MP4.
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(gif_path),
        "-movflags",
        "faststart",
        "-pix_fmt",
        "yuv420p",
        "-vf",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-r",
        "30",
        str(mp4_path),
    ]
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=FFMPEG_TIMEOUT_SECONDS
        )
    except subprocess.TimeoutExpired:
        raise ManimRenderError("MP4 conversion timed out.")

    if result.returncode != 0 or not mp4_path.is_file():
        detail = (result.stderr or "Unknown ffmpeg error.")[-2000:]
        raise ManimRenderError(f"MP4 conversion failed: {detail}")


def purge_stale_jobs(ttl_seconds: int = JOB_TTL_SECONDS) -> None:
    if not TEMP_ROOT.exists():
        return
    now = time.time()
    for entry in TEMP_ROOT.iterdir():
        if entry.is_dir() and now - entry.stat().st_mtime > ttl_seconds:
            shutil.rmtree(entry, ignore_errors=True)


def get_job_file(job_id: str, fmt: str) -> Path | None:
    """Resolves job_id/fmt to an existing output file, or None. Validates
    job_id strictly (our own uuid4().hex[:12] shape) to rule out path
    traversal before it ever touches the filesystem."""
    if not JOB_ID_PATTERN.fullmatch(job_id) or fmt not in ("gif", "mp4", "png"):
        return None
    path = TEMP_ROOT / job_id / f"output.{fmt}"
    return path if path.is_file() else None


def _extract_last_frame_png(gif_path: Path, png_path: Path) -> None:
    # Reads from the already-trimmed GIF so the PNG matches its pixel
    # dimensions exactly; RGBA preserves real alpha for transparent renders,
    # unlike the GIF's own binary transparency.
    im = Image.open(gif_path)
    im.seek(im.n_frames - 1)
    im.convert("RGBA").save(png_path)


def _render_scene(
    scene_source: str,
    transparent_background: bool,
    background_color: str,
    width: int,
    height: int,
    trim_padding: int,
) -> str:
    """Writes scene_source to a fresh job dir, renders it with Manim, trims
    the GIF, converts it to MP4 (unless transparent), and returns job_id.
    """
    purge_stale_jobs()

    TEMP_ROOT.mkdir(parents=True, exist_ok=True)
    job_id = uuid.uuid4().hex[:12]
    job_dir = TEMP_ROOT / job_id
    job_dir.mkdir(parents=True)

    try:
        script_path = job_dir / "scene.py"
        media_dir = job_dir / "media"
        script_path.write_text(scene_source, encoding="utf-8")

        cmd = [
            sys.executable,
            "-m",
            "manim",
            str(script_path),
            SCENE_NAME,
            "-r",
            f"{width},{height}",
            "--fps",
            "30",
            "--format",
            "gif",
            # Without -o, Manim names the file "<Scene>_ManimCE_v<version>.gif",
            # which breaks any fixed glob pattern across Manim version upgrades.
            "-o",
            "output",
            "--media_dir",
            str(media_dir),
            "--disable_caching",
        ]
        if transparent_background:
            cmd.append("-t")

        try:
            result = subprocess.run(
                cmd,
                cwd=job_dir,
                capture_output=True,
                text=True,
                timeout=RENDER_TIMEOUT_SECONDS,
            )
        except subprocess.TimeoutExpired:
            raise ManimTimeoutError(f"Rendering timed out after {RENDER_TIMEOUT_SECONDS}s.")

        if result.returncode != 0:
            detail = (result.stderr or result.stdout or "Unknown Manim error.")[-2000:]
            raise ManimRenderError(detail)

        gif_matches = list(media_dir.rglob("output.gif"))
        if not gif_matches:
            raise ManimRenderError("Manim finished but no GIF file was produced.")

        _trim_gif(gif_matches[0], transparent_background, background_color, trim_padding)

        final_gif_path = job_dir / "output.gif"
        shutil.move(str(gif_matches[0]), final_gif_path)
        shutil.rmtree(media_dir, ignore_errors=True)

        _extract_last_frame_png(final_gif_path, job_dir / "output.png")

        if not transparent_background:
            _convert_gif_to_mp4(final_gif_path, job_dir / "output.mp4")

        return job_id
    except Exception:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise


def render_latex(
    latex: str,
    transparent_background: bool = False,
    background_color: str = "#000000",
    text_color: str = "#FFFFFF",
    font_size: int = 48,
) -> str:
    """Renders `latex` to TEMP_ROOT/<job_id>/output.gif, plus output.mp4
    unless the background is transparent (MP4/h264 has no alpha channel).
    """
    latex = latex.strip()
    if not latex:
        raise ManimRenderError("LaTeX string is empty.")
    if len(latex) > MAX_LATEX_LENGTH:
        raise ManimRenderError(f"LaTeX string exceeds {MAX_LATEX_LENGTH} characters.")

    scene_source = _build_scene_source(latex, transparent_background, background_color, text_color, font_size)
    width, height, trim_padding = _render_settings_for_font_size(font_size)
    return _render_scene(scene_source, transparent_background, background_color, width, height, trim_padding)


def render_chart(
    chart_type: str,
    series: list[dict],
    title: str = "",
    x_label: str = "",
    y_label: str = "",
    x_log: bool = False,
    y_log: bool = False,
    show_grid: bool = True,
    show_legend: bool = True,
    transparent_background: bool = False,
    background_color: str = "#FFFFFF",
    width: int = 1280,
    height: int = 720,
) -> str:
    """Renders a chart (line/scatter or bar) built from `series` to
    TEMP_ROOT/<job_id>/output.gif [+ output.mp4]. See _build_chart_scene_source
    for exactly what each chart_type supports.
    """
    if not series:
        raise ManimRenderError("차트를 그리려면 최소 1개의 계열이 필요합니다.")
    if len(series) > MAX_CHART_SERIES:
        raise ManimRenderError(f"계열은 최대 {MAX_CHART_SERIES}개까지 지원합니다.")
    for s in series:
        if len(s["x"]) != len(s["y"]):
            raise ManimRenderError(f"'{s['name']}' 계열의 X/Y 데이터 개수가 일치하지 않습니다.")
        if len(s["x"]) == 0:
            raise ManimRenderError(f"'{s['name']}' 계열에 데이터가 없습니다.")
        if len(s["x"]) > MAX_CHART_POINTS:
            raise ManimRenderError(f"계열당 데이터는 최대 {MAX_CHART_POINTS}개까지 지원합니다.")

    if chart_type == "line_scatter":
        for s in series:
            try:
                [float(v) for v in s["x"]]
            except (TypeError, ValueError):
                raise ManimRenderError(
                    f"Line/Scatter 차트는 X축이 숫자형이어야 합니다 ('{s['name']}' 계열 확인 필요)."
                )

    scene_source = _build_chart_scene_source(
        chart_type, series, title, x_label, y_label, x_log, y_log,
        show_grid, show_legend, transparent_background, background_color,
    )
    width = max(200, min(width, 2560))
    height = max(200, min(height, 2560))
    width -= width % 2
    height -= height % 2
    return _render_scene(scene_source, transparent_background, background_color, width, height, TRIM_PADDING)
