# UniForge3D — Pinokio Launcher

A 1-click [Pinokio](https://pinokio.co) launcher (with a new Gradio web UI) for
[UniForge3D](https://github.com/xibushu/UniForge3D): *Joint 3D Reconstruction and Generation in a
Shared Anchor-Guided Space* (Chen et al., 2026).

UniForge3D turns **sparse, unposed multi-view photos** of one object into a **complete, textured 3D
asset (GLB)**. It is built on TRELLIS.2 and VGGT. Upstream ships only a batch CLI; this launcher adds
a browser GUI and a native Windows install (no WSL/Docker).

## Requirements

- Windows 10/11 x64, NVIDIA GPU (Ampere/Ada/Blackwell). 24GB+ VRAM recommended; the default
  low-VRAM mode offloads models between stages.
- ~40GB disk (venv + ~20GB model weights downloaded on first generation).
- A free Hugging Face account with access to two **gated** models:
  - [briaai/RMBG-2.0](https://huggingface.co/briaai/RMBG-2.0) — click *Agree and access repository*
  - [facebook/dinov3-vitl16-pretrain-lvd1689m](https://huggingface.co/facebook/dinov3-vitl16-pretrain-lvd1689m) — request access

## Install

1. In Pinokio, *Download from URL*: `https://github.com/hoodtronik/UniForge3D-Pinokio`
2. Click **Install**. It clones upstream into `app/`, creates a Python 3.12 venv, and installs
   torch 2.8 (CUDA 12.8) plus prebuilt Windows CUDA wheels (flash-attn, nvdiffrast, cumesh,
   flex_gemm, o_voxel) from [PozzettiAndrea/cuda-wheels](https://github.com/PozzettiAndrea/cuda-wheels).
   The install runs unattended. It does not ask for any token.
4. **Set HF Token** (the highlighted menu item after install): accept both model licenses above,
   create a READ token at https://huggingface.co/settings/tokens and paste it. It is validated
   against both gated models and stored locally (`cache/HF_HOME`), never committed.
5. **Download Models**: fetches all ~20GB of weights up front (otherwise they download on the
   first Generate). Once done, **Start** becomes the default.

## Usage

- **Start** — low-VRAM mode (upstream default). **Start (Full VRAM, faster)** keeps all models on the GPU (~40GB+).
- Click **Open Web UI**, upload 1–4+ views of the same object (the **first image is the anchor
  view**), or pick an example case, then **Generate 3D**.
- The first run downloads all weights, so it is slow. Results are previewed in the 3D viewer, offered
  as a download, and saved to `outputs/<timestamp>_seed<seed>/prediction.glb`.
- *Settings*: seed (or randomize) and sampler steps for the structure / shape / texture stages.

Menu: Set HF Token · Download Models · Start · Start (Full VRAM) · Update (pulls launcher + upstream) · Reset (deletes `app/`; downloaded models in `cache/` are kept).

## API

The Gradio app exposes the `/generate` endpoint. Inputs: `files` (list of images), `seed`,
`randomize`, `ss_steps`, `shape_steps`, `tex_steps`. Outputs: `[model_glb, download_glb, seed_used]`.
Replace the URL with the one shown in Pinokio.

### Python

```python
from gradio_client import Client, handle_file

client = Client("http://127.0.0.1:7860/")
model, glb, seed = client.predict(
    files=[handle_file("view1.png"), handle_file("view2.png"), handle_file("view3.png")],
    seed=42, randomize=False, ss_steps=12, shape_steps=20, tex_steps=20,
    api_name="/generate",
)
print(glb)  # local path to the downloaded .glb
```

### JavaScript

```javascript
import { Client, handle_file } from "@gradio/client";

const client = await Client.connect("http://127.0.0.1:7860/");
const result = await client.predict("/generate", {
  files: [handle_file(await (await fetch("view1.png")).blob())],
  seed: 42, randomize: false, ss_steps: 12, shape_steps: 20, tex_steps: 20,
});
console.log(result.data);
```

### Curl

```bash
# 1) upload the views
curl -s -F "files=@view1.png" -F "files=@view2.png" http://127.0.0.1:7860/gradio_api/upload
# -> ["C:\\...\\view1.png", "C:\\...\\view2.png"]

# 2) queue the job with the returned paths
curl -s -X POST http://127.0.0.1:7860/gradio_api/call/generate -H "Content-Type: application/json" \
  -d '{"data":[[{"path":"<path1>","meta":{"_type":"gradio.FileData"}},{"path":"<path2>","meta":{"_type":"gradio.FileData"}}],42,false,12,20,20]}'
# -> {"event_id":"<id>"}

# 3) stream the result
curl -s -N http://127.0.0.1:7860/gradio_api/call/generate/<id>
```

### Batch CLI (upstream)

The upstream batch script works too: put one folder of views per object under `app/assets/`, then run
`python infer.py` inside `app/` with the venv active (outputs go to `app/outputs/`).

## License

Launcher scripts: MIT. UniForge3D source is MIT; **model weights are not**: the VGGT-derived
checkpoints are CC BY-NC 4.0 and RMBG-2.0 needs separate authorization for commercial use. See the
[upstream README](https://github.com/xibushu/UniForge3D#license).
