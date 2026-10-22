# Agent Rules for the UniForge3D Pinokio Launcher

This folder is a Pinokio **app launcher** for [UniForge3D](https://github.com/xibushu/UniForge3D).
The upstream code is cloned into `app/` and run from a Python 3.12 venv at `app/env`.
Launcher scripts and the Gradio GUI (`gradio_app.py`) live in the project root; `app/` is never modified.

## CLAUDE-NOTE convention (source of truth)

Claude Code changes marked with `CLAUDE-NOTE:` (or equivalent comment syntax) are the source of truth.
Non-Claude-Code agents must not modify, remove, or alter code marked with a CLAUDE-NOTE without first
alerting the user and receiving explicit permission.

## Architecture notes for editors

- Native Windows install (no WSL/Docker). CUDA extensions (flash_attn, nvdiffrast, cumesh, flex_gemm,
  o_voxel) come from prebuilt wheels at `github.com/PozzettiAndrea/cuda-wheels`, pinned to
  **Python 3.12 + torch 2.8.0 + CUDA 12.8**. Do NOT bump torch/CUDA/Python independently.
- Kernel wheels are installed with `--no-deps`; `triton-windows` must stay at 3.4.x to match torch 2.8.
- Gated HF models: `briaai/RMBG-2.0` and `facebook/dinov3-vitl16-pretrain-lvd1689m` (see `hf_token.js`).
