'use strict';

const storageKey = 'danqun-bunun-stage1-lesson4-progress';
const studyModules = [
  { id: 'vocabulary', title: '詞語卡', entries: lesson4Data.vocabulary },
  { id: 'sentences', title: '句型卡', entries: lesson4Data.sentences },
  { id: 'listening', title: '聽讀卡', entries: lesson4Data.sentences },
  { id: 'culture', title: '問候倫理', entries: lesson4Data.culture }
];
const studyModuleIds = studyModules.map(({ id }) => id);
const levelIds = lesson4Data.levels.map(({ id }) => id);

function expandAssessmentQuestions() {
  const existing = new Set(lesson4Data.questions.map((question) => question.id));
  const additions = [];
  const add = (question) => {
    if (!existing.has(question.id)) additions.push(question);
  };

  lesson4Data.vocabulary.forEach((entry, index) => {
    if (['simaq', 'ainkun'].includes(entry.term)) return;
    const distractors = [1, 2].map((offset) => lesson4Data.vocabulary[(index + offset) % lesson4Data.vocabulary.length]);
    add({
      id: `meaning-${entry.term}`,
      levelId: 'word-mole',
      knowledgePoint: entry.meaning.includes('我') || entry.meaning.includes('你') || entry.meaning.includes('他') ? 'pronouns' : 'word-meaning',
      prompt: `哪一個詞的意思是「${entry.meaning}」？`,
      options: [entry.term, ...distractors.map(({ term }) => term)],
      answer: entry.term,
      explanation: `教材把 ${entry.term} 解釋為「${entry.meaning}」。`,
      wrongExplanations: Object.fromEntries(distractors.map(({ term, meaning }) => [term, `${term} 的意思是「${meaning}」。`])),
      repairModule: 'vocabulary', sourceId: entry.sourceId, sourceNote: entry.sourceNote
    });
  });

  lesson4Data.sentences.forEach((entry, index) => {
    const distractors = [1, 2].map((offset) => lesson4Data.sentences[(index + offset) % lesson4Data.sentences.length]);
    add({
      id: `listen-${entry.id}`,
      levelId: 'listen-match', knowledgePoint: 'listening',
      prompt: `哪一句的意思是「${entry.translation}」？`,
      options: [entry.text, ...distractors.map(({ text }) => text)], answer: entry.text,
      explanation: `教材用 ${entry.text} 表達「${entry.translation}」。`,
      wrongExplanations: Object.fromEntries(distractors.map(({ text, translation }) => [text, `${text} 的意思是「${translation}」。`])),
      repairModule: 'listening', sourceId: entry.sourceId, sourceNote: entry.sourceNote, sentenceId: entry.id, mode: 'text-fallback'
    });
    if (entry.id !== 'sentence-7') {
      add({
        id: `order-${entry.id}`,
        levelId: 'sentence-order', knowledgePoint: 'sentence-pattern',
        prompt: `把「${entry.translation}」的教材詞塊排成一句話。`,
        options: entry.text.split(' '), answer: entry.text,
        explanation: `教材原句是「${entry.text}」。`, repairModule: 'sentences', sourceId: entry.sourceId, sourceNote: entry.sourceNote, sentenceId: entry.id
      });
    }
  });

  const sentenceFormulaFor = (text) => text.startsWith('Simaq ') && text.endsWith('?')
    ? '公式：Simaq + [代名詞主格]?'
    : text.endsWith('aak.')
      ? '公式：[名字/身分] + [代名詞主格 aak].'
      : text.includes(' tama.') || text.includes(" tais'aan.")
        ? '公式：[所有格/名字] + [代名詞 aipun/ainkun] + [關係稱謂].'
        : '';
  const sentenceWords = [...new Set(lesson4Data.sentences.flatMap(({ text }) =>
    text.split(' ').map((token) => token.replace(/[?.！。]$/, ''))
  ))];
  lesson4Data.sentences.forEach((entry, index) => {
    const tokens = entry.text.split(' ');
    const answer = tokens[tokens.length - 1].replace(/[?.！。]$/, '');
    add({
      id: `cloze-sentence-${entry.id}`,
      levelId: 'greeting-challenge', knowledgePoint: 'sentence-pattern',
      prompt: `${sentenceFormulaFor(entry.text)} 請依照圖片與公式，將下方詞塊拼成完整句子。`,
      options: [answer], answer, mode: 'sentence-cloze', sentenceText: entry.text,
      explanation: `教材原句是「${entry.text}」。`,
      wrongExplanations: {},
      repairModule: 'sentences', sourceId: entry.sourceId, sourceNote: entry.sourceNote, sentenceId: entry.id
    });
  });

  add({
    id: 'culture-2', levelId: 'greeting-challenge', knowledgePoint: 'culture',
    prompt: '公式：Simaq + [代名詞主格]? 請依照圖片與公式完成句子。', options: ['aipun'], answer: 'aipun', mode: 'sentence-cloze', sentenceText: 'Simaq aipun?',
    explanation: '教材句型例句是「Simaq aipun?」。', wrongExplanations: {},
    repairModule: 'culture', sourceId: '1-4-2', sourceNote: '第 2 頁', sentenceId: 'sentence-3'
  });
  add({
    id: 'culture-3', levelId: 'greeting-challenge', knowledgePoint: 'culture',
    prompt: '公式：Simaq + [代名詞主格]? 請依照圖片與公式完成句子。', options: ['ainkun'], answer: 'ainkun', mode: 'sentence-cloze', sentenceText: 'Simaq ainkun?',
    explanation: '教材句型例句是「Simaq ainkun?」。', wrongExplanations: {},
    repairModule: 'culture', sourceId: '1-4-2', sourceNote: '第 4 頁', sentenceId: 'sentence-5'
  });
  lesson4Data.questions.push(...additions);
}

expandAssessmentQuestions();
const questionsById = new Map(lesson4Data.questions.map((question) => [question.id, question]));
const audioAssetsById = new Map(lesson4Data.audioAssets.map((asset) => [asset.id, asset]));

/** @typedef {{ questionId: string, isCorrect: boolean, answer?: string }} Attempt */
/** @typedef {{ reviewed: boolean, resolvedThrough: number }} RepairState */
/** @typedef {{ completedStudyModules: string[], passedLevels: string[], attempts: Attempt[], repairs: Record<string, RepairState> }} ProgressState */
/** @typedef {{ id: string, title: string, correct: number, wrong: number, accuracy: number | null, isWeak: boolean, isReviewed: boolean, pendingWrong: number, mistakes: Map<object, Set<string | undefined>> }} Diagnostic */
/** @typedef {{ levelId?: string, repairPoint?: string, retestCorrect?: boolean, questions: object[], index: number, awaitingFeedback: boolean }} RoundState */
/** @typedef {{ accepted: false } | { accepted: true, question: object, answer: string, isCorrect: boolean, levelPassed: boolean }} AnswerResult */

/** @returns {ProgressState} */
function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved?.completedStudyModules)) {
      const completedStudyModules = studyModuleIds.filter((id) => saved.completedStudyModules.includes(id));
      const passedLevels = [];
      if (completedStudyModules.length === studyModuleIds.length && Array.isArray(saved.passedLevels)) {
        for (const id of levelIds) {
          if (!saved.passedLevels.includes(id)) break;
          passedLevels.push(id);
        }
      }
      const attempts = Array.isArray(saved.attempts) ? saved.attempts.filter((attempt) =>
        questionsById.has(attempt?.questionId) && typeof attempt.isCorrect === 'boolean'
      ) : [];
      const repairs = {};
      for (const { id } of lesson4Data.knowledgePoints) {
        const repair = saved.repairs?.[id];
        if (Number.isInteger(repair?.resolvedThrough) && repair.resolvedThrough >= 0 && repair.resolvedThrough <= attempts.length) {
          repairs[id] = { reviewed: repair.reviewed === true, resolvedThrough: repair.resolvedThrough };
        }
      }
      return { completedStudyModules, passedLevels, attempts, repairs };
    }
  } catch {
    // Start with empty progress if storage is unavailable or the saved value is invalid.
  }
  return { completedStudyModules: [], passedLevels: [], attempts: [], repairs: {} };
}

/** @param {ProgressState} progress */
function saveProgress(progress) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch {
    document.getElementById('storage-status').textContent = '瀏覽器無法保存進度，重新開啟後需重新標記。';
  }
}

const progress = loadProgress();

function isKnownWrongAnswer(question, answer) {
  if (typeof answer !== 'string' || answer === question.answer) return false;
  if (question.levelId !== 'sentence-order') return question.options.includes(answer);
  return answer.split(' ').sort().join(' ') === [...question.options].sort().join(' ');
}

function recordAttempt(questionId, isCorrect, answer = undefined) {
  const question = questionsById.get(questionId);
  if (!question || typeof isCorrect !== 'boolean') return;
  const attempt = { questionId, isCorrect };
  if (!isCorrect && isKnownWrongAnswer(question, answer)) attempt.answer = answer;
  progress.attempts.push(attempt);
  saveProgress(progress);
}

/** @param {ProgressState} progress @returns {Diagnostic[]} */
function buildDiagnostics(progress) {
  return lesson4Data.knowledgePoints.map(({ id, title }) => {
    const repair = progress.repairs[id];
    const resolvedThrough = repair?.resolvedThrough ?? 0;
    const mistakes = new Map();
    let correct = 0;
    let wrong = 0;
    let pendingWrong = 0;
    progress.attempts.forEach(({ questionId, isCorrect, answer }, index) => {
      const question = questionsById.get(questionId);
      if (question?.knowledgePoint !== id) return;
      if (isCorrect) {
        correct += 1;
      } else {
        wrong += 1;
        if (index >= resolvedThrough) {
          pendingWrong += 1;
          if (!mistakes.has(question)) mistakes.set(question, new Set());
          mistakes.get(question).add(isKnownWrongAnswer(question, answer) ? answer : undefined);
        }
      }
    });
    return {
      id, title, correct, wrong, pendingWrong,
      accuracy: correct + wrong ? correct / (correct + wrong) : null,
      isWeak: pendingWrong >= 2,
      isReviewed: repair?.reviewed === true,
      mistakes
    };
  });
}

const outline = document.getElementById('study-outline');
const moduleTitle = document.getElementById('study-module-title');
const content = document.getElementById('study-content');
const completionButton = document.getElementById('complete-study');
const studyRepair = document.getElementById('study-repair');
const gameArea = document.getElementById('game-area');
const gameTitle = document.getElementById('game-title');
const gameQuestion = document.getElementById('game-question');
const gameContent = document.getElementById('game-content');
const feedbackArea = document.getElementById('feedback-area');
const feedbackResult = document.getElementById('feedback-result');
const feedbackActions = document.getElementById('feedback-actions');
const statusMessage = document.getElementById('status-message');
const resultsArea = document.getElementById('results-area');
const resultsTitle = document.getElementById('results-title');
const repairOutcome = document.getElementById('repair-outcome');
const repairQueue = document.getElementById('repair-queue');
const resultsActions = document.getElementById('results-actions');
const outlineButtons = new Map();
const levelButtons = new Map();
const studyCursors = Object.fromEntries(studyModules.map(({ id }) => [id, 0]));
let activeModuleId = studyModuleIds[0];
/** @type {RoundState | null} */
let activeRound = null;
let autoPlayToken = 0;
let autoPlayActive = false;
let autoPlayAudio = null;
let autoPlayResolve = null;
let whackGameCleanup = null;
const lastOptionPositions = new Map();

function element(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function gameButton(text, onClick) {
  const button = element('button', text);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}

function shuffledAnswerOptions(question) {
  const options = [...question.options];
  for (let index = options.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
  }
  const previous = lastOptionPositions.get(question.levelId);
  const current = options.indexOf(question.answer);
  if (options.length > 1 && current === previous) {
    const swapIndex = current === options.length - 1 ? current - 1 : current + 1;
    [options[current], options[swapIndex]] = [options[swapIndex], options[current]];
  }
  lastOptionPositions.set(question.levelId, options.indexOf(question.answer));
  return options;
}

function imageAsset(src, alt, className = '') {
  const image = document.createElement('img');
  image.setAttribute('src', src);
  image.setAttribute('alt', alt);
  if (className) image.className = className;
  return image;
}

function audioAssetFor(entry) {
  return audioAssetsById.get(entry?.audioId);
}

function playMoleSound(isCorrect) {
  const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(isCorrect ? 660 : 220, now);
  if (isCorrect) oscillator.frequency.linearRampToValueAtTime(880, now + .12);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(.18, now + .02);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .18);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + .2);
  oscillator.addEventListener('ended', () => { void context.close(); }, { once: true });
}

function playVocabularyPronunciation(term) {
  if (typeof Audio !== 'function') return;
  const entry = lesson4Data.vocabulary.find(({ term: vocabularyTerm }) => vocabularyTerm === term);
  const asset = audioAssetFor(entry);
  if (!asset?.assetPath) return;
  const audio = new Audio(asset.assetPath);
  audio.playbackRate = .8;
  void audio.play().catch(() => {});
}

/** @param {string} assetPath @param {HTMLElement} trigger @returns {Promise<void>} */
async function playAudio(assetPath, trigger) {
  if (!assetPath) {
    trigger.setAttribute('data-audio-state', 'pending');
    trigger.textContent = '音檔待補';
    trigger.setAttribute('aria-label', '音檔待補，請先使用文字內容');
    return;
  }

  trigger.setAttribute('data-audio-state', 'loading');
  trigger.textContent = '播放中…';
  try {
    const audio = new Audio(assetPath);
    audio.playbackRate = 0.8;
    await audio.play();
    trigger.setAttribute('data-audio-state', 'played');
    trigger.textContent = '重新播放丹群音檔';
    trigger.setAttribute('aria-label', '重新播放官方丹群音檔');
  } catch {
    trigger.setAttribute('data-audio-state', 'error');
    trigger.textContent = '音檔播放失敗';
    trigger.setAttribute('aria-label', '音檔播放失敗，請先使用文字內容');
  }
}

function audioButtonFor(entry) {
  const asset = audioAssetFor(entry);
  const button = gameButton(asset?.assetPath ? '播放丹群音檔' : '音檔待補', () => {
    void playAudio(asset?.assetPath ?? '', button);
  });
  button.className = 'audio-control-button';
  button.setAttribute('data-audio-state', asset?.assetPath ? 'available' : 'pending');
  button.setAttribute('aria-label', asset?.assetPath
    ? `${entry.text ?? entry.term}：播放官方丹群音檔`
    : `${entry.text ?? entry.term}：音檔待補`);
  return button;
}

function stopAutoPlay(moduleId) {
  autoPlayToken += 1;
  autoPlayActive = false;
  if (autoPlayAudio) {
    autoPlayAudio.pause();
    autoPlayAudio = null;
  }
  if (autoPlayResolve) {
    autoPlayResolve();
    autoPlayResolve = null;
  }
  renderStudyModule(moduleId);
}

async function autoPlayEntries(moduleId, entries) {
  const token = ++autoPlayToken;
  autoPlayActive = true;
  try {
    for (const entry of entries) {
      if (token !== autoPlayToken) return;
      studyCursors[moduleId] = studyModules.find(({ id }) => id === moduleId).entries.indexOf(entry);
      renderStudyModule(moduleId);
      const asset = audioAssetFor(entry);
      if (!asset?.assetPath) continue;
      try {
        autoPlayAudio = new Audio(asset.assetPath);
        autoPlayAudio.playbackRate = 0.8;
        await autoPlayAudio.play();
        await new Promise((resolve) => {
          autoPlayResolve = resolve;
          autoPlayAudio.addEventListener('ended', resolve, { once: true });
        });
      } catch {
        // Continue the sequence when one local audio file cannot play.
      } finally {
        autoPlayAudio = null;
        autoPlayResolve = null;
      }
    }
  } finally {
    if (token === autoPlayToken) {
      autoPlayActive = false;
      renderStudyModule(moduleId);
    }
  }
}

function renderStudyModule(moduleId) {
  const module = studyModules.find(({ id }) => id === moduleId);
  if (!module) return;

  activeModuleId = module.id;
  moduleTitle.textContent = module.title;
  studyRepair.replaceChildren();
  const list = document.createElement('ul');
  const index = studyCursors[moduleId] ?? 0;
  const entry = module.entries[index];
  const card = document.createElement('li');
  card.className = 'flashcard';
  card.append(imageAsset(entry.imagePath ?? 'assets/images/lesson4-forest-background.png', `${entry.term ?? entry.title ?? '丹群布農語'}插圖`, 'flashcard-art'));
  const panel = document.createElement('div');
  panel.className = 'flashcard-panel';
  panel.append(element('span', entry.term ? '族語單字' : '族語句子'));
  const languageTerm = element('h4', entry.term ?? entry.title ?? entry.text);
  languageTerm.className = 'flashcard-face flashcard-front language-term';
  const meaning = element('p', entry.meaning ?? entry.translation ?? entry.text);
  meaning.className = 'flashcard-face flashcard-back';
  meaning.hidden = true;
  const flip = gameButton('翻卡看中文', () => {
    meaning.hidden = !meaning.hidden;
    card.className = meaning.hidden ? 'flashcard' : 'flashcard is-flipped';
    flip.textContent = meaning.hidden ? '翻卡看中文' : '翻回族語';
    flip.setAttribute('aria-expanded', String(!meaning.hidden));
  });
  flip.className = 'flashcard-toggle';
  flip.setAttribute('aria-expanded', 'false');
  panel.append(languageTerm, meaning, flip);
  if (moduleId === 'sentences') {
    const analysis = document.createElement('div');
    analysis.className = 'sentence-analysis';
    analysis.append(element('strong', '句型分析'));
    const formula = entry.text.startsWith('Simaq ') && entry.text.endsWith('?')
      ? '公式：Simaq + [代名詞主格]?'
      : entry.text.endsWith('aak.')
        ? '公式：[名字/身分] + [代名詞主格 aak].'
        : entry.text.includes(' tama.') || entry.text.includes(" tais'aan.")
          ? '公式：[所有格/名字] + [代名詞 aipun/ainkun] + [關係稱謂].'
          : '';
    if (formula) analysis.append(element('p', formula));
    const parts = document.createElement('div');
    parts.className = 'sentence-parts';
    entry.text.split(' ').forEach((part, partIndex) => {
      const chip = element('span', part);
      chip.className = 'sentence-part';
      chip.setAttribute('title', `句型位置 ${partIndex + 1}`);
      parts.append(chip);
    });
    analysis.append(parts, element('small', `完整句意：${entry.translation}`));
    panel.append(analysis);
  }
  const audio = audioAssetFor(entry);
  if (audio) panel.append(audioButtonFor(entry));
  if (entry.term) {
    const example = lesson4Data.sentences.find(({ text }) => text.toLowerCase().includes(entry.term.toLowerCase()));
    if (example) panel.append(element('small', `例句：${example.text} ${example.translation}`));
  }
  card.append(panel);
  list.append(card);
  const notes = [];
  const audioEntries = module.entries.filter((entry) => audioAssetFor(entry)?.assetPath);
  const autoPlay = audioEntries.length ? gameButton(autoPlayActive ? '■ 取消自動播放' : '▶ 自動播放本單元', () => {
    if (autoPlayActive) stopAutoPlay(moduleId);
    else void autoPlayEntries(moduleId, audioEntries);
  }) : null;
  if (autoPlay) autoPlay.className = 'auto-play-button';
  const previous = gameButton('上一張', () => {
    studyCursors[moduleId] = Math.max(0, index - 1);
    renderStudyModule(moduleId);
  });
  const next = gameButton('下一張', () => {
    studyCursors[moduleId] = Math.min(module.entries.length - 1, index + 1);
    renderStudyModule(moduleId);
  });
  previous.disabled = index === 0;
  next.disabled = index === module.entries.length - 1;
  const counter = element('span', `${index + 1} / ${module.entries.length}`);
  counter.className = 'flashcard-counter';
  const navigation = document.createElement('div');
  navigation.className = 'flashcard-navigation';
  navigation.append(previous, counter, next);
  content.replaceChildren(...notes, ...(autoPlay ? [autoPlay] : []), list, navigation);
  renderStudyControls();
}

function renderStudyControls() {
  for (const { id, title } of studyModules) {
    const button = outlineButtons.get(id);
    const state = progress.completedStudyModules.includes(id) ? '已完成' : '未完成';
    button.textContent = `${title}（${state}）`;
    button.setAttribute('aria-current', id === activeModuleId ? 'true' : 'false');
  }
  const completed = progress.completedStudyModules.includes(activeModuleId);
  completionButton.textContent = completed ? '已完成自學' : '完成自學';
  completionButton.setAttribute('aria-pressed', String(completed));
  completionButton.setAttribute('aria-label', `${moduleTitle.textContent}：${completionButton.textContent}`);
}

function renderProgress() {
  const count = progress.completedStudyModules.length;
  const total = studyModules.length;
  document.getElementById('study-progress').value = count;
  document.getElementById('study-count').textContent = `已完成 ${count} / ${total} 個模組`;
  const passed = progress.passedLevels.length;
  const nextLevel = lesson4Data.levels[passed];
  document.getElementById('level-status').textContent = count !== total
    ? '請先完成上方四個自學模組；完成後會解鎖第一關，通過一關再開啟下一關。'
    : nextLevel ? `已通過 ${passed} / ${levelIds.length} 關。現在可以開始「${nextLevel.title}」，通過後會解鎖下一關。` : '四關皆已完成，可再練習。';

  for (const { id, title } of lesson4Data.levels) {
    const button = levelButtons.get(id);
    button.disabled = !canStartLevel(id);
    const status = button.disabled ? '鎖定' : progress.passedLevels.includes(id) ? '已過關，可重玩' : '已解鎖';
    const label = id === 'listen-match' ? `${title}（文字理解）` : title;
    button.textContent = `${label}（${status}）`;
  }
}

function completeStudyModule(moduleId) {
  if (!studyModuleIds.includes(moduleId) || progress.completedStudyModules.includes(moduleId)) return;
  progress.completedStudyModules.push(moduleId);
  saveProgress(progress);
  renderStudyControls();
  renderProgress();
}

function canStartLevel(levelId) {
  const index = levelIds.indexOf(levelId);
  return index >= 0 && progress.completedStudyModules.length === studyModuleIds.length &&
    (index === 0 || progress.passedLevels.includes(levelIds[index - 1]));
}

function knowledgeLabel(id, title) {
  return id === 'listening' ? `${title}（丹群音檔）` : title;
}

function renderResults() {
  resultsArea.hidden = progress.passedLevels.length === 0 || Boolean(activeRound?.repairPoint);
  if (resultsArea.hidden) return;

  const diagnostics = buildDiagnostics(progress);
  resultsTitle.textContent = progress.passedLevels.length === levelIds.length ? '全課學習結果' : '學習結果';
  document.getElementById('diagnostics-summary').replaceChildren(...diagnostics.map((diagnostic) => {
    const { id, title, correct, wrong, accuracy } = diagnostic;
    const score = accuracy === null ? '尚未作答' : `${Math.round(accuracy * 100)}%（答對 ${correct}／${correct + wrong} 次）`;
    return element('li', `${knowledgeLabel(id, title)}　${score}`);
  }));
  renderRepairQueue(diagnostics);
  resultsActions.replaceChildren(
    gameButton('繼續累積學習', () => {
      statusMessage.textContent = '已保留目前學習紀錄，繼續累積答題結果。';
      resultsTitle.focus();
    }),
    gameButton('重新學習（清除所有紀錄）', () => {
      progress.completedStudyModules = [];
      progress.passedLevels = [];
      progress.attempts = [];
      progress.repairs = {};
      activeRound = null;
      gameArea.hidden = true;
      saveProgress(progress);
      renderProgress();
      renderResults();
      statusMessage.textContent = '學習紀錄已清除，請重新開始自學。';
      document.getElementById('study-area').focus?.();
    })
  );
}

/** @param {Diagnostic[]} diagnostics */
function renderRepairQueue(diagnostics) {
  const weak = diagnostics.filter(({ isWeak }) => isWeak);
  if (weak.length === 0) {
    repairQueue.replaceChildren(element('p', '目前沒有待補強的知識點。'));
    return;
  }

  const list = document.createElement('ul');
  const deferRetest = ordinaryRoundInProgress();
  for (const diagnostic of weak) {
    const { id, title, pendingWrong, mistakes, isReviewed } = diagnostic;
    const firstMissedQuestion = mistakes.keys().next().value;
    const module = studyModules.find(({ id }) => id === firstMissedQuestion.repairModule);
    const item = document.createElement('li');
    const actions = document.createElement('div');
    actions.className = 'game-options';
    const reviewButton = gameButton(`複習「${module.title}」`, () => openStudyForRepair(id, title, module.id));
    reviewButton.setAttribute('aria-label', `複習「${module.title}」以補強「${title}」`);
    actions.append(reviewButton);
    let reviewStatus = '複習後可重測。';
    if (isReviewed) {
      reviewStatus = deferRetest ? '已複習。完成目前關卡後可重測。' : '已複習，可以重測。';
      const retestButton = gameButton(`重測「${title}」`, () => startRetest(id));
      retestButton.disabled = deferRetest;
      actions.append(retestButton);
    }
    const retestList = document.createElement('ol');
    for (const question of retestQuestions(id)) {
      const entry = document.createElement('li');
      entry.append(element('p', question.prompt));
      const answers = mistakes.get(question);
      if (answers) {
        entry.append(element('p', question.explanation));
        for (const answer of answers) {
          entry.append(element('p', answer === undefined ? '舊作答未記錄所選答案。' : explainWrongAnswer(question, answer)));
        }
      }
      retestList.append(entry);
    }
    item.append(
      element('h4', knowledgeLabel(id, title)),
      element('p', `待補強的答錯紀錄有 ${pendingWrong} 次。${reviewStatus}`),
      element('p', '重測題目'),
      retestList,
      actions
    );
    list.append(item);
  }
  repairQueue.replaceChildren(list);
  if (deferRetest && weak.some(({ isReviewed }) => isReviewed)) {
    repairQueue.append(gameButton('回到目前關卡', () => {
      (activeRound.awaitingFeedback ? feedbackArea : gameQuestion).focus();
    }));
  }
}

function openStudyForRepair(pointId, title, moduleId) {
  renderStudyModule(moduleId);
  studyRepair.replaceChildren(
    element('p', `請複習這個模組，再標記「${title}」已複習。`),
    gameButton(`標記已複習「${title}」`, () => {
      progress.repairs[pointId] = { resolvedThrough: progress.repairs[pointId]?.resolvedThrough ?? 0, reviewed: true };
      saveProgress(progress);
      studyRepair.replaceChildren();
      repairOutcome.textContent = `已複習「${title}」。`;
      renderResults();
      resultsTitle.focus();
    })
  );
  moduleTitle.focus();
}

function ordinaryRoundInProgress() {
  return Boolean(activeRound?.levelId && activeRound.index < activeRound.questions.length);
}

function shuffledQuestions(questions) {
  const result = [...questions];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function retestQuestions(pointId) {
  return lesson4Data.questions.filter(({ knowledgePoint, levelId }) => knowledgePoint === pointId && canStartLevel(levelId));
}

function startRetest(pointId) {
  if (activeRound?.repairPoint || ordinaryRoundInProgress()) return;
  const point = buildDiagnostics(progress).find(({ id }) => id === pointId);
  if (!point?.isWeak || !point.isReviewed) return;
  const questions = shuffledQuestions(retestQuestions(pointId));
  if (!questions.length) return;

  activeRound = { repairPoint: pointId, retestCorrect: true, questions, index: 0, awaitingFeedback: false, correct: 0, wrong: 0 };
  studyRepair.replaceChildren();
  repairOutcome.textContent = '';
  renderResults();
  gameArea.hidden = false;
  gameTitle.textContent = `補強重測 · ${knowledgeLabel(pointId, point.title)}`;
  showQuestion(activeRound);
}

function startLevel(levelId) {
  if (!canStartLevel(levelId)) return;
  const questions = shuffledQuestions(lesson4Data.questions.filter((question) => question.levelId === levelId));
  activeRound = {
    levelId, questions, totalQuestions: questions.length, index: 0, awaitingFeedback: false, correct: 0, wrong: 0,
    questionAttempts: {}, correctForQuestion: {}, moleLastIndex: -1,
    speedLevel: 0, speedCorrectStreak: 0
  };
  studyRepair.replaceChildren();
  repairOutcome.textContent = '';
  renderResults();
  gameArea.hidden = false;
  gameTitle.textContent = lesson4Data.levels.find(({ id }) => id === levelId).title;
  showQuestion(activeRound);
}

function showQuestion(round) {
  if (whackGameCleanup) whackGameCleanup();
  round.awaitingFeedback = false;
  const question = round.questions[round.index];
  const prompt = question.levelId === 'word-mole'
    ? (question.prompt.match(/「([^」]+)」/)?.[1] ?? question.prompt)
    : question.levelId === 'listen-match'
      ? '請先播放音檔，再選出你聽到的族語句子。'
      : question.prompt;
  gameQuestion.className = question.levelId === 'word-mole' ? 'word-mole-question' : '';
  if (question.levelId === 'word-mole') {
    gameQuestion.replaceChildren(
      element('span', `第 ${round.index + 1} / ${round.questions.length} 題`),
      element('span', prompt)
    );
    gameQuestion.children[1].className = 'question-target';
  } else {
  gameQuestion.textContent = `第 ${round.index + 1} / ${round.totalQuestions ?? round.questions.length} 題：${prompt}`;
  }
  feedbackResult.replaceChildren(element('p', '作答後會顯示結果。'));
  feedbackActions.replaceChildren();
  feedbackArea.hidden = question.levelId === 'word-mole';
  levelRenderers[round.questions[round.index].levelId](round);
  gameQuestion.focus();
}

/** @returns {AnswerResult} */
function submitAnswer(questionId, answer) {
  const round = activeRound;
  const question = round?.questions[round.index];
  if (!question || round.awaitingFeedback || question.id !== questionId) return { accepted: false };

  if (whackGameCleanup) whackGameCleanup();
  round.awaitingFeedback = true;
  const isCorrect = answer === question.answer;
  if (question.mode === 'sentence-cloze') {
    if (isCorrect) {
      round.clozePool.splice(round.clozePool.indexOf(answer), 1);
      round.index += 1;
    }
    round.awaitingFeedback = false;
    if (isCorrect && round.index >= round.questions.length) {
      if (!progress.passedLevels.includes(round.levelId)) progress.passedLevels.push(round.levelId);
      renderProgress();
      renderResults();
      renderFeedback({ accepted: true, question, answer, isCorrect, levelPassed: true });
    }
    else if (isCorrect) showQuestion(round);
    else renderFeedback({ accepted: true, question, answer, isCorrect, levelPassed: false });
    return { accepted: true, question, answer, isCorrect, levelPassed: false };
  }
  if (question.levelId === 'word-mole') {
    if (answer === '未敲中') {
      round.questions.push(round.questions.shift());
      round.awaitingFeedback = false;
      showQuestion(round);
      const status = element('p', '時間到，這題稍後再回來。');
      status.className = 'mole-status is-wrong';
      gameContent.prepend(status);
      return { accepted: true, question, answer, isCorrect: false, levelPassed: false };
    }
    round.questionAttempts[question.id] = (round.questionAttempts[question.id] ?? 0) + 1;
    if (isCorrect) {
      round.correct += 1;
      round.correctForQuestion[question.id] = (round.correctForQuestion[question.id] ?? 0) + 1;
      round.speedCorrectStreak += 1;
      if (round.speedCorrectStreak >= 2) {
        round.speedLevel = Math.max(-3, round.speedLevel - 1);
        round.speedCorrectStreak = 0;
      }
    } else {
      round.wrong += 1;
      round.speedLevel = Math.min(3, round.speedLevel + 1);
      round.speedCorrectStreak = 0;
    }
    recordAttempt(question.id, isCorrect, answer);
    round.awaitingFeedback = false;
    renderMoleResponse(round, question, isCorrect);
    return { accepted: true, question, answer, isCorrect, levelPassed: false };
  }
  if (isCorrect) round.correct += 1;
  else round.wrong += 1;
  if (isCorrect || round.repairPoint) round.index += 1;
  const finished = round.index === round.questions.length;
  const levelPassed = !round.repairPoint && finished;
  if (round.repairPoint) {
    round.retestCorrect = round.retestCorrect && isCorrect;
    if (finished && round.retestCorrect) {
      progress.repairs[round.repairPoint] = { reviewed: false, resolvedThrough: progress.attempts.length + 1 };
    }
  }
  if (levelPassed && !progress.passedLevels.includes(round.levelId)) {
    progress.passedLevels.push(round.levelId);
    renderProgress();
  }
  recordAttempt(question.id, isCorrect, answer);
  if (!round.repairPoint) renderResults();
  const result = { accepted: true, question, answer, isCorrect, levelPassed };
  renderFeedback(result);
  return result;
}

function renderMoleResponse(round, question, isCorrect) {
  if (!isCorrect) {
    showQuestion(round);
    const total = round.correctForQuestion[question.id] ?? 0;
    const status = element('p', `答錯，再試一次！目前累積答對 ${total}／3 次。`);
    status.className = 'mole-status is-wrong';
    gameContent.prepend(status);
    return;
  }

  const total = round.correctForQuestion[question.id] ?? 0;
  if (total < 3) {
    showQuestion(round);
    const status = element('p', `答對了！目前累積答對 ${total}／3 次，再答對 ${3 - total} 次就進入下一個單字。`);
    status.className = 'mole-status is-correct';
    gameContent.prepend(status);
    return;
  }

  const mastered = (round.correctForQuestion[question.id] ?? 0) >= 3;
  if (!mastered) {
    showQuestion(round);
    const status = element('p', `答對了！目前得分：${round.correct}`);
    status.className = 'mole-status is-correct';
    gameContent.prepend(status);
    return;
  }

  round.questions.shift();
  if (round.questions.length > 0) {
    showQuestion(round);
    const status = element('p', `這個單字已累積答對 3 次，進入下一個單字！目前得分：${round.correct}`);
    status.className = 'mole-status is-correct';
    gameContent.prepend(status);
    return;
  }

  if (!progress.passedLevels.includes(round.levelId)) progress.passedLevels.push(round.levelId);
  renderProgress();
  renderResults();
  const nextLevel = lesson4Data.levels[levelIds.indexOf(round.levelId) + 1];
  const result = element('p', `本關完成！答對 ${round.correct} 題，答錯 ${round.wrong} 題。`);
  result.className = 'mole-status is-correct';
  const next = nextLevel
    ? gameButton(`進入下一關：${nextLevel.title}`, () => startLevel(nextLevel.id))
    : gameButton('回到關卡地圖', () => {
      gameArea.hidden = true;
      levelButtons.get(round.levelId).focus();
    });
  gameContent.replaceChildren(result, next);
}

function explainWrongAnswer(question, answer) {
  if (!isKnownWrongAnswer(question, answer)) return '所選答案與教材對照不符。';
  if (question.levelId !== 'sentence-order') {
    return `你選了「${answer}」。${question.wrongExplanations[answer]}`;
  }

  const picked = answer.split(' ');
  return question.answer.split(' ').flatMap((expected, index) => picked[index] === expected ? [] : [
    `第 ${index + 1} 個詞塊排成「${picked[index]}」，教材是「${expected}」。`
  ]).join('');
}

/** @param {AnswerResult} result */
function renderFeedback(result) {
  if (!result.accepted) return;
  const { question, answer, isCorrect, levelPassed } = result;
  const round = activeRound;
  gameContent.replaceChildren();
  const nextLevel = lesson4Data.levels[levelIds.indexOf(question.levelId) + 1];
  const point = lesson4Data.knowledgePoints.find(({ id }) => id === question.knowledgePoint);
  const outcome = isCorrect ? '答對了。' : '答錯了。';
  const passed = levelPassed ? (nextLevel ? '已過關。' : '四關皆已完成。') : '';
  const repair = studyModules.find(({ id }) => id === question.repairModule);
  const feedback = [element('p', `${outcome}${passed}本題練習${knowledgeLabel(point.id, point.title)}。`)];
  if (levelPassed) feedback.push(element('p', `本關成績：答對 ${round.correct} 題，答錯 ${round.wrong} 題。`));
  if (question.levelId !== 'word-mole') feedback.push(element('p', question.explanation));
  if (!isCorrect) {
    if (question.levelId !== 'word-mole') feedback.push(element('p', explainWrongAnswer(question, answer)));
    feedback.push(element('p', `可回自學區複習「${repair.title}」。`));
  }
  feedbackResult.replaceChildren(...feedback);

  if (round.repairPoint && round.index === round.questions.length) {
    feedbackActions.replaceChildren(gameButton('查看補強結果', () => {
      activeRound = null;
      gameArea.hidden = true;
      feedbackActions.replaceChildren();
      repairOutcome.textContent = round.retestCorrect
        ? `「${point.title}」重測全對，已完成補強。` : `「${point.title}」仍需補強，可以再重測。`;
      renderResults();
      resultsTitle.focus();
    }));
  } else if (levelPassed) {
    const continueButton = nextLevel ? gameButton(`下一關：${nextLevel.title}`, () => startLevel(nextLevel.id))
      : gameButton('回到關卡地圖', () => {
        activeRound = null;
        gameArea.hidden = true;
        levelButtons.get(round.levelId).focus();
      });
    feedbackActions.replaceChildren(continueButton, gameButton('查看學習結果', () => resultsTitle.focus()));
  } else {
    const label = isCorrect || round.repairPoint ? '下一題' : '重試這一題';
    feedbackActions.replaceChildren(gameButton(label, () => showQuestion(round)));
  }
  feedbackArea.focus();
}

function answerOptions(round) {
  const question = round.questions[round.index];
  const options = document.createElement('div');
  options.className = 'game-options';
  options.append(...shuffledAnswerOptions(question).map((option) => gameButton(option, () => submitAnswer(question.id, option))));
  return options;
}

function renderWhackAMole(round) {
  const question = round.questions[round.index];
  const holes = document.createElement('div');
  holes.className = 'mole-holes';
  const timer = element('p', '剩餘時間：10 秒');
  timer.className = 'mole-timer';
  timer.setAttribute('aria-live', 'polite');
  let activeIndex = round.moleLastIndex ?? -1;
  let activeAnswer = '';
  const difficulty = Math.min(round.index, 6);
  const speedFactor = Math.pow(.9, round.speedLevel);
  const popDelay = Math.max(700, ((950 - difficulty * 65) / .8) * speedFactor);
  let seconds = Math.max(6, 10 - Math.floor(difficulty / 2));
  timer.textContent = `剩餘時間：${seconds} 秒`;
  const holeButtons = Array.from({ length: 9 }, (_, index) => {
    const hole = gameButton('', () => {
      const answer = index === activeIndex ? activeAnswer : '空洞';
      const result = submitAnswer(question.id, answer);
      if (result.accepted) {
        playMoleSound(result.isCorrect);
        if (answer !== '空洞') playVocabularyPronunciation(answer);
      }
    });
    hole.className = 'mole-hole';
    hole.setAttribute('aria-label', '敲打洞口');
    const mole = imageAsset('assets/images/lesson4-mole.png', '', 'mole-hole-art');
    mole.hidden = true;
    const word = element('span', '');
    word.className = 'mole-word';
    word.hidden = true;
    hole.append(mole, word);
    hole.dataset.index = String(index);
    holes.append(hole);
    return { hole, mole, word };
  });
  const popMole = () => {
    holeButtons.forEach(({ hole, mole, word }) => {
      hole.classList.remove('is-active');
      mole.hidden = true;
      word.hidden = true;
      hole.setAttribute('aria-label', '敲打洞口');
    });
    const availableIndexes = holeButtons.map((_, index) => index).filter((index) => index !== activeIndex);
    activeIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
    round.moleLastIndex = activeIndex;
    activeAnswer = question.options[Math.floor(Math.random() * question.options.length)];
    const active = holeButtons[activeIndex];
    active.hole.classList.add('is-active');
    active.mole.hidden = false;
    active.word.textContent = activeAnswer;
    active.word.hidden = false;
    active.hole.setAttribute('aria-label', `敲打洞口，選擇 ${activeAnswer}`);
  };
  const setTimer = typeof setInterval === 'function' ? setInterval : () => 0;
  const clearTimer = typeof clearInterval === 'function' ? clearInterval : () => {};
  const setMoleTimer = typeof setTimeout === 'function' ? setTimeout : () => 0;
  const clearMoleTimer = typeof clearTimeout === 'function' ? clearTimeout : () => {};
  let moleTimer = 0;
  const scheduleMole = () => {
    popMole();
    const variation = popDelay * (.65 + Math.random() * .8);
    moleTimer = setMoleTimer(scheduleMole, variation);
  };
  scheduleMole();
  const countdown = setTimer(() => {
    seconds -= 1;
    timer.textContent = `剩餘時間：${seconds} 秒`;
    if (seconds <= 0) submitAnswer(question.id, '未敲中');
  }, 1000);
  whackGameCleanup = () => {
    clearMoleTimer(moleTimer);
    clearTimer(countdown);
    whackGameCleanup = null;
  };
  gameContent.replaceChildren(element('p', '地鼠會從九個洞口隨機冒出！請敲打寫著正確族語單字的地鼠。'), timer, holes);
}

function renderListeningRound(round) {
  const question = round.questions[round.index];
  const sentence = lesson4Data.sentences.find(({ id }) => id === question.sentenceId);
  gameContent.replaceChildren(
    audioButtonFor(sentence),
    answerOptions(round)
  );
}

function renderSentenceOrder(round) {
  const question = round.questions[round.index];
  const sentence = lesson4Data.sentences.find(({ id }) => id === question.sentenceId);
  const tokens = sentence.text.split(' ');
  for (let index = tokens.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [tokens[index], tokens[swapIndex]] = [tokens[swapIndex], tokens[index]];
  }
  const picked = [];
  const preview = element('p', '目前排序：尚未選詞塊');
  preview.setAttribute('aria-live', 'polite');
  const tiles = document.createElement('div');
  tiles.className = 'game-options';
  const tileButtons = tokens.map((token, index) => gameButton(token, () => {
    picked.push(index);
    updateOrder();
    (tileButtons.find((button) => !button.disabled) ?? submit).focus();
  }));
  tiles.append(...tileButtons);
  const undo = gameButton('撤回最後一塊', () => {
    const index = picked.pop();
    updateOrder();
    tileButtons[index].focus();
  });
  const submit = gameButton('送出排序', () => submitAnswer(question.id, picked.map((index) => tokens[index]).join(' ')));
  const actions = document.createElement('div');
  actions.className = 'game-options';
  actions.append(undo, submit);

  function updateOrder() {
    preview.textContent = `目前排序：${picked.map((index) => tokens[index]).join(' ') || '尚未選詞塊'}`;
    tileButtons.forEach((button, index) => { button.disabled = picked.includes(index); });
    undo.disabled = picked.length === 0;
    submit.disabled = picked.length !== tokens.length;
  }

  updateOrder();
  gameContent.replaceChildren(element('p', '依照句子的順序選詞塊，選完再送出。'), preview, tiles, actions);
}

function renderCultureChallenge(round) {
  const question = round.questions[round.index];
  const sentence = lesson4Data.sentences.find(({ id }) => id === question.sentenceId);
  if (question.mode === 'sentence-cloze') {
    renderSentenceCloze(round, sentence);
    return;
  }
  gameContent.replaceChildren(
    imageAsset(sentence?.imagePath ?? 'assets/images/lesson4-relationship-characters.png', '句子情境插圖', 'relationship-art'),
    answerOptions(round)
  );
}

function renderSentenceCloze(round, sentence) {
  const question = round.questions[round.index];
  round.clozePool ??= round.questions.map(({ answer }) => answer);
  const tokens = sentence.text.split(' ');
  const lastToken = tokens[tokens.length - 1];
  const punctuation = lastToken.endsWith('?') ? '?' : lastToken.endsWith('.') ? '.' : '';
  const clozeText = tokens.slice(0, -1).concat(`____${punctuation}`).join(' ');
  const tiles = document.createElement('div');
  tiles.className = 'game-options sentence-build-options';
  const options = [...round.clozePool].sort(() => Math.random() - .5);
  tiles.append(...options.map((option) => gameButton(option, () => submitAnswer(question.id, option))));
  const image = imageAsset(sentence?.imagePath ?? 'assets/images/lesson4-relationship-characters.png', '句子情境插圖', 'relationship-art');
  const prompt = element('p', `請依照圖片與上方句型公式，完成句子：${clozeText}`);
  prompt.className = 'sentence-cloze-prompt';
  gameContent.replaceChildren(image, prompt, tiles);
}

function renderAudioStatus() {
  statusMessage.textContent = '準備開始自學。';
}

const levelRenderers = {
  'word-mole': renderWhackAMole,
  'listen-match': renderListeningRound,
  'sentence-order': renderSentenceOrder,
  'greeting-challenge': renderCultureChallenge
};

for (const { id } of studyModules) {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-controls', 'study-content');
  button.addEventListener('click', () => renderStudyModule(id));
  outlineButtons.set(id, button);
  item.append(button);
  outline.append(item);
}
completionButton.addEventListener('click', () => completeStudyModule(activeModuleId));
for (const id of levelIds) {
  const button = gameButton('', () => startLevel(id));
  button.setAttribute('aria-controls', 'game-area');
  document.getElementById(id).replaceChildren(button);
  levelButtons.set(id, button);
}
renderStudyModule(activeModuleId);
renderAudioStatus();
renderProgress();
renderResults();
