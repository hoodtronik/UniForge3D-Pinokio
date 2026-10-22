// CLAUDE-NOTE: Native-Windows install of UniForge3D (xibushu/UniForge3D) + a Gradio GUI.
// UniForge3D is built on microsoft/TRELLIS.2 and needs the same CUDA extensions
// (flash_attn, nvdiffrast, cumesh, flex_gemm, o_voxel). Upstream's setup.sh compiles them
// from source on Linux; on Windows we instead use the prebuilt community wheels at
// github.com/PozzettiAndrea/cuda-wheels, pinned to the one coherent combo already proven
// in the Pixal3D launcher: Python 3.12 + torch 2.8.0 + CUDA 12.8 (cp312/cu128torch2.8).
// Upstream pins torch 2.6/py3.10, but the code only uses stock torch APIs, so 2.8 is fine.
//
// CLAUDE-NOTE: kernel wheels are installed with --no-deps so pip cannot swap out the
// torch 2.8.0 build they were compiled against; their pure-python deps (plyfile,
// zstandard, filelock) are installed explicitly. triton-windows MUST match torch
// (torch 2.8 -> triton 3.4) or flex_gemm's Triton launcher fails to compile.
const WHL = "https://github.com/PozzettiAndrea/cuda-wheels/releases/download"
module.exports = {
  requires: {
    bundle: "ai"
  },
  run: [
    // 1) Clone the upstream UniForge3D code into ./app (launcher files stay in the root).
    {
      method: "shell.run",
      params: {
        message: "git clone https://github.com/xibushu/UniForge3D.git app"
      }
    },
    // 2) Create a Python 3.12 venv and install the full stack into it.
    {
      method: "shell.run",
      params: {
        path: "app",
        build: true,
        message: [
          "uv venv --python 3.12 --seed env",
          "uv pip install --python env/Scripts/python.exe torch==2.8.0 torchvision==0.23.0 --index-url https://download.pytorch.org/whl/cu128",
          "uv pip install --python env/Scripts/python.exe \"triton-windows==3.4.0.post21\"",
          // Same python deps as upstream setup.sh (minus the from-source CUDA builds) + gradio.
          "uv pip install --python env/Scripts/python.exe -r ../requirements.txt",
          "uv pip install --python env/Scripts/python.exe --no-deps " +
            "\"" + WHL + "/flash_attn-latest/flash_attn-2.8.3%2Bcu128torch2.8-cp312-cp312-win_amd64.whl\" " +
            "\"" + WHL + "/flex_gemm-latest/flex_gemm-1.0.0%2Bcu128torch2.8-cp312-cp312-win_amd64.whl\" " +
            "\"" + WHL + "/cumesh-latest/cumesh-0.0.1%2Bcu128torch2.8-cp312-cp312-win_amd64.whl\" " +
            "\"" + WHL + "/o_voxel-latest/o_voxel-0.0.1%2Bcu128torch2.8-cp312-cp312-win_amd64.whl\" " +
            "\"" + WHL + "/nvdiffrast-latest/nvdiffrast-0.4.0%2Bcu128torch2.8-cp312-cp312-win_amd64.whl\"",
          // Whitelist loopback in Gradio's safehttpx SSRF guard so uploads work at 127.0.0.1.
          "env\\Scripts\\python.exe ..\\patch_gradio_ssrf.py"
        ]
      }
    },
    // 3) Guided Hugging Face token setup (UniForge3D needs the GATED models
    //    briaai/RMBG-2.0 and facebook/dinov3-vitl16-pretrain-lvd1689m).
    {
      method: "script.start",
      params: {
        uri: "hf_token.js"
      }
    }
  ]
}
