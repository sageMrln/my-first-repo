/* Shared local browser discovery. No download or network fallback. */
const fs = require('fs');
const path = require('path');

function browser() {
  let chromium;
  for (const name of [process.env.MRLN_PLAYWRIGHT_MODULE, 'playwright',
    '/opt/node22/lib/node_modules/playwright/index.js'].filter(Boolean)) {
    try { chromium = require(name).chromium; if (chromium) break; } catch (_) {}
  }
  if (!chromium) return null;
  const candidates = [process.env.MRLN_CHROMIUM_EXECUTABLE, chromium.executablePath()];
  try {
    for (const dir of fs.readdirSync('/opt/pw-browsers').filter(n => n.startsWith('chromium-')).sort().reverse()) {
      candidates.push(path.join('/opt/pw-browsers', dir, 'chrome-linux', 'chrome'));
    }
  } catch (_) {}
  const executablePath = candidates.find(p => p && fs.existsSync(p) && fs.statSync(p).isFile());
  return executablePath ? { chromium, executablePath } : null;
}
module.exports = browser;
