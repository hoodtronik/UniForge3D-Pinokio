// CLAUDE-NOTE: Reset removes the cloned app + its venv so install can start clean.
// Generated GLBs in outputs/ are kept.
module.exports = {
  run: [{
    method: "fs.rm",
    params: {
      path: "app"
    }
  }]
}
