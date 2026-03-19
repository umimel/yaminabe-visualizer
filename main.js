const $ = (id) => document.getElementById(id);

    const EXAMPLE_1 = '文字列Sが与えられます。Sを2回繰り返して連結させた文字列を出力してください。';
    const EXAMPLE_2 = '正整数Nが与えられます。Nを2倍して得られる整数を求めてください。';
    const EXAMPLE_3 = '';
    const EXAMPLE_4 = '';
    const EXAMPLE_MIXED = '正文整数Nが与字え列らSがれ与まえられす。まNをす。Sを2回繰り2返倍ししてて得連結させらた文れる字列整を数を出力して求めくだてさください。い。';

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
      ['#111111', '黒']
    ];
    const COLOR_NAME = Object.fromEntries(COLOR_OPTIONS);

        let assignmentRunMode = 'dynamic';
    let cachedAssignment = null;

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
      ['legend1','legend2','legend3','legend4'].forEach((id, i) => {
        const el = $(id);
        if (el) el.style.background = colors[i];
      });
      ['legendText1','legendText2','legendText3','legendText4'].forEach((id, i) => {
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
      [1,2,3,4].forEach(i => {
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
      [1,2,3,4].forEach(updateColorPreview);
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
      const mix = mixed;
      const src = sources;
      const lens = [src[0].length, src[1].length, src[2].length, src[3].length];

      function makeNeedCounts() {
        const arr = new Array(4);
        for (let t = 0; t < 4; t++) {
          const mp = new Map();
          const s = src[t];
          for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            mp.set(ch, (mp.get(ch) || 0) + 1);
          }
          arr[t] = mp;
        }
        return arr;
      }

      function leftPackAssignment(assignment) {
        const packed = new Uint8Array(mix.length);
        const nextPos = new Uint16Array(4);
        for (let i = 0; i < mix.length; i++) {
          const owner = assignment[i];
          if (!owner) continue;
          const t = owner - 1;
          const p = nextPos[t];
          if (p < lens[t] && src[t][p] === mix[i]) {
            packed[i] = owner;
            nextPos[t] = p + 1;
          }
        }
        if (
          nextPos[0] === lens[0] &&
          nextPos[1] === lens[1] &&
          nextPos[2] === lens[2] &&
          nextPos[3] === lens[3]
        ) return packed;
        return assignment;
      }

      function refineAssignmentLeft(assignment) {
        let cur = assignment;
        for (let rep = 0; rep < 3; rep++) {
          const nxt = leftPackAssignment(cur);
          let same = true;
          for (let i = 0; i < cur.length; i++) {
            if (cur[i] !== nxt[i]) {
              same = false;
              break;
            }
          }
          cur = nxt;
          if (same) break;
        }
        return cur;
      }

      function runOneTrial(orderMode) {
        const assignment = new Uint8Array(mix.length);
        const pos = new Uint16Array(4);
        const remainingNeedTotal = new Uint16Array(lens);
        const remMixCount = new Map();
        for (let i = 0; i < mix.length; i++) {
          const ch = mix[i];
          remMixCount.set(ch, (remMixCount.get(ch) || 0) + 1);
        }
        const needCounts = makeNeedCounts();

        for (let i = 0; i < mix.length; i++) {
          const ch = mix[i];
          const remChAfter = (remMixCount.get(ch) || 0) - 1;
          remMixCount.set(ch, remChAfter);

          const can0 = pos[0] < lens[0] && src[0][pos[0]] === ch;
          const can1 = pos[1] < lens[1] && src[1][pos[1]] === ch;
          const can2 = pos[2] < lens[2] && src[2][pos[2]] === ch;
          const can3 = pos[3] < lens[3] && src[3][pos[3]] === ch;
          const demand = (can0 ? 1 : 0) + (can1 ? 1 : 0) + (can2 ? 1 : 0) + (can3 ? 1 : 0);

          let bestChoice = 0;
          let bestScore = -1e100;

          function evalChoice(choice) {
            let feasible = true;
            let needCh0 = (needCounts[0].get(ch) || 0) - (choice === 1 ? 1 : 0);
            let needCh1 = (needCounts[1].get(ch) || 0) - (choice === 2 ? 1 : 0);
            let needCh2 = (needCounts[2].get(ch) || 0) - (choice === 3 ? 1 : 0);
            let needCh3 = (needCounts[3].get(ch) || 0) - (choice === 4 ? 1 : 0);
            if (needCh0 > remChAfter || needCh1 > remChAfter || needCh2 > remChAfter || needCh3 > remChAfter) feasible = false;
            if (!feasible) return;

            let score = 0;
            let p0 = pos[0], p1 = pos[1], p2 = pos[2], p3 = pos[3];

            if (choice !== 0) {
              const t = choice - 1;
              if (t === 0) p0++;
              else if (t === 1) p1++;
              else if (t === 2) p2++;
              else p3++;

              const remainingNeed = remainingNeedTotal[t] - 1;
              score += 1000;
              score -= remainingNeed * 0.05;
              score += (5 - demand) * 10;

              let needChAfter = choice === 1 ? needCh0 : choice === 2 ? needCh1 : choice === 3 ? needCh2 : needCh3;
              score += (remChAfter - needChAfter) * 0.2;
              score -= remainingNeed * 0.02;
              score -= t * 0.001;
            } else {
              score -= demand * 20;
            }

            const completed = p0 + p1 + p2 + p3;
            let mn = p0, mx = p0;
            if (p1 < mn) mn = p1; if (p1 > mx) mx = p1;
            if (p2 < mn) mn = p2; if (p2 > mx) mx = p2;
            if (p3 < mn) mn = p3; if (p3 > mx) mx = p3;
            score += completed * 0.01;
            score -= (mx - mn) * 0.03;

            if (score > bestScore) {
              bestScore = score;
              bestChoice = choice;
            }
          }

          // preserve previous priority variants without array allocations
          if (orderMode === 0) {
            evalChoice(0);
            if (can0) evalChoice(1);
            if (can1) evalChoice(2);
            if (can2) evalChoice(3);
            if (can3) evalChoice(4);
          } else if (orderMode === 1) {
            if (can3) evalChoice(4);
            if (can2) evalChoice(3);
            if (can1) evalChoice(2);
            if (can0) evalChoice(1);
            evalChoice(0);
          } else if (orderMode === 2) {
            evalChoice(0);
            if (can1) evalChoice(2);
            if (can3) evalChoice(4);
            if (can0) evalChoice(1);
            if (can2) evalChoice(3);
          } else {
            evalChoice(0);
            if (can2) evalChoice(3);
            if (can0) evalChoice(1);
            if (can3) evalChoice(4);
            if (can1) evalChoice(2);
          }

          if (bestChoice !== 0) {
            const t = bestChoice - 1;
            assignment[i] = bestChoice;
            pos[t] += 1;
            remainingNeedTotal[t] -= 1;
            const prev = needCounts[t].get(ch) || 0;
            if (prev <= 1) needCounts[t].delete(ch);
            else needCounts[t].set(ch, prev - 1);
          }
        }

        const ok =
          pos[0] === lens[0] &&
          pos[1] === lens[1] &&
          pos[2] === lens[2] &&
          pos[3] === lens[3];
        const progress = pos[0] + pos[1] + pos[2] + pos[3];
        return { ok, assignment, progress };
      }

      let best = null;
      for (let mode = 0; mode < 4; mode++) {
        const res = runOneTrial(mode);
        if (
          !best ||
          (Number(res.ok) > Number(best.ok)) ||
          (res.ok === best.ok && res.progress > best.progress)
        ) {
          best = res;
        }
      }

      if (best.ok) {
        return { ok: true, assignment: refineAssignmentLeft(best.assignment) };
      }
      return {
        ok: false,
        assignment: null,
        message: `ヒューリスティック自動割当: 完全な割当は見つかりませんでした。現在の最良進捗は ${best.progress} 文字分です。`
      };
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

    function cacheSignature() {
      return JSON.stringify({ mixed: getMixedText(), sources: getSources() });
    }

    function recomputeAssignmentRender() {
      cachedAssignment = {
        signature: cacheSignature(),
        result: renderAssignmentMode(getMixedText(), getSources())
      };
      return cachedAssignment.result;
    }


    function setAssignmentRunMode(mode) {
      assignmentRunMode = mode;
      $('runDynamicBtn').classList.toggle('active', mode === 'dynamic');
      $('runStaticBtn').classList.toggle('active', mode === 'static');
      $('runAssignBtn').style.display = (mode === 'static') ? '' : 'none';
    }

    function refreshHighlight(preserveCaret = false) {
      const editor = $('mixedEditor');
      const mixed = getMixedText();
      const caret = preserveCaret ? getCaretOffset(editor) : null;
      applyThemeColors();

      let result;
      if (assignmentRunMode === 'dynamic') {
        result = recomputeAssignmentRender();
      } else {
        const sig = cacheSignature();
        if (cachedAssignment && cachedAssignment.signature === sig) {
          result = cachedAssignment.result;
        } else if (cachedAssignment) {
          result = {
            classes: cachedAssignment.result.classes.slice(),
            statusText: '静的モード: 入力が変更されました。現在は前回の色付けを表示中です。「自動割当を実行」を押すと更新します。',
            statusKind: ''
          };
        } else {
          result = {
            classes: Array(mixed.length).fill(''),
            statusText: '静的モード: 「自動割当を実行」を押すと自動割当を計算します。',
            statusKind: ''
          };
        }
      }

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
        assignmentRunMode
      };
      return JSON.stringify(state, null, 2);
    }

    function openJsonPanel(withText = '') {
      $('jsonPanel').style.display = '';
      $('jsonArea').value = withText;
    }

    function closeJsonPanel() {
      $('jsonPanel').style.display = 'none';
    }

    function importStateJson(raw) {
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') throw new Error('JSONの形式が不正です。');

      const mixedText = typeof data.mixedText === 'string' ? data.mixedText : '';
      const sources = Array.isArray(data.sources) ? data.sources : [];
      const colors = Array.isArray(data.colors) ? data.colors : [];

      setMixedText(mixedText);
      ['src1','src2','src3','src4'].forEach((id, i) => {
        $(id).value = typeof sources[i] === 'string' ? sources[i] : '';
      });

      ['color1','color2','color3','color4'].forEach((id, i) => {
        if (typeof colors[i] === 'string') {
          const ok = COLOR_OPTIONS.some(([v]) => v.toLowerCase() === colors[i].toLowerCase());
          if (ok) $(id).value = colors[i];
        }
      });

      updateAllColorPreviews();
      applyThemeColors();

      if (data.assignmentRunMode === 'static' || data.assignmentRunMode === 'dynamic') {
        setAssignmentRunMode(data.assignmentRunMode);
      }
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

    function invalidateAssignmentCache() {
      cachedAssignment = null;
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
        if (assignmentRunMode === 'dynamic') invalidateAssignmentCache();
        refreshHighlight(false);
      });
    });

    document.addEventListener('click', () => closeAllPickers());

    $('mixedEditor').addEventListener('input', () => {
      if (assignmentRunMode === 'dynamic') invalidateAssignmentCache();
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
    $('exampleBtn').addEventListener('click', () => {
      invalidateAssignmentCache();
      loadExample();
    });
    $('runDynamicBtn').addEventListener('click', () => {
      setAssignmentRunMode('dynamic');
      refreshHighlight(false);
    });
    $('runStaticBtn').addEventListener('click', () => {
      setAssignmentRunMode('static');
      refreshHighlight(false);
    });
    $('runAssignBtn').addEventListener('click', () => {
      recomputeAssignmentRender();
      refreshHighlight(false);
    });

    setMixedText('');
    setAssignmentRunMode('dynamic');
    refreshHighlight(false);
