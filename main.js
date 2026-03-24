const $ = (id) => document.getElementById(id);

const EXAMPLE_1 = '整数Nと文字列Sが与えられます。Sを2回繰り返して連結させた文字列を出力してください。';
const EXAMPLE_2 = '整数Nと文字列Sが与えられます。Nを2倍して得られる整数を求めてください。';
const EXAMPLE_3 = '';
const EXAMPLE_4 = '';
const EXAMPLE_MIXED = '整数整N数Nとと文文字字列Sが与列Sがえ与らえられますれ。Sますを。2回繰Nりを2返して連倍結しさせたて文得字列をられる整出数力しをてく求だめてさください。い。';

const COLOR_OPTIONS = [
    ['#ff0000', '赤'],
    ['#0000ff', '青'],
    ['#40BA8D', '緑青'],
    ['#984ea3', '紫'],
    ['#ff7f00', '橙'],
    ['#4daf4a', '緑'],
    ['#a65628', '茶'],
    ['#f781bf', 'ピンク'],
    ['#17becf', '水色'],
    ['#cbd5e1', '薄灰'],
    ['#111111', '黒']
];
const COLOR_NAME = Object.fromEntries(COLOR_OPTIONS);


function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getMixedText() {
    return $('mixedEditor').innerText.replace(/\u00A0/g, '');
}

function setMixedText(text) {
    $('mixedEditor').textContent = text;
}

function getSources() {
    return [$('src1').value, $('src2').value, $('src3').value, $('src4').value];
}

function getColors() {
    return [$('color1').value, $('color2').value, $('color3').value, $('color4').value];
}

function applyThemeColors() {
    const colors = getColors();
    document.documentElement.style.setProperty('--c1', colors[0]);
    document.documentElement.style.setProperty('--c2', colors[1]);
    document.documentElement.style.setProperty('--c3', colors[2]);
    document.documentElement.style.setProperty('--c4', colors[3]);
    ['legend1', 'legend2', 'legend3', 'legend4'].forEach((id, i) => {
        const el = $(id);
        if (el) el.style.background = colors[i];
    });
    ['legendText1', 'legendText2', 'legendText3', 'legendText4'].forEach((id, i) => {
        const el = $(id);
        if (el) {
            el.style.color = colors[i];
            el.textContent = COLOR_NAME[colors[i]] || '色';
        }
    });
    updateAllColorPreviews();
}

function populateColorSelect(id, initial) {
    const sel = $(id);
    sel.innerHTML = '';
    for (const [value, label] of COLOR_OPTIONS) {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        if (value.toLowerCase() === initial.toLowerCase()) opt.selected = true;
        sel.appendChild(opt);
    }
}

function buildColorPicker(idx) {
    const sel = $(`color${idx}`);
    const menu = $(`pickerMenu${idx}`);
    menu.innerHTML = '';
    COLOR_OPTIONS.forEach(([value, label]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'colorOption';
        btn.innerHTML = `<span class="colorPreviewSwatch" style="background:${value}"></span><span style="color:${value};font-weight:700;">${label}</span>`;
        btn.addEventListener('click', () => {
            sel.value = value;
            updateColorPreview(idx);
            applyThemeColors();
            refreshHighlight(false);
            closeAllPickers();
        });
        menu.appendChild(btn);
    });

    $(`pickerBtn${idx}`).addEventListener('click', (e) => {
        e.stopPropagation();
        const wrap = $(`picker${idx}`);
        const willOpen = !wrap.classList.contains('open');
        closeAllPickers();
        if (willOpen) wrap.classList.add('open');
    });
}

function closeAllPickers() {
    [1, 2, 3, 4].forEach(i => {
        const el = $(`picker${i}`);
        if (el) el.classList.remove('open');
    });
}

function updateColorPreview(idx) {
    const value = $(`color${idx}`).value;
    const label = COLOR_NAME[value] || '色';
    $(`pickerSwatch${idx}`).style.background = value;
    $(`pickerLabel${idx}`).style.color = value;
    $(`pickerLabel${idx}`).textContent = label;
}

function updateAllColorPreviews() {
    [1, 2, 3, 4].forEach(updateColorPreview);
}


function renderMixed(mixed, classes) {
    if (!mixed.length) return '';
    let out = '';
    for (let i = 0; i < mixed.length; i++) {
        out += `<span class="token ${classes[i] || ''}" data-idx="${i}">${escapeHtml(mixed[i])}</span>`;
    }
    return out;
}

function getCaretOffset(root) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!root.contains(range.startContainer)) return null;
    const probe = range.cloneRange();
    probe.selectNodeContents(root);
    probe.setEnd(range.startContainer, range.startOffset);
    return probe.toString().length;
}

function setCaretOffset(root, offset) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    let remaining = Math.max(0, offset);

    function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const len = node.textContent.length;
            if (remaining <= len) {
                range.setStart(node, remaining);
                range.collapse(true);
                return true;
            }
            remaining -= len;
            return false;
        }
        for (const child of node.childNodes) {
            if (walk(child)) return true;
        }
        return false;
    }

    if (!walk(root)) {
        range.selectNodeContents(root);
        range.collapse(false);
    }
    selection.removeAllRanges();
    selection.addRange(range);
}

function encodeState(arr) {
    return arr.join('|');
}

function decodeState(key) {
    return key.split('|').map(Number);
}

function solveUniqueAssignment(mixed, sources) {
    const src = sources;
    const lens = src.map(s => s.length);
    const sumLens = lens.reduce((a, b) => a + b, 0);

    if (sumLens > mixed.length) {
        return { ok: false, assignment: null, message: `合計文字数が混合問題文より長いです` };
    }

    const spare = new Map();
    for (let i = 0; i < mixed.length; i++) {
        const ch = mixed[i];
        spare.set(ch, (spare.get(ch) || 0) + 1);
    }

    for (let t = 0; t < 4; t++) {
        for (let i = 0; i < lens[t]; i++) {
            const ch = src[t][i];
            const current = spare.get(ch) || 0;
            if (current === 0) {
                return { ok: false, assignment: null, message: `文字 '${ch}' が不足しています。` };
            }
            spare.set(ch, current - 1);
        }
    }

    const assignment = new Uint8Array(mixed.length);
    const visited = new Set();
    let bestProgress = 0;

    let steps = 0;
    const MAX_STEPS = 3000000;

    const useFastKey = mixed.length <= 4095 && lens.every(l => l <= 1023);

    function dfs(mix_i, p0, p1, p2, p3) {
        if (steps++ > MAX_STEPS) return false;

        const progress = p0 + p1 + p2 + p3;
        if (progress > bestProgress) bestProgress = progress;

        if (progress === sumLens) {
            return true;
        }
        if (mix_i === mixed.length) {
            return false;
        }

        let key;
        if (useFastKey) {
            key = p0 + p1 * 1024 + p2 * 1048576 + p3 * 1073741824 + mix_i * 1099511627776;
        } else {
            key = `${mix_i},${p0},${p1},${p2},${p3}`;
        }
        if (visited.has(key)) return false;

        const ch = mixed[mix_i];

        for (let t = 0; t < 4; t++) {
            let p;
            if (t === 0) p = p0;
            else if (t === 1) p = p1;
            else if (t === 2) p = p2;
            else p = p3;

            if (p < lens[t] && src[t][p] === ch) {
                assignment[mix_i] = t + 1;

                let ok;
                if (t === 0) ok = dfs(mix_i + 1, p0 + 1, p1, p2, p3);
                else if (t === 1) ok = dfs(mix_i + 1, p0, p1 + 1, p2, p3);
                else if (t === 2) ok = dfs(mix_i + 1, p0, p1, p2 + 1, p3);
                else ok = dfs(mix_i + 1, p0, p1, p2, p3 + 1);

                if (ok) return true;

                assignment[mix_i] = 0;
            }
        }

        if (spare.get(ch) > 0) {
            spare.set(ch, spare.get(ch) - 1);
            if (dfs(mix_i + 1, p0, p1, p2, p3)) return true;
            spare.set(ch, spare.get(ch) + 1);
        }

        visited.add(key);
        return false;
    }

    const success = dfs(0, 0, 0, 0, 0);

    if (success) {
        return { ok: true, assignment: assignment };
    } else {
        return { ok: false, assignment: null, message: `矛盾が発生しました (最良進捗: ${bestProgress}/${sumLens})` };
    }
}


function renderAssignmentMode(mixed, sources) {
    const nonEmpty = sources.filter(s => s.length > 0).length;
    if (nonEmpty === 0) return { classes: Array(mixed.length).fill(''), statusText: '', statusKind: '' };
    const result = solveUniqueAssignment(mixed, sources);
    if (!result.ok) {
        return {
            classes: Array(mixed.length).fill(''),
            statusText: result.message || '自動割当表示: 各文字を高々1つの問題へ割り当てる形では、入力された全問題文を最後まで実現できません。',
            statusKind: 'ng'
        };
    }
    return {
        classes: Array.from(result.assignment, x => x === 1 ? 'seg1' : x === 2 ? 'seg2' : x === 3 ? 'seg3' : x === 4 ? 'seg4' : ''),
        statusText: '自動割当表示: ヒューリスティックに1つの割当を構成して表示しています。',
        statusKind: 'ok'
    };
}

function recomputeAssignmentRender() {
    return renderAssignmentMode(getMixedText(), getSources());
}

function refreshHighlight(preserveCaret = false) {
    const editor = $('mixedEditor');
    const mixed = getMixedText();
    const caret = preserveCaret ? getCaretOffset(editor) : null;
    applyThemeColors();

    const result = recomputeAssignmentRender();

    editor.innerHTML = renderMixed(mixed, result.classes);
    const status = $('statusText');
    status.textContent = result.statusText || '';
    status.classList.remove('ok', 'ng');
    if (result.statusKind) status.classList.add(result.statusKind);

    if (preserveCaret && caret !== null) {
        setCaretOffset(editor, Math.min(caret, mixed.length));
    }
}


function exportStateJson() {
    const state = {
        version: 1,
        mixedText: getMixedText(),
        sources: getSources(),
        colors: getColors(),
        assignmentRunMode: 'dynamic'
    };
    return JSON.stringify(state, null, 2);
}

function openJsonPanel(withText = '') {
    $('jsonOverlay').style.display = '';
    $('jsonArea').value = withText;
}

function closeJsonPanel() {
    $('jsonOverlay').style.display = 'none';
}

function importStateJson(raw) {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') throw new Error('JSONの形式が不正です。');

    const mixedText = typeof data.mixedText === 'string' ? data.mixedText : '';
    const sources = Array.isArray(data.sources) ? data.sources : [];
    const colors = Array.isArray(data.colors) ? data.colors : [];

    setMixedText(mixedText);
    ['src1', 'src2', 'src3', 'src4'].forEach((id, i) => {
        $(id).value = typeof sources[i] === 'string' ? sources[i] : '';
    });

    ['color1', 'color2', 'color3', 'color4'].forEach((id, i) => {
        if (typeof colors[i] === 'string') {
            const ok = COLOR_OPTIONS.some(([v]) => v.toLowerCase() === colors[i].toLowerCase());
            if (ok) $(id).value = colors[i];
        }
    });

    updateAllColorPreviews();
    applyThemeColors();

    refreshHighlight(false);
}

function clearHighlight() {
    const editor = $('mixedEditor');
    const text = getMixedText();
    const caret = getCaretOffset(editor);
    setMixedText(text);
    $('statusText').textContent = '';
    $('statusText').classList.remove('ok', 'ng');
    if (caret !== null) setCaretOffset(editor, Math.min(caret, text.length));
}

function loadExample() {
    $('src1').value = EXAMPLE_1;
    $('src2').value = EXAMPLE_2;
    $('src3').value = EXAMPLE_3;
    $('src4').value = EXAMPLE_4;
    setMixedText(EXAMPLE_MIXED);
    refreshHighlight(false);
}

populateColorSelect('color1', '#ff0000');
populateColorSelect('color2', '#0000ff');
populateColorSelect('color3', '#40BA8D');
populateColorSelect('color4', '#984ea3');
buildColorPicker(1);
buildColorPicker(2);
buildColorPicker(3);
buildColorPicker(4);

['src1', 'src2', 'src3', 'src4'].forEach((id) => {
    $(id).addEventListener('input', () => {
        refreshHighlight(false);
    });
});

document.addEventListener('click', () => closeAllPickers());

$('mixedEditor').addEventListener('input', () => {
    refreshHighlight(true);
});
$('exportBtn').addEventListener('click', () => {
    openJsonPanel(exportStateJson());
});
$('importBtn').addEventListener('click', () => {
    openJsonPanel('');
});
$('copyJsonBtn').addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText($('jsonArea').value);
        $('statusText').textContent = 'JSONをコピーしました。';
        $('statusText').classList.remove('ng');
        $('statusText').classList.add('ok');
    } catch (e) {
        $('statusText').textContent = 'コピーに失敗しました。手動でコピーしてください。';
        $('statusText').classList.remove('ok');
        $('statusText').classList.add('ng');
    }
});
$('applyJsonBtn').addEventListener('click', () => {
    try {
        importStateJson($('jsonArea').value);
        closeJsonPanel();
        $('statusText').textContent = 'JSONを読み込みました。';
        $('statusText').classList.remove('ng');
        $('statusText').classList.add('ok');
    } catch (e) {
        $('statusText').textContent = `JSONの読み込みに失敗しました: ${e.message}`;
        $('statusText').classList.remove('ok');
        $('statusText').classList.add('ng');
    }
});
$('closeJsonBtn').addEventListener('click', closeJsonPanel);
$('plainBtn').addEventListener('click', clearHighlight);
$('removeNewlineBtn').addEventListener('click', () => {
    let text = getMixedText();
    // \r\n, \n, \r に加え、Unicodeの行区切り文字 (\u2028) や段落区切り文字 (\u2029) にも対応
    text = text.replace(/[\r\n\u2028\u2029]+/g, '');
    setMixedText(text);
    refreshHighlight(false);
});
$('exampleBtn').addEventListener('click', () => {
    loadExample();
});

setMixedText('');
refreshHighlight(false);
