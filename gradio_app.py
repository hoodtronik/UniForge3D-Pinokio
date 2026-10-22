# CLAUDE-NOTE: Gradio GUI for UniForge3D. Upstream ships only a batch CLI (infer.py) with
# no UI, so this launcher-owned file wraps the same public API
# (UniForge3DImageTo3DPipeline.from_pretrained(...).run(images, out, seed=...)) without
# modifying app/. start.js runs it with cwd=app/; we add app/ to sys.path explicitly
# because Python puts the *script's* folder (launcher root) on sys.path, not the cwd.
import argparse
import random
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app"
OUTPUTS = ROOT / "outputs"
sys.path.insert(0, str(APP))

import gradio as gr  # noqa: E402

IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}
MAX_SEED = 2**31 - 1

parser = argparse.ArgumentParser()
parser.add_argument("--model", default="xibushu/UniForge3D")
parser.add_argument("--full-vram", action="store_true",
                    help="Keep all models on the GPU (faster, needs ~40GB+ VRAM).")
cli = parser.parse_args()

_pipeline = None
_lock = threading.Lock()


def get_pipeline():
    # CLAUDE-NOTE: lazy-load so the UI comes up immediately; the first Generate downloads
    # ~20GB of weights (UniForge3D + TRELLIS.2-4B + DINOv3 + RMBG-2.0) into HF_HOME.
    global _pipeline
    if _pipeline is None:
        from uniforge3d import UniForge3DImageTo3DPipeline
        _pipeline = UniForge3DImageTo3DPipeline.from_pretrained(
            cli.model, low_vram=not cli.full_vram,
        )
    return _pipeline


def example_cases():
    assets = APP / "assets"
    if not assets.is_dir():
        return []
    return sorted(p.name for p in assets.iterdir() if p.is_dir())


def load_example(case):
    if not case:
        return gr.update()
    folder = APP / "assets" / case
    return sorted(str(p) for p in folder.iterdir() if p.suffix.lower() in IMAGE_SUFFIXES)


def preview(files):
    return [f if isinstance(f, str) else f.name for f in (files or [])]


def generate(files, seed, randomize, ss_steps, shape_steps, tex_steps,
             progress=gr.Progress(track_tqdm=True)):
    images = preview(files)
    if not images:
        raise gr.Error("Upload at least one image (2-4 views of the same object work best).")
    if randomize:
        seed = random.randint(0, MAX_SEED)
    seed = int(seed)

    with _lock:
        progress(0, desc="Loading models (first run downloads weights)...")
        try:
            pipe = get_pipeline()
        except Exception as e:
            # CLAUDE-NOTE: gated-model failures are the common first-run error for public
            # users; point them at the Pinokio menu steps instead of a raw traceback.
            if "Gated" in type(e).__name__ or "401" in str(e) or "403" in str(e):
                raise gr.Error("Hugging Face access missing. In Pinokio, run 'Set HF Token' "
                               "(accept the RMBG-2.0 and DINOv3 licenses first), then "
                               "'Download Models'.") from e
            raise
        # CLAUDE-NOTE: the pipeline reads sampler params from self.config on every run,
        # so per-request step overrides are applied by mutating that dict in place.
        cfg = pipe.config
        cfg["sparse_structure"]["sampler"]["params"]["steps"] = int(ss_steps)
        cfg["structured_latent_512"]["sampler"]["params"]["steps"] = int(shape_steps)
        cfg["structured_latent_1024"]["sampler"]["params"]["steps"] = int(shape_steps)
        cfg["texture"]["sampler"]["params"]["steps"] = int(tex_steps)

        out_dir = OUTPUTS / f"{time.strftime('%Y%m%d-%H%M%S')}_seed{seed}"
        glb = pipe.run(images, out_dir / "prediction.glb", seed=seed, overwrite=True)
    return str(glb), str(glb), seed


with gr.Blocks(title="UniForge3D") as demo:
    gr.Markdown(
        "# UniForge3D\n"
        "Multi-view images → complete textured 3D asset (GLB). Upload 1–4+ photos of the "
        "**same object** from different angles (unposed is fine). The **first image is the "
        "anchor view**. Backgrounds are removed automatically."
    )
    with gr.Row():
        with gr.Column(scale=1):
            files = gr.File(label="Input views", file_count="multiple",
                            file_types=["image"], type="filepath")
            gallery = gr.Gallery(label="Preview (order = view order)", columns=4,
                                 height=220, interactive=False)
            example = gr.Dropdown(choices=example_cases(), label="Load an example case",
                                  value=None)
            with gr.Accordion("Settings", open=False):
                with gr.Row():
                    seed = gr.Number(label="Seed", value=42, precision=0)
                    randomize = gr.Checkbox(label="Randomize seed", value=False)
                ss_steps = gr.Slider(1, 50, value=12, step=1, label="Structure steps")
                shape_steps = gr.Slider(1, 50, value=20, step=1, label="Shape steps")
                tex_steps = gr.Slider(1, 50, value=20, step=1, label="Texture steps")
            run = gr.Button("Generate 3D", variant="primary")
        with gr.Column(scale=1):
            model = gr.Model3D(label="Result", height=520)
            download = gr.File(label="Download GLB")

    example.change(load_example, example, files)
    files.change(preview, files, gallery)
    run.click(generate, [files, seed, randomize, ss_steps, shape_steps, tex_steps],
              [model, download, seed], api_name="generate")

if __name__ == "__main__":
    OUTPUTS.mkdir(exist_ok=True)
    demo.queue().launch(server_name="127.0.0.1", allowed_paths=[str(OUTPUTS)])
