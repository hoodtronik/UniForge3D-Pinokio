// CLAUDE-NOTE: Guided Hugging Face token setup. UniForge3D loads two GATED models
// (briaai/RMBG-2.0 and facebook/dinov3-vitl16-pretrain-lvd1689m), so the app needs an HF
// token whose account has accepted both licenses. This pops a modal, validates the token
// via check_hf_token.py, persists it on success, and loops back with an error on failure
// (a `jump` retry loop instead of crashing). Run from the post-install menu; on success
// pinokio.js makes "Download Models" the next default step.
module.exports = {
  run: [
    {
      method: "local.set",
      params: { err: "" }
    },
    {
      id: "prompt",
      method: "input",
      params: {
        type: "modal",
        title: "Hugging Face access (required for UniForge3D)",
        description: "{{local.err}}UniForge3D uses two GATED Hugging Face models, so it needs your Hugging Face token.\n\nStep 1 — Open https://huggingface.co/briaai/RMBG-2.0 and click \"Agree and access repository\".\nStep 2 — Open https://huggingface.co/facebook/dinov3-vitl16-pretrain-lvd1689m and request/accept access (Meta usually approves within minutes).\nStep 3 — Create a READ token at https://huggingface.co/settings/tokens\nStep 4 — Paste the token below and submit.",
        form: [{
          type: "password",
          key: "token",
          title: "Hugging Face token",
          description: "Stored locally for this app only. Never committed to git.",
          placeholder: "hf_...",
          required: true
        }]
      }
    },
    {
      method: "local.set",
      params: { token: "{{input.token}}" }
    },
    {
      method: "shell.run",
      params: {
        env: { HF_TEST_TOKEN: "{{local.token}}" },
        message: '"{{cwd}}\\app\\env\\Scripts\\python.exe" "{{cwd}}\\check_hf_token.py"',
        on: [
          { "event": "/HFGATE_OK/", "done": true },
          { "event": "/HFGATE_BAD/", "done": true }
        ]
      }
    },
    {
      method: "local.set",
      params: { result: "{{input.event[0]}}" }
    },
    {
      method: "local.set",
      when: "{{local.result !== 'HFGATE_OK'}}",
      params: { err: "⚠️ That token could not access one of the gated models. Make sure the token's account has accepted BOTH model licenses (the DINOv3 request must be approved), and that you pasted a valid READ token, then try again. (If DINOv3 access is still pending, close this window and come back via Set HF Token once approved.)\n\n" }
    },
    {
      method: "jump",
      when: "{{local.result !== 'HFGATE_OK'}}",
      params: { id: "prompt" }
    }
  ]
}
