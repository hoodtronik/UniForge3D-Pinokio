// CLAUDE-NOTE: Post-install "Download Models" menu action. Needs a Hugging Face token
// (Set HF Token) because two of the weights are gated. Shows a notice instead of an error
// spiral when access is missing. The marker it writes lets pinokio.js stop suggesting it.
module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        message: "python ../download_models.py",
        on: [
          { "event": "/MODELS_OK/", "done": true },
          { "event": "/MODELS_GATED/", "done": true },
          { "event": "/MODELS_FAIL/", "done": true }
        ]
      }
    },
    {
      method: "local.set",
      params: { result: "{{input.event[0]}}" }
    },
    {
      method: "notify",
      when: "{{local.result === 'MODELS_OK'}}",
      params: { html: "UniForge3D models downloaded. Click Start to launch." }
    },
    {
      method: "notify",
      when: "{{local.result === 'MODELS_GATED'}}",
      params: { html: "Hugging Face access denied for a gated model. Accept the RMBG-2.0 and DINOv3 licenses (DINOv3 needs approval), then run Set HF Token and Download Models again." }
    },
    {
      method: "notify",
      when: "{{local.result === 'MODELS_FAIL'}}",
      params: { html: "Model download failed. Check the terminal output, then try Download Models again." }
    }
  ]
}
