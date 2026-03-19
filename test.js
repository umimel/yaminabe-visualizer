const fs = require('fs');

global.document = {
    getElementById: (id) => ({
        addEventListener: () => { },
        classList: { toggle: () => { }, add: () => { }, remove: () => { } },
        style: {},
        value: '',
        innerText: '',
        textContent: '',
        appendChild: () => { },
        innerHTML: ''
    }),
    documentElement: {
        style: { setProperty: () => { } }
    },
    addEventListener: () => { },
    createElement: () => ({
        appendChild: () => { },
        style: {},
        addEventListener: () => { }
    })
};
global.window = {
    getSelection: () => null
};

const code = fs.readFileSync('./main.js', 'utf8') + `
  global.EXAMPLE_1 = EXAMPLE_1;
  global.EXAMPLE_2 = EXAMPLE_2;
  global.EXAMPLE_3 = EXAMPLE_3;
  global.EXAMPLE_4 = EXAMPLE_4;
  global.EXAMPLE_MIXED = EXAMPLE_MIXED;
  global.solveUniqueAssignment = solveUniqueAssignment;
`;
eval(code);

function runTest() {
    console.log('=============================================');
    console.log('闇鍋Visualizer 自動割当アルゴリズム テスト');
    console.log('=============================================\n');

    const sources = [EXAMPLE_1, EXAMPLE_2, EXAMPLE_3, EXAMPLE_4];
    const mixed = EXAMPLE_MIXED;

    console.log('[入力データ]');
    console.log('混合問題文:', mixed);
    console.log('問題文1   :', sources[0]);
    console.log('問題文2   :', sources[1]);
    console.log('---------------------------------------------\n');

    console.log('割当処理を実行中...\n');
    const result = solveUniqueAssignment(mixed, sources);

    if (result.ok) {
        console.log('✅ テスト成功: 全ての文字が矛盾なく割り当てられました！\n');

        let visual = '';
        for (let i = 0; i < mixed.length; i++) {
            const owner = result.assignment[i];
            if (owner === 1) {
                visual += '\x1b[31m' + mixed[i] + '\x1b[0m';
            } else if (owner === 2) {
                visual += '\x1b[34m' + mixed[i] + '\x1b[0m';
            } else {
                visual += mixed[i];
            }
        }
        console.log('[復元結果 (赤: 問題文1, 青: 問題文2)]');
        console.log(visual);
        console.log('\n=============================================');
    } else {
        console.error('❌ テスト失敗: 割り当てが完了しませんでした。');
        console.error('メッセージ:', result.message);
        process.exit(1);
    }
}

try {
    runTest();
} catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
    process.exit(1);
}
