const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const scripts = [...html.matchAll(/<script defer src="([^"]+)"/g)].map((match) => match[1]);
assert.ok(scripts.includes('app.js'), 'The page must load the study app.');

class Element {
  children = [];
  attributes = {};
  listeners = {};
  textContent = '';
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, handler) { this.listeners[name] = handler; }
}

const stored = new Map([['unrelated-progress', 'keep']]);
function openPage() {
  const elements = new Map([...html.matchAll(/\bid="([^"]+)"/g)]
    .map((match) => [match[1], new Element()]));
  const context = vm.createContext({
    document: {
      getElementById: (id) => elements.get(id),
      createElement: () => new Element()
    },
    localStorage: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value)
    }
  });
  for (const script of scripts) vm.runInContext(read(script), context, { filename: script });
  return { context, elements };
}

function contents(element) {
  return [element.textContent, ...element.children.map(contents)].join(' ');
}

function nextCard(content, count) {
  for (let index = 0; index < count; index += 1) {
    const next = content.children.flatMap((child) => [child, ...child.children]).find((child) => child.textContent === '下一張');
    assert.ok(next, 'Expected a next flashcard button');
    next.listeners.click();
  }
}

const page = openPage();
const outline = page.elements.get('study-outline');
const content = page.elements.get('study-content');
const firstLevel = page.elements.get('word-mole');
const meter = page.elements.get('study-progress');
const complete = page.elements.get('complete-study');
assert.match(contents(firstLevel), /鎖定/);
assert.equal(meter.value, 0);
assert.match(html, /<label\b[^>]*\bfor="study-progress"[^>]*>\s*[^\s<][^<]*<\/label>/);
assert.equal(outline.children.length, 4);

const examples = [/tais'aan/, /Inaak aipun tama\./, /丹群音檔/, /確認親族關係/];
for (const [index, item] of outline.children.entries()) {
  item.children[0].listeners.click();
  if (index === 0) nextCard(content, 5);
  if (index === 1) nextCard(content, 6);
  if (index === 2) nextCard(content, 6);
  if (index === 3) nextCard(content, 2);
  assert.match(contents(content), examples[index]);
  if (index === 2) {
    assert.match(contents(content), /Inaak aipun tama\..*他是我的爸爸/);
  }
  assert.equal(complete.attributes['aria-pressed'], 'false');
  assert.match(complete.textContent, /完成自學/);
  complete.listeners.click();
  complete.listeners.click();
  assert.equal(complete.attributes['aria-pressed'], 'true');
  assert.match(complete.textContent, /已完成/);
  assert.equal(meter.value, index + 1);
  assert.match(contents(firstLevel), index < 3 ? /鎖定/ : /已解鎖/);
}

assert.equal(stored.get('unrelated-progress'), 'keep');
assert.equal(stored.size, 2);
const reopened = openPage();
assert.equal(reopened.elements.get('study-progress').value, 4);
assert.match(contents(reopened.elements.get('word-mole')), /已解鎖/);
assert.equal(reopened.elements.get('complete-study').attributes['aria-pressed'], 'true');
for (const id of ['listen-match', 'sentence-order', 'greeting-challenge']) {
  assert.match(contents(reopened.elements.get(id)), /鎖定/);
}

const key = [...stored.keys()].find((name) => name !== 'unrelated-progress');
stored.set(key, '{invalid');
assert.equal(openPage().elements.get('study-progress').value, 0);
stored.set(key, '{"completedStudyModules":["vocabulary","vocabulary","bogus"]}');
assert.equal(openPage().elements.get('study-progress').value, 1);
console.log('PASS: four study modules, accessible completion and progress, gating, reload, and invalid storage recovery');
