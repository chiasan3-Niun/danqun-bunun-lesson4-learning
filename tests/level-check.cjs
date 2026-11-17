const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const html = read('index.html');
const storageKey = 'danqun-bunun-stage1-lesson4-progress';
const modules = ['vocabulary', 'sentences', 'listening', 'culture'];
const levels = ['word-mole', 'listen-match', 'sentence-order', 'greeting-challenge'];

function openPage(stored = new Map()) {
  const document = { activeElement: null };
  class Element {
    children = [];
    attributes = {};
    listeners = {};
    textContent = '';
    disabled = false;
    constructor(tagName) { this.tagName = tagName; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    addEventListener(name, handler) { this.listeners[name] = handler; }
    focus() { if (!this.disabled) document.activeElement = this; }
  }
  const elements = new Map();
  for (const [, tag, attrs, id] of html.matchAll(/<([\w-]+)\b([^>]*\bid="([^"]+)"[^>]*)>/g)) {
    const node = new Element(tag);
    for (const [, name, value] of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) node.setAttribute(name, value);
    node.hidden = /\bhidden\b/.test(attrs);
    elements.set(id, node);
  }
  document.getElementById = (id) => elements.get(id);
  document.createElement = (tag) => new Element(tag);
  const context = vm.createContext({
    document,
    localStorage: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value)
    }
  });
  for (const [, script] of html.matchAll(/<script defer src="([^"]+)"/g)) {
    vm.runInContext(read(script), context, { filename: script });
  }
  const run = (call) => vm.runInContext(call, context);
  return { run, document, get: document.getElementById, data: context.lesson4Data };
}

const nodes = (node) => [node, ...node.children.flatMap(nodes)];
const contents = (node) => nodes(node).map((child) => child.textContent).join(' ');
const buttons = (node) => nodes(node).filter(({ tagName }) => tagName === 'button');
function click(node, name) {
  const button = buttons(node).find(({ textContent }) => textContent === name);
  assert.ok(button && !button.disabled, `Expected available button: ${name}`);
  button.listeners.click();
}

function checkedPage(stored) {
  const page = openPage(stored);
  assert.equal(page.run('typeof startLevel'), 'function', 'Task 3 must expose the game entry point');
  return page;
}

function study() {
  return new Map([[storageKey, JSON.stringify({ completedStudyModules: modules })]]);
}

function playTo(page, target) {
  for (const level of levels.slice(0, levels.indexOf(target))) {
    page.run(`startLevel(${JSON.stringify(level)})`);
    const questions = page.data.questions.filter(({ levelId }) => levelId === level);
    for (const [index, { id, answer }] of questions.entries()) {
      const result = page.run(`submitAnswer(${JSON.stringify(id)}, ${JSON.stringify(answer)})`);
      assert.equal(result.isCorrect, true);
      if (index < questions.length - 1) click(page.get('feedback-actions'), '下一題');
    }
  }
  page.run(`startLevel(${JSON.stringify(target)})`);
}

test('level buttons and direct entry obey study and sequential passage gates', () => {
  const page = checkedPage();
  for (const name of ['submitAnswer', 'renderWhackAMole', 'renderListeningRound', 'renderSentenceOrder', 'renderCultureChallenge']) {
    assert.equal(page.run(`typeof ${name}`), 'function');
  }
  assert.ok(levels.every((id) => buttons(page.get(id))[0].disabled));
  page.run('startLevel("word-mole")');
  assert.equal(page.get('game-area').hidden, true);
  for (const id of modules.slice(0, 3)) page.run(`completeStudyModule(${JSON.stringify(id)})`);
  assert.equal(buttons(page.get('word-mole'))[0].disabled, true);
  page.run('completeStudyModule("culture")');
  assert.equal(buttons(page.get('word-mole'))[0].disabled, false);
  page.run('startLevel("listen-match")');
  assert.equal(page.get('game-area').hidden, true);
  buttons(page.get('word-mole'))[0].listeners.click();
  assert.equal(page.get('game-area').hidden, false);
  assert.match(page.get('game-question').textContent, /是誰/);
  assert.equal(page.get('game-question').attributes.tabindex, '-1');
  assert.equal(buttons(page.get('word-mole'))[0].attributes['aria-controls'], 'game-area');
  assert.equal(page.run('submitAnswer("pronouns-1", "ainkun").accepted'), false);
});

test('wrong answers keep the question, show a reason, and let learners retry', () => {
  const page = checkedPage(study());
  playTo(page, 'word-mole');
  const game = page.get('game-content');
  assert.ok(buttons(game).every((button) => button.type === 'button'));
  click(game, 'tama');
  assert.match(contents(page.get('feedback-result')), /答錯.*教材把 simaq/);
  assert.equal(page.document.activeElement, page.get('feedback-area'));
  assert.equal(page.get('feedback-area').attributes.tabindex, '-1');
  assert.equal(page.get('feedback-area').attributes['aria-describedby'], 'feedback-result');
  assert.equal(buttons(page.get('listen-match'))[0].disabled, true);
  assert.equal(page.run('submitAnswer("meaning-1", "simaq").accepted'), false);
  click(page.get('feedback-actions'), '重試這一題');
  assert.equal(page.document.activeElement, page.get('game-question'));
  assert.match(page.get('game-question').textContent, /是誰/);
  assert.equal(page.run('submitAnswer("meaning-1", "simaq").isCorrect'), true);
  assert.match(contents(page.get('feedback-result')), /答對/);
  assert.equal(page.document.activeElement, page.get('feedback-area'));
  click(page.get('feedback-actions'), '下一題');
  assert.match(page.get('game-question').textContent, /他們/);
});

test('only a full pass unlocks and saves the next level', () => {
  const stored = study();
  const page = checkedPage(stored);
  playTo(page, 'word-mole');
  assert.equal(page.run('submitAnswer("meaning-1", "simaq").levelPassed'), false);
  assert.equal(buttons(page.get('listen-match'))[0].disabled, true);
  click(page.get('feedback-actions'), '下一題');
  assert.equal(page.run('submitAnswer("pronouns-1", "ainkun").levelPassed'), true);
  assert.equal(buttons(page.get('listen-match'))[0].disabled, false);
  assert.equal(buttons(page.get('sentence-order'))[0].disabled, true);
  assert.match(contents(page.get('feedback-result')), /已過關/);
  assert.equal(buttons(openPage(stored).get('listen-match'))[0].disabled, false);
  click(page.get('feedback-actions'), '下一關：聽音找句');
  assert.match(page.get('game-title').textContent, /聽音找句/);
  assert.equal(page.document.activeElement, page.get('game-question'));
});

test('generated dialect audio remains visibly pending confirmation while text answers remain available', () => {
  const page = checkedPage(study());
  playTo(page, 'listen-match');
  assert.match(contents(page.get('game-content')), /丹群.*文字理解/);
  assert.equal(buttons(page.get('game-content')).some(({ textContent }) => /播放丹群音檔/.test(textContent)), true);
  click(page.get('game-content'), 'Simaq aipun?');
  assert.match(contents(page.get('feedback-result')), /答對.*丹群音檔/);
  assert.doesNotMatch(contents(page.get('feedback-result')), /通過聽力|聽辨已達成/);
  assert.equal(buttons(page.get('sentence-order'))[0].disabled, false);
});

test('sentence tiles preserve the source text and allow undo, checking, and retry', () => {
  const page = checkedPage(study());
  playTo(page, 'sentence-order');
  const game = page.get('game-content');
  const source = page.data.sentences.find(({ id }) => id === 'sentence-7');
  const tiles = buttons(game).slice(0, 3);
  assert.deepEqual(tiles.map(({ textContent }) => textContent).sort(), source.text.split(' ').sort());
  assert.ok(buttons(game).every(({ type }) => type === 'button'));
  const submit = buttons(game).find(({ textContent }) => textContent === '送出排序');
  assert.equal(submit.disabled, true);
  click(game, 'tama.');
  assert.equal(tiles.find(({ textContent }) => textContent === 'tama.').disabled, true);
  assert.ok(tiles.includes(page.document.activeElement) && !page.document.activeElement.disabled);
  click(game, '撤回最後一塊');
  assert.equal(tiles.find(({ textContent }) => textContent === 'tama.').disabled, false);
  for (const token of ['tama.', 'Inaak', 'aipun']) click(game, token);
  assert.equal(page.document.activeElement, submit);
  click(game, '送出排序');
  assert.match(contents(page.get('feedback-result')), /答錯/);
  assert.equal(buttons(page.get('greeting-challenge'))[0].disabled, true);
  click(page.get('feedback-actions'), '重試這一題');
  for (const token of source.text.split(' ')) click(game, token);
  click(game, '送出排序');
  assert.match(contents(page.get('feedback-result')), /答對/);
  assert.equal(buttons(page.get('greeting-challenge'))[0].disabled, false);
});

test('the last challenge preserves the greeting context and completes the map', () => {
  const page = checkedPage(study());
  playTo(page, 'greeting-challenge');
  assert.match(page.get('game-question').textContent, /晚輩無緣無故直接問長輩/);
  click(page.get('game-content'), '合宜');
  assert.match(contents(page.get('feedback-result')), /答錯.*晚輩無故直問長輩.*長輩向晚輩/);
  click(page.get('feedback-actions'), '重試這一題');
  click(page.get('game-content'), '不合宜');
  assert.match(contents(page.get('feedback-result')), /四關皆已完成/);
  click(page.get('feedback-actions'), '回到關卡地圖');
  assert.equal(page.document.activeElement, buttons(page.get('greeting-challenge'))[0]);
});

test('saved passage must be consecutive and backed by completed study', () => {
  const stored = study();
  stored.set(storageKey, JSON.stringify({ completedStudyModules: modules, passedLevels: ['listen-match'] }));
  assert.equal(buttons(checkedPage(stored).get('sentence-order'))[0].disabled, true);
  stored.set(storageKey, JSON.stringify({ completedStudyModules: ['vocabulary'], passedLevels: levels }));
  assert.ok(levels.every((id) => buttons(checkedPage(stored).get(id))[0].disabled));
});

function passWordLevelWithMistakes(page) {
  playTo(page, 'word-mole');
  for (const option of ['tama', "tais'aan"]) {
    click(page.get('game-content'), option);
    click(page.get('feedback-actions'), '重試這一題');
  }
  click(page.get('game-content'), 'simaq');
  click(page.get('feedback-actions'), '下一題');
  click(page.get('game-content'), 'ainkun');
}

test('Task 4 saves each accepted attempt, including retries, and restores the history', () => {
  const stored = study();
  const page = openPage(stored);
  playTo(page, 'word-mole');
  click(page.get('game-content'), 'tama');
  assert.equal(page.run('submitAnswer("meaning-1", "simaq").accepted'), false);
  assert.equal(page.run('submitAnswer("pronouns-1", "ainkun").accepted'), false);
  click(page.get('feedback-actions'), '重試這一題');
  click(page.get('game-content'), 'simaq');
  const attempts = [
    { questionId: 'meaning-1', isCorrect: false, answer: 'tama' },
    { questionId: 'meaning-1', isCorrect: true }
  ];
  assert.deepEqual(JSON.parse(stored.get(storageKey)).attempts, attempts);
  const reopened = openPage(stored);
  assert.deepEqual(JSON.parse(reopened.run('JSON.stringify(loadProgress().attempts)')), attempts);
  assert.equal(reopened.run('recordAttempt("pronouns-1", false)'), undefined);
  assert.equal(JSON.parse(stored.get(storageKey)).attempts.length, 3);
});

test('Task 4 reports all five knowledge points, with a weakness after two errors in the same point', () => {
  const page = openPage(study());
  passWordLevelWithMistakes(page);
  assert.equal(page.run('typeof buildDiagnostics'), 'function');
  const readDiagnostics = () => JSON.parse(page.run(`JSON.stringify(buildDiagnostics(loadProgress()).map(
    ({ id, correct, wrong, accuracy, isWeak }) => [id, correct, wrong, accuracy, isWeak]))`));
  assert.deepEqual(readDiagnostics(), [
    ['word-meaning', 1, 2, 1 / 3, true],
    ['pronouns', 1, 0, 1, false],
    ['sentence-pattern', 0, 0, null, false],
    ['listening', 0, 0, null, false],
    ['culture', 0, 0, null, false]
  ]);
  page.run('recordAttempt("pronouns-1", false)');
  assert.deepEqual(readDiagnostics()[1], ['pronouns', 1, 1, 1 / 2, false]);
  assert.match(contents(page.get('diagnostics-summary')), /詞義.*33%.*代名詞.*100%.*句型.*尚未作答.*聽辨.*尚未作答.*文化.*尚未作答/);
});

test('Task 4 builds a repair queue and lets learners review the linked module with keyboard focus', () => {
  const stored = study();
  const page = openPage(stored);
  passWordLevelWithMistakes(page);
  const queue = page.get('repair-queue');
  assert.ok(queue, 'Expected a repair queue after a level');
  assert.match(contents(queue), /詞義.*2.*是誰.*詞語卡/);
  assert.doesNotMatch(contents(queue), /代名詞|重測「詞義」/);
  click(page.get('feedback-actions'), '查看學習結果');
  assert.equal(page.document.activeElement, page.get('results-title'));
  click(queue, '複習「詞語卡」');
  assert.match(page.get('study-module-title').textContent, /詞語卡/);
  assert.equal(page.document.activeElement, page.get('study-module-title'));
  click(page.get('study-repair'), '標記已複習「詞義」');
  assert.equal(page.document.activeElement, page.get('results-title'));
  assert.match(contents(queue), /已複習.*重測「詞義」/);
  assert.match(contents(openPage(stored).get('repair-queue')), /已複習.*重測「詞義」/);
});

test('Task 4 keeps visible results current as the learner answers in a later level', () => {
  const page = openPage(study());
  playTo(page, 'listen-match');
  const summary = page.get('diagnostics-summary');
  assert.match(contents(summary), /聽辨（丹群音檔）.*尚未作答/);
  click(page.get('game-content'), 'Simaq aas?');
  assert.match(contents(summary), /聽辨（丹群音檔）.*0%/);
  assert.doesNotMatch(contents(page.get('repair-queue')), /聽辨/);
  click(page.get('feedback-actions'), '重試這一題');
  click(page.get('game-content'), 'Simaq ainkun?');
  assert.match(contents(page.get('repair-queue')), /聽辨.*2.*聽讀卡/);
});

test('Task 4 retests only the reviewed weak point and resolves it without erasing history', () => {
  const stored = study();
  const page = openPage(stored);
  passWordLevelWithMistakes(page);
  const queue = page.get('repair-queue');
  assert.ok(queue, 'Expected a repair queue before retesting');
  click(queue, '複習「詞語卡」');
  click(page.get('study-repair'), '標記已複習「詞義」');
  click(queue, '重測「詞義」');
  assert.equal(page.document.activeElement, page.get('game-question'));
  assert.match(page.get('game-question').textContent, /1 \/ 1.*是誰/);
  assert.equal(page.run('submitAnswer("pronouns-1", "ainkun").accepted'), false);
  click(page.get('game-content'), 'tama');
  click(page.get('feedback-actions'), '查看補強結果');
  assert.equal(page.document.activeElement, page.get('results-title'));
  assert.match(contents(queue), /詞義.*3.*重測「詞義」/);
  click(queue, '重測「詞義」');
  click(page.get('game-content'), 'simaq');
  click(page.get('feedback-actions'), '查看補強結果');
  assert.doesNotMatch(contents(queue), /重測「詞義」/);
  const reopened = openPage(stored);
  assert.doesNotMatch(contents(reopened.get('repair-queue')), /重測「詞義」/);
  assert.match(contents(reopened.get('diagnostics-summary')), /詞義.*40%/);
  const saved = JSON.parse(stored.get(storageKey));
  assert.deepEqual(saved.passedLevels, ['word-mole']);
  assert.equal(saved.attempts.length, 6);

  playTo(reopened, 'word-mole');
  click(reopened.get('game-content'), 'tama');
  click(reopened.get('feedback-actions'), '重試這一題');
  click(reopened.get('game-content'), 'tama');
  click(reopened.get('feedback-actions'), '重試這一題');
  click(reopened.get('game-content'), 'simaq');
  click(reopened.get('feedback-actions'), '下一題');
  click(reopened.get('game-content'), 'ainkun');
  assert.match(contents(reopened.get('repair-queue')), /詞義.*2.*複習「詞語卡」/);
  assert.doesNotMatch(contents(reopened.get('repair-queue')), /重測「詞義」/);
});

test('Task 4 uses a correct rationale and a specific error explanation in feedback', () => {
  const page = openPage(study());
  assert.equal(page.run('typeof renderFeedback'), 'function');
  playTo(page, 'word-mole');
  const feedback = page.get('feedback-result');
  for (const [option, explanation] of [['tama', /tama.*爸爸/], ["tais'aan", /tais'aan.*親友/]]) {
    click(page.get('game-content'), option);
    assert.match(contents(feedback), /答錯.*詞義.*教材把 simaq.*是誰/);
    assert.match(contents(feedback), explanation);
    assert.match(contents(feedback), /詞語卡/);
    click(page.get('feedback-actions'), '重試這一題');
  }
  click(page.get('game-content'), 'simaq');
  assert.match(contents(feedback), /答對.*詞義.*教材把 simaq.*是誰/);
  assert.doesNotMatch(contents(feedback), /爸爸|親友/);
});

test('Task 4 represents every existing distractor, including the text-only and ordering questions', () => {
  const page = openPage(study());
  for (const [level, questionId, wrongAnswers, knowledge, module, reason] of [
    ['word-mole', 'pronouns-1', [['aipun', /aipun.*他／她/], ['aas', /aas.*你/]], /代名詞/, /詞語卡/, /ainkun.*他們/],
    ['listen-match', 'listen-1', [['Simaq aas?', /Simaq aas\?.*你是誰/], ['Simaq ainkun?', /Simaq ainkun\?.*他們是誰/]], /聽辨.*丹群音檔/, /聽讀卡/, /Simaq aipun\?.*他是誰/],
    ['sentence-order', 'order-1', [['tama. Inaak aipun', /第 1 個詞塊.*tama\..*教材是「Inaak」/]], /句型/, /句型卡/, /教材原句先放 Inaak/],
    ['greeting-challenge', 'culture-1', [['合宜', /長輩向晚輩.*長幼方向/]], /文化/, /問候倫理/, /晚輩無故直問長輩.*不禮貌/]
  ]) {
    playTo(page, level);
    if (questionId === 'pronouns-1') {
      click(page.get('game-content'), 'simaq');
      click(page.get('feedback-actions'), '下一題');
    }
    for (const [option, wrongReason] of wrongAnswers) {
      page.run(`submitAnswer(${JSON.stringify(questionId)}, ${JSON.stringify(option)})`);
      const feedback = contents(page.get('feedback-result'));
      for (const expected of [knowledge, module, reason, wrongReason]) assert.match(feedback, expected);
      click(page.get('feedback-actions'), '重試這一題');
    }
  }
  click(page.get('game-content'), '不合宜');
  assert.match(page.get('results-title').textContent, /全課/);
  assert.match(contents(page.get('diagnostics-summary')), /聽辨（丹群音檔）/);
});

test('Review 1 lists retest prompts and the saved choices for each missed question', () => {
  const stored = study();
  const saved = JSON.parse(stored.get(storageKey));
  const legacyAttempt = { questionId: 'meaning-1', isCorrect: false };
  saved.attempts = [legacyAttempt];
  stored.set(storageKey, JSON.stringify(saved));
  passWordLevelWithMistakes(openPage(stored));

  const queue = contents(openPage(stored).get('repair-queue'));
  assert.match(queue, /重測題目.*哪一個詞的意思是「是誰」？/);
  assert.match(queue, /你選了「tama」。.*爸爸/);
  assert.match(queue, /你選了「tais'aan」。.*親友/);
  assert.match(queue, /舊作答未記錄所選答案/);
  assert.doesNotMatch(queue, /哪一個代名詞/);
  assert.deepEqual(JSON.parse(stored.get(storageKey)).attempts, [
    legacyAttempt,
    { questionId: 'meaning-1', isCorrect: false, answer: 'tama' },
    { questionId: 'meaning-1', isCorrect: false, answer: "tais'aan" },
    { questionId: 'meaning-1', isCorrect: true },
    { questionId: 'pronouns-1', isCorrect: true }
  ]);
});

test('Review 1 reports the actual positions for two wrong orders in feedback and the repair queue', () => {
  const stored = study();
  const page = openPage(stored);
  playTo(page, 'sentence-order');
  const wrongOrders = [
    { tiles: ['tama.', 'aipun', 'Inaak'], mismatch: /第 1 個詞塊排成「tama\.」，教材是「Inaak」.*第 3 個詞塊排成「Inaak」，教材是「tama\.」/, matchedPosition: 2 },
    { tiles: ['Inaak', 'tama.', 'aipun'], mismatch: /第 2 個詞塊排成「tama\.」，教材是「aipun」.*第 3 個詞塊排成「aipun」，教材是「tama\.」/, matchedPosition: 1 }
  ];
  for (const { tiles, mismatch, matchedPosition } of wrongOrders) {
    for (const tile of tiles) click(page.get('game-content'), tile);
    click(page.get('game-content'), '送出排序');
    const feedback = contents(page.get('feedback-result'));
    assert.match(feedback, mismatch);
    assert.doesNotMatch(feedback, new RegExp(`第 ${matchedPosition} 個詞塊排成`));
    click(page.get('feedback-actions'), '重試這一題');
  }
  const queue = contents(openPage(stored).get('repair-queue'));
  assert.match(queue, /重測題目.*把「他是我的爸爸。」的教材詞塊排成一句話/);
  for (const { mismatch } of wrongOrders) assert.match(queue, mismatch);
});

test('Review 1 defers a reviewed retest and resumes the current ordinary question', () => {
  const stored = study();
  const page = openPage(stored);
  passWordLevelWithMistakes(page);
  const queue = page.get('repair-queue');
  click(queue, '複習「詞語卡」');
  click(page.get('study-repair'), '標記已複習「詞義」');

  click(page.get('word-mole'), '詞語打地鼠（已過關，可重玩）');
  click(page.get('game-content'), 'simaq');
  click(page.get('feedback-actions'), '下一題');
  const question = page.get('game-question');
  const getRetestButton = () => buttons(queue).find(({ textContent }) => textContent === '重測「詞義」');
  assert.match(question.textContent, /2 \/ 2.*他們/);
  page.run('startRetest("word-meaning")');
  assert.match(question.textContent, /2 \/ 2.*他們/);
  assert.equal(getRetestButton().disabled, true);
  assert.match(contents(queue), /完成目前關卡後可重測/);
  click(queue, '回到目前關卡');
  assert.equal(page.document.activeElement, question);
  click(page.get('game-content'), 'ainkun');
  assert.equal(getRetestButton().disabled, false);
  assert.deepEqual(JSON.parse(stored.get(storageKey)).attempts.slice(-2), [
    { questionId: 'meaning-1', isCorrect: true },
    { questionId: 'pronouns-1', isCorrect: true }
  ]);
  click(queue, '重測「詞義」');
  assert.match(question.textContent, /1 \/ 1.*是誰/);
});
