#!/usr/bin/env node
/* Build MRLN-Guide.pdf from GUIDE.md, themed to match the app (cyberpunk HUD
 * palette + Orbitron/Rajdhani/Share Tech Mono) with the app's diamond logo.
 *
 *   NODE_PATH=/opt/node22/lib/node_modules node tools/guide/build-guide-pdf.js
 *
 * Renders a self-contained HTML (logo embedded as base64) to PDF via the
 * pre-installed Chromium (Skia/PDF), printing backgrounds so the dark theme
 * survives. No external markdown library — a small, purpose-built converter
 * covers exactly what GUIDE.md uses (headings, bold/italic/code, tables,
 * ordered/unordered lists, rules, paragraphs).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../..');
const MD = fs.readFileSync(path.join(ROOT, 'GUIDE.md'), 'utf8');
const LOGO = fs.readFileSync(path.join(ROOT, 'icon-512.png')).toString('base64');
const OUT = path.join(ROOT, 'MRLN-Guide.pdf');

/* ---------- tiny markdown -> HTML ---------- */
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function inline(s){
  const codes = [];
  s = s.replace(/`([^`]+)`/g, function(_, c){ codes.push(c); return '@@CODE'+(codes.length-1)+'@@'; }); // protect code
  s = esc(s);
  s = s.replace(/\\\*/g, '@@AST@@');                          // escaped asterisk -> marker
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');   // bold
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');               // italic
  s = s.replace(/@@AST@@/g, '*');                             // restore literal *
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/@@CODE(\d+)@@/g, function(_, i){ return '<code>'+esc(codes[+i])+'</code>'; });
  return s;
}
function mdToHtml(md){
  const lines = md.replace(/\r/g,'').split('\n');
  let out = [], i = 0;
  const isRow = l => /^\s*\|.*\|\s*$/.test(l);
  while (i < lines.length){
    let l = lines[i];
    if (/^\s*$/.test(l)) { i++; continue; }
    if (/^---+\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    let h = l.match(/^(#{1,6})\s+(.*)$/);
    if (h){ const lv = h[1].length; out.push('<h'+lv+'>'+inline(h[2].trim())+'</h'+lv+'>'); i++; continue; }
    if (isRow(l) && i+1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i+1])){
      const cells = r => r.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split('|').map(c=>c.trim());
      const head = cells(l); i += 2;
      let bodyRows = [];
      while (i < lines.length && isRow(lines[i])){ bodyRows.push(cells(lines[i])); i++; }
      let t = '<table><thead><tr>'+head.map(c=>'<th>'+inline(c)+'</th>').join('')+'</tr></thead><tbody>';
      t += bodyRows.map(r=>'<tr>'+r.map(c=>'<td>'+inline(c)+'</td>').join('')+'</tr>').join('');
      t += '</tbody></table>';
      out.push(t); continue;
    }
    if (/^\s*\d+\.\s+/.test(l)){
      let items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])){ items.push(inline(lines[i].replace(/^\s*\d+\.\s+/,''))); i++; }
      out.push('<ol>'+items.map(x=>'<li>'+x+'</li>').join('')+'</ol>'); continue;
    }
    if (/^\s*[-*]\s+/.test(l)){
      let items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])){ items.push(inline(lines[i].replace(/^\s*[-*]\s+/,''))); i++; }
      out.push('<ul>'+items.map(x=>'<li>'+x+'</li>').join('')+'</ul>'); continue;
    }
    let para = [l]; i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,6}\s|---+\s*$|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i]) && !isRow(lines[i])){
      para.push(lines[i]); i++;
    }
    out.push('<p>'+para.map(inline).join('<br>')+'</p>');
  }
  return out.join('\n');
}

/* the H1 + intro lines become the cover; body is everything after the first rule */
const body = mdToHtml(MD).replace(/^[\s\S]*?<hr>/, '');

/* ---------- themed HTML ---------- */
const HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#05080f; --panel:#0b1422; --panel2:#08111e; --line:#1b3a5c;
    --cyan:#00e5ff; --cyan-dim:#0a7e8c; --lime:#7CFFB2; --amber:#ffb547; --red:#ff5c7c;
    --txt:#cfeaff; --txt-dim:#6f93b5;
  }
  *{ box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  @page{ size:A4; margin:14mm 0 16mm; }
  @page:first{ margin:0; }
  html,body{ margin:0; padding:0; background:var(--bg); color:var(--txt);
    font-family:'Rajdhani',sans-serif; font-size:11.5pt; line-height:1.5; }
  body{ background:radial-gradient(1200px 700px at 50% -10%, rgba(0,229,255,.06), transparent 60%), var(--bg); }
  .page{ padding:0 16mm; }
  /* cover */
  .cover{ height:100vh; margin:0; padding:0 18mm;
    display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;
    page-break-after:always; position:relative; overflow:hidden;
    background:
      radial-gradient(60% 50% at 50% 38%, rgba(0,229,255,.10), transparent 70%),
      repeating-linear-gradient(0deg, transparent 0 26px, rgba(27,58,92,.18) 26px 27px),
      repeating-linear-gradient(90deg, transparent 0 26px, rgba(27,58,92,.18) 26px 27px),
      var(--bg);
  }
  .cover .logo{ width:188px; height:188px; filter:drop-shadow(0 0 26px rgba(0,229,255,.45)); }
  .cover .eyebrow{ font-family:'Share Tech Mono',monospace; color:var(--cyan); letter-spacing:.42em;
    font-size:11pt; margin:26px 0 6px; text-transform:uppercase; }
  .cover h1{ font-family:'Orbitron',sans-serif; font-weight:900; font-size:52pt; margin:6px 0 2px;
    letter-spacing:.08em; color:#eaffff; text-shadow:0 0 30px rgba(0,229,255,.5); }
  .cover .subt{ font-family:'Orbitron',sans-serif; font-weight:700; font-size:17pt; letter-spacing:.30em;
    color:var(--cyan); margin:0 0 22px; text-transform:uppercase; }
  .cover .tag{ color:var(--txt-dim); font-size:13pt; letter-spacing:.04em; }
  .cover .tag b{ color:var(--lime); font-weight:600; }
  .cover .rule{ width:140px; height:2px; margin:24px auto 0;
    background:linear-gradient(90deg,transparent,var(--cyan),transparent); }
  .cover .link{ position:absolute; bottom:20mm; left:0; right:0; font-family:'Share Tech Mono',monospace;
    color:var(--cyan-dim); font-size:9.5pt; letter-spacing:.12em; }
  /* headings */
  h1,h2,h3,h4{ font-family:'Orbitron',sans-serif; color:#eaffff; line-height:1.25; }
  h2{ font-size:18pt; font-weight:800; margin:26px 0 10px; padding-bottom:8px;
    border-bottom:1px solid var(--line); letter-spacing:.02em; page-break-after:avoid; }
  h2::before{ content:"\\25C6"; color:var(--cyan); margin-right:12px; font-size:15pt;
    vertical-align:2px; text-shadow:0 0 10px rgba(0,229,255,.6); }
  h3{ font-size:13.5pt; font-weight:700; color:var(--cyan); margin:18px 0 6px; letter-spacing:.02em; page-break-after:avoid; }
  h4{ font-size:11.5pt; font-weight:700; color:var(--lime); margin:14px 0 4px;
    font-family:'Rajdhani',sans-serif; letter-spacing:.04em; page-break-after:avoid; }
  p{ margin:7px 0; }
  strong{ color:#eaffff; font-weight:700; }
  em{ color:var(--amber); font-style:italic; }
  a{ color:var(--cyan); text-decoration:none; }
  code{ font-family:'Share Tech Mono',monospace; font-size:9.5pt; color:var(--lime);
    background:rgba(0,229,255,.08); border:1px solid rgba(27,58,92,.7); border-radius:5px; padding:1px 6px; }
  hr{ border:0; height:1px; margin:22px 0;
    background:linear-gradient(90deg,transparent,var(--line) 20%,var(--cyan-dim) 50%,var(--line) 80%,transparent); }
  ul,ol{ margin:8px 0; padding-left:22px; }
  li{ margin:4px 0; }
  ul li::marker{ color:var(--cyan); }
  ol li::marker{ color:var(--cyan); font-family:'Share Tech Mono',monospace; }
  /* tables as HUD panels */
  table{ width:100%; border-collapse:collapse; margin:12px 0; font-size:10.5pt;
    border:1px solid var(--line); border-radius:10px; overflow:hidden; page-break-inside:avoid; }
  thead th{ background:var(--panel); color:var(--cyan); text-align:left; font-weight:700;
    font-family:'Share Tech Mono',monospace; font-size:9pt; letter-spacing:.08em; text-transform:uppercase;
    padding:9px 12px; border-bottom:1px solid var(--line); }
  tbody td{ padding:8px 12px; border-bottom:1px solid rgba(27,58,92,.5); vertical-align:top; }
  tbody tr:nth-child(even){ background:rgba(11,20,34,.5); }
  tbody tr:last-child td{ border-bottom:0; }
  h3 + p, h3 + ul, h4 + p, h4 + ul{ page-break-before:avoid; }
</style></head>
<body>
  <section class="cover">
    <img class="logo" src="data:image/png;base64,${LOGO}" alt="MRLN">
    <div class="eyebrow">// Finance &amp; Health HUD</div>
    <h1>MRLN</h1>
    <div class="subt">The Complete Guide</div>
    <div class="tag"><b>Free</b> &nbsp;&middot;&nbsp; <b>Offline</b> &nbsp;&middot;&nbsp; <b>Private</b> &nbsp;&middot;&nbsp; one self-contained file</div>
    <div class="rule"></div>
    <div class="link">https://sagemrln.github.io/my-first-repo/</div>
  </section>
  <main class="page">
${body}
  </main>
</body></html>`;

(async () => {
  const tmp = path.join(os.tmpdir(), 'mrln-guide-'+process.pid+'.html');
  fs.writeFileSync(tmp, HTML);
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const page = await browser.newPage();
  await page.goto('file://'+tmp, { waitUntil: 'networkidle' });
  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch(_){}
  await page.waitForTimeout(400);
  await page.pdf({
    path: OUT, format: 'A4', printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font-family:monospace;font-size:7pt;color:#6f93b5;padding:0 14mm;display:flex;justify-content:space-between;-webkit-print-color-adjust:exact;"><span>MRLN &mdash; The Complete Guide</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'
  });
  await browser.close();
  if (process.env.MRLN_KEEP_HTML) { console.log('html', tmp); } else { fs.unlinkSync(tmp); }
  const kb = Math.round(fs.statSync(OUT).size/1024);
  console.log('wrote', path.relative(ROOT, OUT), '('+kb+' KB)');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
