module.exports = {
  version: "7.0",
  title: "UniForge3D",
  description: "Generate complete textured 3D assets (GLB) from sparse, unposed multi-view images. Built on TRELLIS.2 + VGGT.",
  icon: "icon.png",
  menu: async (kernel, info) => {
    // CLAUDE-NOTE: "installed" = the Python venv exists at app/env (created by install.js).
    let installed = info.exists("app/env")
    let running = {
      install: info.running("install.js"),
      start: info.running("start.js"),
      update: info.running("update.js"),
      reset: info.running("reset.js"),
      hf_token: info.running("hf_token.js")
    }
    if (running.hf_token) {
      return [{
        default: true,
        icon: "fa-brands fa-hugging-face",
        text: "Hugging Face login",
        href: "hf_token.js",
      }]
    }
    if (running.install) {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Installing",
        href: "install.js",
      }]
    } else if (running.update) {
      return [{
        default: true,
        icon: "fa-solid fa-terminal",
        text: "Updating",
        href: "update.js",
      }]
    } else if (running.reset) {
      return [{
        default: true,
        icon: "fa-solid fa-terminal",
        text: "Resetting",
        href: "reset.js",
      }]
    } else if (running.start) {
      let local = info.local("start.js")
      if (local && local.url) {
        return [{
          default: true,
          icon: "fa-solid fa-rocket",
          text: "Open Web UI",
          href: local.url,
        }, {
          icon: "fa-solid fa-terminal",
          text: "Terminal",
          href: "start.js",
        }]
      } else {
        return [{
          default: true,
          icon: "fa-solid fa-terminal",
          text: "Terminal",
          href: "start.js",
        }]
      }
    } else if (installed) {
      return [{
        default: true,
        icon: "fa-solid fa-power-off",
        text: "Start",
        href: "start.js",
      }, {
        icon: "fa-solid fa-bolt",
        text: "Start (Full VRAM, faster)",
        href: "start.js?full_vram=true",
      }, {
        icon: "fa-brands fa-hugging-face",
        text: "Set HF Token",
        href: "hf_token.js",
      }, {
        icon: "fa-solid fa-plug",
        text: "Update",
        href: "update.js",
      }, {
        icon: "fa-regular fa-circle-xmark",
        text: "Reset",
        href: "reset.js",
      }]
    } else {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Install",
        href: "install.js",
      }]
    }
  }
}
