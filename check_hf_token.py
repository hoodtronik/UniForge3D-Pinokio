# CLAUDE-NOTE: Validates a Hugging Face token against the two GATED models UniForge3D
# loads: briaai/RMBG-2.0 (background removal) and facebook/dinov3-vitl16-pretrain-lvd1689m
# (image encoder). Reads the token from HF_TEST_TOKEN (set by hf_token.js) and prints a
# marker that hf_token.js's `on` matcher keys off of:
#   HFGATE_OK   -> token valid AND both licenses accepted (token is then persisted)
#   HFGATE_BAD  -> missing/invalid token, or a license has not been accepted
# Lives in its own file (not inline python -c) so the markers only appear in program
# OUTPUT, never in the echoed command line (which the matcher also scans).
import os

GATED = ["briaai/RMBG-2.0", "facebook/dinov3-vitl16-pretrain-lvd1689m"]

token = (os.environ.get("HF_TEST_TOKEN") or "").strip()
if not token:
    print("HFGATE_BAD no token provided")
    raise SystemExit(0)

try:
    from huggingface_hub import hf_hub_download, login
except Exception as e:
    print("HFGATE_BAD", repr(e)[:120])
    raise SystemExit(0)

for repo in GATED:
    try:
        hf_hub_download(repo, "config.json", token=token)
    except Exception as e:
        print("HFGATE_BAD", repo, repr(e)[:120])
        raise SystemExit(0)

# Persist at HF_HOME (Pinokio injects a per-app HF_HOME) so start.js picks it up.
login(token=token, add_to_git_credential=False)
print("HFGATE_OK")
