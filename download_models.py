# CLAUDE-NOTE: Pre-downloads every weight UniForge3D loads, so the first Generate doesn't
# stall on ~20GB of downloads. It mirrors UniForge3DImageTo3DPipeline.from_pretrained /
# from_config exactly (same repos, pinned revisions and resolve_checkpoint helper) so the
# files land in the same HF cache entries the pipeline later reads, but it never builds
# the models (no GPU/RAM cost). Run with cwd=app/ (see download_models.js).
# Prints MODELS_OK (and writes the marker pinokio.js checks) or MODELS_GATED / MODELS_FAIL.
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "app"))
MARKER = ROOT / "cache" / "UNIFORGE3D_MODELS_OK"

from huggingface_hub import snapshot_download  # noqa: E402
from huggingface_hub.errors import GatedRepoError  # noqa: E402

MODEL = "xibushu/UniForge3D"


def main():
    from uniforge3d.models.loaders import resolve_checkpoint

    print(f"Downloading {MODEL} ...", flush=True)
    root = Path(snapshot_download(MODEL, allow_patterns=["pipeline.json", "uniforge3d/**/*.pt"]))
    config = json.loads((root / "pipeline.json").read_text(encoding="utf-8"))

    # Same traversal as from_config(): every stage checkpoint, decoder and the conditioner.
    for stage in ("sparse_structure", "structured_latent_512", "structured_latent_1024", "texture"):
        weights = config[stage]["weights"]
        for key in ("checkpoint", "adapter_checkpoint", "dit_base", "vggt_base", "base_checkpoint"):
            if key in weights and isinstance(weights[key], dict):
                print(f"Downloading {stage}.{key} ...", flush=True)
                resolve_checkpoint(weights[key], root)
        if "decoder" in config[stage]:
            print(f"Downloading {stage} decoder ...", flush=True)
            resolve_checkpoint(config[stage]["decoder"]["checkpoint"], root, decoder=True)
    for key in ("shape_decoder_checkpoint", "texture_decoder_checkpoint"):
        print(f"Downloading texture.{key} ...", flush=True)
        resolve_checkpoint(config["texture"][key], root, decoder=True)

    # Gated external models, loaded via transformers.from_pretrained by the pipeline.
    for repo in (config["external_models"]["dino"], config["image_preprocess"]["rembg_model"]):
        print(f"Downloading {repo} ...", flush=True)
        snapshot_download(repo, allow_patterns=["*.json", "*.py", "*.safetensors", "*.txt"])

    MARKER.parent.mkdir(parents=True, exist_ok=True)
    MARKER.write_text("ok", encoding="utf-8")
    print("MODELS_OK all UniForge3D weights downloaded", flush=True)


try:
    main()
except GatedRepoError as e:
    print("MODELS_GATED", repr(e)[:200], flush=True)
except Exception as e:
    print("MODELS_FAIL", repr(e)[:300], flush=True)
