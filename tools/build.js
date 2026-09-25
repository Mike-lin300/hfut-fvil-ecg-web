/* 导学静态站点构建器（零依赖，仅 Node 标准库）
 * 用法：node tools/build.js          构建 P0 页面
 *       node tools/build.js --all    构建全部页面
 * 原则：md 是唯一真源；web/ 是生成物；无 JS 时核心功能（折叠/目录/跳转/高亮）依然可用。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'web');
const ACCENT = '#1f6feb';                                   /* 实验室蓝 */
const BUILD_TIME = new Date().toISOString().replace('T', ' ').slice(0, 16);
let GIT_HASH = 'nogit';
try { GIT_HASH = require('child_process').execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch (e) { /* 无 git 也能构建 */ }

/* ---------------- 篇目清单 ---------------- */
const PAGES = [
  { slug: 'guide-0',  file: '（选读）导学案0_扫盲.md',     kind: '选读', note: '计算机扫盲，会电脑可跳过' },
  { slug: 'guide-1',  file: '导学案1_认识.md',            kind: '导学', note: '开发环境 + Hello World' },
  { slug: 'guide-2',  file: '导学案2_计算.md',            kind: '导学', note: 'printf / scanf / 变量 / 运算' },
  { slug: 'guide-3',  file: '导学案3_判断.md',            kind: '导学', note: 'if / else if / switch' },
  { slug: 'guide-4',  file: '导学案4_循环.md',            kind: '导学', note: 'while / for / 嵌套循环' },
  { slug: 'guide-4x', file: '（选读）导学案4_附加材料.md',  kind: '选读', note: '飞控三技巧：状态机 / 单次执行 / 分频' },
  { slug: 'guide-5',  file: '导学案5_数组.md',            kind: '导学', note: '一维 / 二维 / 字符串初步' },
  { slug: 'guide-6',  file: '导学案6_函数.md',            kind: '导学', note: '函数与值传递' },
  { slug: 'guide-7',  file: '导学案7_指针.md',            kind: '导学', note: '地址 / 解引用 / 数组名是指针' },
  { slug: 'guide-8',  file: '导学案8_结构体.md',          kind: '导学', note: '结构体与 ->' },
  { slug: 'hw-1',     file: '作业一.md',                  kind: '作业', note: '第一期：顺序 ~ 数组' },
  { slug: 'hw-2',     file: '作业二.md',                  kind: '作业', note: '第二期：函数 ~ 结构体' },
  { slug: 'app-1',    file: '附录一_Windows CMD常用指令.md', kind: '附录', note: 'CMD 速查表' },
  { slug: 'app-2',    file: '@CODE:附录二_主控代码/ZXH_FlightCtrl.c', kind: '附录', note: '真实飞控主控代码（代码阅读页）' },
];
const P0 = ['guide-0', 'guide-6', 'hw-1'];

/* ---------------- 工具 ---------------- */
const warnings = [];
const warn = (page, msg) => warnings.push('[' + page + '] ' + msg);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* C 语言静态高亮：注释 / 字符串 / 字符 / 预处理 / 数字 / 关键字 / 函数调用 */
const C_KW = new Set(('int char short long float double void unsigned signed struct union enum typedef const static extern ' +
  'register volatile sizeof if else for while do switch case default break continue return goto NULL define include ' +
  'ifdef ifndef endif uint8_t uint16_t uint32_t int8_t int16_t int32_t u8 u16 u32').split(' '));
function highlightC(code) {
  const re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(^#[^\n]*)|(\b\d+(?:\.\d+)?[fFuUlL]*\b)|([A-Za-z_]\w*)/gm;
  let out = '', last = 0, m;
  while ((m = re.exec(code)) !== null) {
    out += esc(code.slice(last, m.index));
    const t = m[0];
    if (m[1]) out += '<span class="tk-com">' + esc(t) + '</span>';
    else if (m[2]) out += '<span class="tk-str">' + esc(t) + '</span>';
    else if (m[3]) out += '<span class="tk-pre">' + esc(t) + '</span>';
    else if (m[4]) out += '<span class="tk-num">' + esc(t) + '</span>';
    else if (C_KW.has(t)) out += '<span class="tk-kw">' + esc(t) + '</span>';
    else if (code[re.lastIndex] === '(') out += '<span class="tk-fn">' + esc(t) + '</span>';
    else out += esc(t);
    last = re.lastIndex;
  }
  return out + esc(code.slice(last));
}

/* ---------------- 内联 ---------------- */
function inline(s) {
  let out = esc(s);
  out = out.replace(/`([^`]+)`/g, (m, c) => '<code>' + c + '</code>');
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, src) =>
    /^[a-z]+:\/\//.test(src) ? '<a class="imglink" href="' + src + '" target="_blank" rel="noopener"><img src="' + src + '" alt="' + alt + '" loading="lazy"></a>'
                             : '<a class="imglink" href="assets/' + src.replace(/^\.\//, '') + '" target="_blank" rel="noopener"><img src="assets/' + src.replace(/^\.\//, '') + '" alt="' + alt + '" loading="lazy"></a>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[\s（(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  out = out.replace(/&lt;\/?small&gt;/g, m => m.replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
  return out;
}

/* ---------------- 块级解析 ---------------- */
function parseBlocks(lines, page) {
  const blocks = [];
  let i = 0;
  const isListStart = l => /^\s*(\d+[.、)]|-|\*)\s+/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { blocks.push({ t: 'h' + m[1].length, text: m[2].trim() }); i++; continue; }
    if (/^```/.test(line.trim())) {
      const lang = line.trim().slice(3).trim(); const buf = []; i++; let closed = false;
      while (i < lines.length) { if (/^```/.test(lines[i].trim())) { closed = true; i++; break; } buf.push(lines[i]); i++; }
      if (!closed) warn(page, '代码围栏未闭合');
      blocks.push({ t: 'code', lang, text: buf.join('\n') }); continue;
    }
    if (/^>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      blocks.push({ t: 'quote', inner: parseBlocks(buf, page), raw: buf.join('\n') }); continue;
    }
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const split = l => l.trim().replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());
      const head = split(line); i += 2; const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(split(lines[i])); i++; }
      blocks.push({ t: 'table', head, rows }); continue;
    }
    if (/^-{3,}\s*$/.test(line)) { blocks.push({ t: 'hr' }); i++; continue; }
    if (isListStart(line)) {
      const ordered = /^\s*\d/.test(line); const items = [];
      while (i < lines.length) {
        const l = lines[i];
        if (/^\s{2,}(-|\*)\s+/.test(l)) { if (!items.length) { items.push({ text: l.trim().replace(/^\s*(-|\*)\s+/, '') }); i++; continue; } (items[items.length - 1].sub = items[items.length - 1].sub || []).push(l.trim().replace(/^(-|\*)\s+/, '')); i++; continue; }
        if (/^\s{2,}\S/.test(l) && items.length) { items[items.length - 1].text += ' ' + l.trim(); i++; continue; }
        if (isListStart(l) && (ordered === /^\s*\d/.test(l))) { items.push({ text: l.trim().replace(/^\s*(\d+[.、)]|-|\*)\s+/, '') }); i++; continue; }
        break;
      }
      blocks.push({ t: ordered ? 'ol' : 'ul', items }); continue;
    }
    const buf = [line]; i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|>|\||-{3,}\s*$)/.test(lines[i]) && !isListStart(lines[i])) { buf.push(lines[i]); i++; }
    blocks.push({ t: 'p', text: buf.join(' ') });
  }
  return blocks;
}

/* ---------------- 渲染 ---------------- */
function render(blocks, page, ctx) {
  let out = '';
  const closeOpenDetails = () => { if (ctx.detailsOpen) { out += '</details>'; ctx.detailsOpen = false; } };
  for (const b of blocks) {
    if (b.t === 'h1') continue;
    if (b.t === 'h2') {
      closeOpenDetails();
      const id = 'sec-' + (++ctx.seq);
      ctx.inAppendix = /练习参考代码/.test(b.text);
      ctx.toc.push({ lv: 2, id, text: b.text });
      out += '<h2 id="' + id + '">' + inline(b.text) + '</h2>';
      continue;
    }
    if (b.t === 'h3') {
      const id = 'sec-' + (++ctx.seq);
      const mAns = b.text.match(/^练习\s*(\d+)\s*(参考代码|参考答案)/);
      const mEx = b.text.match(/^练习\s*(\d+)｜/);
      if (ctx.inAppendix && mAns) {
        closeOpenDetails();
        out += '<details class="ans" id="ans-' + mAns[1] + '"><summary class="ans-title">' + inline(b.text) + '</summary>';
        ctx.detailsOpen = true;
        ctx.toc.push({ lv: 3, id: 'ans-' + mAns[1], text: b.text });
        continue;
      }
      closeOpenDetails();
      ctx.toc.push({ lv: 3, id, text: b.text });
      const jump = (mEx && ctx.hasAppendix && ctx.ansSet.has(mEx[1])) ? ' <a class="jump" href="#ans-' + mEx[1] + '">参考代码 ↧</a>' : '';
      out += '<h3 id="' + id + '">' + inline(b.text) + '</h3>' + jump;
      continue;
    }
    if (b.t === 'p') { out += '<p>' + inline(b.text) + '</p>'; continue; }
    if (b.t === 'hr') { out += '<hr>'; continue; }
    if (b.t === 'code') {
      const body = b.lang === 'c' ? highlightC(b.text) : esc(b.text);
      out += '<div class="codewrap' + (b.lang === 'c' ? ' dark' : '') + '"><button class="copybtn" type="button">复制</button><pre><code class="lang-' + (b.lang || 'text') + '">' + body + '</code></pre></div>';
      continue;
    }
    if (b.t === 'quote') { out += '<blockquote>' + render(b.inner, page, ctx) + '</blockquote>'; continue; }
    if (b.t === 'table') {
      out += '<div class="table-wrap"><table><thead><tr>' + b.head.map(h => '<th>' + inline(h) + '</th>').join('') + '</tr></thead><tbody>'
        + b.rows.map(r => '<tr>' + r.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
      continue;
    }
    if (b.t === 'ul' || b.t === 'ol') {
      out += '<' + b.t + '>' + b.items.map(it => '<li>' + inline(it.text) +
        (it.sub ? '<ul>' + it.sub.map(s => '<li>' + inline(s) + '</li>').join('') + '</ul>' : '') + '</li>').join('') + '</' + b.t + '>';
      continue;
    }
  }
  closeOpenDetails();
  return out;
}

/* ---------------- 单篇 ---------------- */
function convert(p) {
  const raw = fs.readFileSync(path.join(ROOT, p.file), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');
  const title = ((lines.find(l => /^#\s/.test(l)) || '# ' + p.slug).replace(/^#\s*/, ''));
  const blocks = parseBlocks(lines.slice(lines.findIndex(l => /^#\s/.test(l)) + 1), p.slug);
  let meta = '', footer = '';
  if (blocks[0] && blocks[0].t === 'quote') {
    meta = '<dl class="doc-meta">' + blocks[0].raw.split('\n').filter(l => l.trim()).map(l => {
      const m = l.trim().match(/^\*\*([^*]+)\*\*：?\s*(.*)$/);
      return m ? '<dt>' + esc(m[1]) + '</dt><dd>' + inline(m[2]) + '</dd>' : '<dd class="wide">' + inline(l.trim()) + '</dd>';
    }).join('') + '</dl>';
    blocks.shift();
  }
  const fi = blocks.findIndex(b => b.t === 'quote' && /作者：/.test(b.raw));
  if (fi >= 0) {
    footer = '<footer class="doc-footer">' + blocks[fi].inner.filter(b => b.t === 'p')
      .map(b => '<p>' + inline(b.text) + '</p>').join('')
      + '<p class="gen">本页由 tools/build.js 生成 · ' + BUILD_TIME + ' · 源文件 ' + esc(p.file) + ' · commit ' + GIT_HASH + '</p></footer>';
    blocks.splice(fi, 1);
  }
  const ctx = { toc: [], seq: 0, hasAppendix: /练习参考代码/.test(raw), inAppendix: false, detailsOpen: false,
    ansSet: new Set([...raw.matchAll(/^### 练习\s*(\d+)\s*(?:参考代码|参考答案)/gm)].map(m => m[1])) };
  const body = render(blocks, p.slug, ctx);
  for (const m of raw.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
    const src = m[1];
    if (/^[a-z]+:\/\//.test(src)) continue;
    const from = path.join(ROOT, src), to = path.join(OUT, 'assets', src);
    if (!fs.existsSync(from)) { warn(p.slug, '图片缺失：' + src); continue; }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
  /* 校验：跳答案锚点必须存在 */
  for (const m of body.matchAll(/href="#(ans-\d+)"/g)) {
    if (!body.includes('id="' + m[1] + '"')) warn(p.slug, '跳答案锚点无目标：' + m[1]);
  }
  return { title, meta, footer, body, toc: ctx.toc };
}

/* ---------------- 外壳 ---------------- */
function shell(o) {
  const side = PAGES.map(p => {
    const cur = p.slug === o.slug ? ' class="cur"' : '';
    const href = p.built ? p.slug + '.html' : '#';
    const todo = p.built ? '' : ' class="todo"';
    const num = p.slug.replace('guide-', '').replace('4x', '4附加').replace('hw-', '').replace('app-', '');
    return '<li' + cur + '><a href="' + href + '"' + todo + (p.built ? '' : ' title="P1 生成"') + '><span class="k">' + p.kind + '</span>' + esc(num + ' ' + (p.short || p.note || '')) + '</a></li>';
  }).join('');
  const toc = o.toc.length ? '<details class="toc toc-top"><summary>本页目录</summary><ol>' +
    o.toc.map(t => '<li class="lv' + t.lv + '"><a href="#' + t.id + '">' + esc(t.text) + '</a></li>').join('') + '</ol></details>' : '';
  const rail = o.toc.length ? '<aside class="rail"><div class="rail-box"><div class="rail-title">本页目录</div><ol class="rail-toc">' + o.toc.map(t => '<li class="lv' + t.lv + '"><a href="#' + t.id + '">' + esc(t.text) + '</a></li>').join('') + '</ol></div></aside>' : '<aside class="rail"></aside>';
  return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + esc(o.title) + ' · 飞行器创新实验室 C 语言导学</title>\n<link rel="stylesheet" href="assets/site.css">\n</head>\n<body>\n' +
    '<header class="top"><a class="brand" href="index.html">HFUT AircraftLab · C 语言导学</a><span class="stamp">生成于 ' + BUILD_TIME + ' · ' + GIT_HASH + '</span></header>\n' +
    '<div class="layout">\n<nav class="side"><details open class="sidenav"><summary>全站目录</summary><ul>' + side + '</ul></details></nav>\n' +
    '<main class="content">\n' + (o.noTitle ? '' : '<h1 class="doctitle">' + esc(o.title) + '</h1>') + (o.meta || '') + '\n' + toc + '\n<article>\n' + o.body + '\n</article>\n' + (o.footer || '') + '\n' +
    '<nav class="pn">' + (o.prev ? '<a href="' + o.prev.slug + '.html">← ' + esc(o.prev.title) + '</a>' : '<span></span>') +
    (o.next ? '<a href="' + o.next.slug + '.html">' + esc(o.next.title) + ' →</a>' : '<span></span>') + '</nav>\n</main>\n' + rail + '\n</div>\n' +
    '<script src="assets/site.js"></script>\n</body>\n</html>';
}

/* ---------------- 附录二：代码阅读页 ---------------- */
function buildCodePage(p) {
  const rel = p.file.slice(6);
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
  const meta = '<dl class="doc-meta"><dt>类别</dt><dd>附录（只读源码）</dd><dt>配套</dt><dd>导学案4 附加材料（选读）</dd><dt>说明</dt><dd>依赖工程内其他模块，不能单独编译；仅作阅读材料</dd></dl>';
  const body = '<h2 id="sec-1">这份代码是什么</h2>' +
    '<p><code>ZXH_FlightCtrl.c</code> 是实验室真实飞控的<strong>主控任务</strong>：一键起飞 → 短悬停 → 飞四个航点画一个正方形 → 回到原点 → 降落。文件开头那一排 <code>#include</code> 是它依赖的工程模块，所以这份代码在这里<strong>只作为阅读材料</strong>，不能单独编译。</p>' +
    '<blockquote><p><strong>先读导学案4 附加材料，再来看它。</strong>那一节用终端把三个技巧各演了一遍；这一页是"真身"。</p>' +
    '<p><strong>风格提醒</strong>：真实代码是 Tab 缩进、<code>u8</code> / <code>SFlag</code> 这类嵌入式老习惯命名。缩进我们跟它一致（Tab），但命名在教学阶段不用模仿，按导学案2 的命名规则来。</p></blockquote>' +
    '<h2 id="sec-2">三个技巧在哪里</h2>' +
    '<ol><li><strong>状态机</strong>：<code>switch (OrdinalNum)</code>——<code>case 0</code> 一键起飞、<code>case 1</code> 短悬停、<code>case 2 ~ 5</code> 是正方形的四条边、<code>case 99</code> 降落；<code>OrdinalNum++</code> 就是状态迁移。</li>' +
    '<li><strong>单次执行</strong>：每个 <code>case</code> 开头的 <code>if (SFlag == 1) { SFlag = 0; ... }</code>，进入状态时只做一次的初始化。</li>' +
    '<li><strong>计数器分频</strong>：<code>TaskTimer_ms += dT_ms;</code> 配 <code>if (TaskTimer_ms &lt;= 5000)</code>（悬停满 5 秒）、<code>if (TaskConfirmCount &gt;= 200)</code>（连续确认 200 次才切下一个航点）。</li></ol>' +
    '<h2 id="sec-3">源码（只读）</h2>' +
    '<div class="codewrap dark"><button class="copybtn" type="button">复制</button><pre><code class="lang-c">' + highlightC(code) + '</code></pre></div>';
  const footer = '<footer class="doc-footer"><p class="gen">本页由 tools/build.js 生成 · ' + BUILD_TIME + ' · 源文件 ' + esc(rel) + ' · commit ' + GIT_HASH + '</p></footer>';
  return { title: p.title, meta, footer, body, toc: [{ lv: 2, id: 'sec-1', text: '这份代码是什么' }, { lv: 2, id: 'sec-2', text: '三个技巧在哪里' }, { lv: 2, id: 'sec-3', text: '源码（只读）' }] };
}

/* ---------------- 首页 ---------------- */
function buildIndex(builtSet) {
  const rows = PAGES.map(p => '<tr><td><span class="k k-' + p.kind + '">' + p.kind + '</span></td><td>' +
    (builtSet.has(p.slug) && p.title ? '<a href="' + p.slug + '.html">' + esc(p.title) + '</a>' : '<span class="todo">' + esc(p.file.replace('@CODE:', '')) + '（P1 生成）</span>') +
    '</td><td>' + esc(p.note) + '</td></tr>').join('');
  const body = '<h1>飞行器创新实验室 · C 语言导学</h1>' +
    '<p>本站由 Markdown 源文件自动生成（<code>tools/build.js</code>，零依赖）。<strong>md 是唯一真源</strong>，<code>web/</code> 里的一切都是生成物，请勿手改。</p>' +
    '<blockquote><p><strong>怎么用</strong>：按下面的顺序读。每篇文末的"练习参考代码"默认折叠，<em>做完之前不要展开</em>。练习不强制完成、不需要提交；需要提交的是作业一 / 作业二。</p>' +
    '<p><strong>阅读器</strong>：纯静态 HTML，双击用 Edge / Chrome 打开即可，断网可用；源 md 在随包目录里，用 Typora 等阅读器同样可读。</p></blockquote>' +
    '<h2 id="sec-1">学习路线</h2><div class="table-wrap"><table><thead><tr><th>类别</th><th>篇目</th><th>内容</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<h2 id="sec-2">给维护者</h2><ul><li>改完 md 双击 <code>tools\\build.bat</code> 重建；构建报告见 <code>web/build-report.txt</code>。</li>' +
    '<li>页脚与顶栏的"生成时间 + commit 哈希"用来识别旧站。</li>' +
    '<li>本站是实验室官网的雏形：<code>manifest.json</code> 与 slug 规划可平移到 Django / Flask。</li></ul>';
  return shell({ slug: 'index', title: '首页', noTitle: true, body, toc: [] });
}

/* ---------------- 主流程 ---------------- */
function main() {
  const onlyArg = process.argv.find(a => a.startsWith('--only='));
  const all = !onlyArg;
  const builtSet = onlyArg ? new Set(onlyArg.slice(7).split(',')) : new Set(PAGES.map(p => p.slug));
  PAGES.forEach(p => {
    p.built = builtSet.has(p.slug);
    if (p.file.startsWith('@CODE:')) { p.title = '附录二 · 主控代码 ZXH_FlightCtrl.c'; p.short = '主控代码（飞控）'; }
    if (!p.title) {
      try {
        const first = fs.readFileSync(path.join(ROOT, p.file.startsWith('@CODE:') ? p.file.slice(6) : p.file), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).find(l => /^#\s/.test(l));
        p.title = first ? first.replace(/^#\s*/, '') : p.slug;
      } catch (e) { p.title = p.slug; }
      p.short = (p.title.split('·')[1] || p.title.split('：')[1] || '').trim();
    }
  });
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
  const report = []; const built = [];
  for (const p of PAGES) {
    if (!p.built) continue;
    const r = p.file.startsWith('@CODE:') ? buildCodePage(p) : convert(p);
    p.title = r.title; p.result = r; built.push(p);
    report.push(p.slug + '.html  章节=' + r.toc.length + '  正文=' + r.body.length + ' 字符');
  }
  built.forEach((p, i) => {
    const html = shell({ slug: p.slug, title: p.result.title, meta: p.result.meta, footer: p.result.footer, body: p.result.body, toc: p.result.toc, prev: built[i - 1] || null, next: built[i + 1] || null });
    fs.writeFileSync(path.join(OUT, p.slug + '.html'), html, 'utf8');
  });
  fs.writeFileSync(path.join(OUT, 'index.html'), buildIndex(builtSet), 'utf8');
  fs.writeFileSync(path.join(OUT, 'assets', 'site.css'), CSS.split('__ACCENT__').join(ACCENT), 'utf8');
  fs.writeFileSync(path.join(OUT, 'assets', 'site.js'), JS, 'utf8');
  fs.writeFileSync(path.join(ROOT, '打开我.html'), '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta http-equiv="refresh" content="0; url=web/index.html">\n<title>飞行器创新实验室 · C 语言导学</title>\n</head>\n<body style="font:16px/1.8 \"Microsoft YaHei\",sans-serif;padding:48px;text-align:center">\n<p>正在进入导学站点……</p>\n<p>如果没有自动跳转，请点这里：<a href="web/index.html">进入导学站点</a></p>\n</body>\n</html>\n', 'utf8');
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ builtAt: BUILD_TIME, commit: GIT_HASH, pages: PAGES.map(p => ({ slug: p.slug, kind: p.kind, title: p.title, note: p.note, built: !!p.built, toc: p.result ? p.result.toc : [] })) }, null, 2), 'utf8');
  fs.writeFileSync(path.join(OUT, 'build-report.txt'),
    '构建时间 ' + BUILD_TIME + '  commit ' + GIT_HASH + '  范围 ' + (all ? 'ALL' : 'P0') + '\n生成：index.html, ' + built.map(p => p.slug + '.html').join(', ') + '\n\n' + report.join('\n') +
    '\n\n警告 ' + warnings.length + ' 条：\n' + (warnings.length ? warnings.join('\n') : '（无）') + '\n');
  console.log(report.join('\n'));
  console.log('\n警告 ' + warnings.length + ' 条' + (warnings.length ? '：\n' + warnings.join('\n') : ''));
  process.exit(warnings.length ? 1 : 0);
}

const CSS = `:root{--accent:__ACCENT__;--bg:#fff;--fg:#1f2328;--muted:#57606a;--code-bg:#e9edf2;--code-fg:#1f2328;--line:#d0d7de;--side-w:270px}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font:16px/1.75 "Microsoft YaHei","Segoe UI",system-ui,sans-serif;color:var(--fg);background:var(--bg)}
code,pre{font-family:Consolas,"Cascadia Code","JetBrains Mono",monospace}
.top{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 18px;background:var(--accent);color:#fff}
.top .brand{color:#fff;font-weight:700;text-decoration:none}
.top .stamp{font-size:12px;opacity:.85}
.layout{display:grid;grid-template-columns:var(--side-w) minmax(0,1fr) 232px;min-height:calc(100vh - 45px)}
.rail{padding:26px 14px 40px 10px;border-left:1px solid var(--line)}
.rail-box{position:sticky;top:60px}
.rail-title{font-weight:700;font-size:13px;color:var(--muted);margin-bottom:6px}
.rail-toc{list-style:none;margin:0;padding:0;font-size:13px}
.rail-toc li{margin:.28em 0}
.rail-toc li.lv3{margin-left:1em;color:var(--muted)}
.rail-toc a{color:var(--fg);text-decoration:none}
.rail-toc a:hover{color:var(--accent)}
.side{width:var(--side-w);flex:0 0 var(--side-w);border-right:1px solid var(--line);padding:14px 10px;background:#f6f8fa}
.sidenav>summary{cursor:pointer;font-weight:700;padding:4px 8px}
.side ul{list-style:none;margin:8px 0;padding:0}
.side li a{display:block;padding:5px 10px;border-radius:6px;color:var(--fg);text-decoration:none;font-size:14px}
.side li a:hover{background:#eaeef2}
.side li.cur>a{background:var(--accent);color:#fff}
.side a.todo{color:var(--muted);font-style:italic}
.side .k{display:inline-block;min-width:36px;margin-right:6px;padding:0 5px;border-radius:4px;background:#eaeef2;color:var(--muted);font-size:12px;text-align:center}
.side li.cur .k{background:rgba(255,255,255,.25);color:#fff}
.content{flex:1;min-width:0;padding:26px clamp(16px,4vw,52px) 80px}
article,article p,article ul,article ol,article blockquote,article table,article dl,article h1,article h2,article h3,article .pn{max-width:78ch}
article img{max-width:100%;height:auto;display:block;margin:1em 0;border:1px solid var(--line);border-radius:6px;background:#fff}
a.imglink{display:block;text-decoration:none}
article .codewrap,article .table-wrap,article details{max-width:1000px}
h1{font-size:1.9em;margin:.4em 0 .6em;border-bottom:2px solid var(--accent);padding-bottom:.25em}
h1.doctitle{margin-top:0}
h2{font-size:1.45em;margin:1.6em 0 .6em;border-bottom:1px solid var(--line);padding-bottom:.2em}
h3{font-size:1.15em;margin:1.4em 0 .5em}
a{color:var(--accent)}
a.jump{font-size:.78em;margin-left:.6em;text-decoration:none;border:1px solid var(--line);border-radius:10px;padding:1px 8px;color:var(--muted);white-space:nowrap}
a.jump:hover{color:#fff;background:var(--accent);border-color:var(--accent)}
blockquote{margin:1em 0;padding:.6em 1em;border-left:4px solid var(--accent);background:#f6f8fa;border-radius:0 6px 6px 0}
blockquote blockquote{background:#eaeef2}
table{border-collapse:collapse;margin:1em 0;width:100%}
th,td{border:1px solid var(--line);padding:6px 10px;font-size:.95em;text-align:left;vertical-align:top}
th{background:#f6f8fa}
.table-wrap{overflow-x:auto}
code{background:#eff1f3;border:1px solid var(--line);border-radius:4px;padding:0 4px;font-size:.9em}
pre code{background:none;border:0;padding:0;font-size:.9em;line-height:1.65}
.codewrap{position:relative;margin:1em 0}
.codewrap pre{margin:0;background:#f6f8fa;color:#1f2328;border:1px solid var(--line);padding:12px 16px;border-radius:8px;overflow-x:auto}
.codewrap.dark pre{background:var(--code-bg);color:var(--code-fg);border:1px solid var(--line);padding:12px 16px}
.copybtn{position:absolute;top:8px;right:8px;border:1px solid var(--line);border-radius:6px;background:#eaeef2;color:#57606a;font-size:12px;padding:3px 10px;cursor:pointer}
.copybtn:hover{background:var(--accent);color:#fff}
.tk-kw{color:#cf222e}.tk-str{color:#0a3069}.tk-com{color:#6e7781}.tk-num{color:#0550ae}.tk-pre{color:#8250df}.tk-fn{color:#6639ba}
details{margin:1em 0;border:1px solid var(--line);border-radius:8px;padding:.45em .9em;background:#fcfcfd}
details>summary{cursor:pointer;font-weight:600;color:var(--accent)}
details[open]{background:#f6f8fa}
details.toc ol{columns:2;column-gap:28px}
details.toc li{margin:.15em 0}
details.toc li.lv3{margin-left:1.4em;font-size:.92em}
details.ans summary.ans-title{font-size:1.05em}
.doc-meta{display:grid;grid-template-columns:auto 1fr;gap:2px 14px;background:#f6f8fa;border:1px solid var(--line);border-radius:8px;padding:12px 16px;margin:0 0 1.2em}
.doc-meta dt{font-weight:700;color:var(--muted)}
.doc-meta dd{margin:0}
.doc-meta dd.wide{grid-column:1/-1}
.doc-footer{margin-top:2.4em;border-top:1px solid var(--line);padding-top:.8em;color:var(--muted);font-size:.9em}
.doc-footer .gen{font-size:.82em;opacity:.8}
.pn{display:flex;justify-content:space-between;gap:12px;margin-top:3em}
.pn a{border:1px solid var(--line);border-radius:8px;padding:8px 14px;text-decoration:none;background:#f6f8fa}
.pn a:hover{border-color:var(--accent);color:var(--accent)}
.todo{color:var(--muted)}
.k-作业{background:#fff3cd}.k-选读{background:#e7f0ff}.k-附录{background:#e6f4ea}
@media (max-width:1199px){.layout{grid-template-columns:var(--side-w) minmax(0,1fr)}.rail{display:none}}
@media (min-width:1200px){details.toc.toc-top{display:none}}
@media (max-width:1000px){.layout{display:block}.side{width:auto;border-right:0;border-bottom:1px solid var(--line)}}
@media print{.top,.side,.copybtn,.pn,.toc{display:none!important}.content{padding:0}body{font-size:12px}}
`;
const JS = `/* 增强脚本：被禁用时折叠/目录/跳转/高亮均不受影响 */
document.querySelectorAll('.copybtn').forEach(function (b) {
  b.addEventListener('click', function () {
    var code = b.parentNode.querySelector('code');
    if (navigator.clipboard) navigator.clipboard.writeText(code.innerText).then(function () {
      b.textContent = '已复制'; setTimeout(function () { b.textContent = '复制'; }, 1200);
    });
  });
});
window.addEventListener('beforeprint', function () {
  document.querySelectorAll('details').forEach(function (d) { d.setAttribute('open', ''); });
});
`;
main();