// CLAUDE-NOTE: Launches the launcher-owned Gradio GUI (gradio_app.py, in the launcher
// root so the upstream app/ stays untouched) from the venv made by install.js. The shell
// runs in app/ so the upstream `uniforge3d` package and assets/ resolve. build:true gives
// an MSVC/CUDA env in case Triton (flex_gemm) JIT-compiles kernels on first run.
// URL capture follows the mandated mochi pattern (capture group -> input.event[1]).
module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        build: true,
        env: {
          "GRADIO_ALLOWED_PATHS": "{{cwd}}"
        },
        // CLAUDE-NOTE: upstream defaults to low_vram=True (models offloaded to CPU between
        // stages). start.js?full_vram=true keeps every model resident: faster, needs ~40GB+.
        message: [
          "python ../gradio_app.py {{args.full_vram ? '--full-vram' : ''}}"
        ],
        on: [{
          "event": "/(http:\\/\\/[0-9.:]+)/",
          "done": true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        url: "{{input.event[1]}}"
      }
    }
  ]
}
