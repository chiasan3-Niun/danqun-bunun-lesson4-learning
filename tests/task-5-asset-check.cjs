const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const css = read('styles.css');
const lessonSource = read('data/lesson4.js');

const dataContext = vm.createContext({});
vm.runInContext(lessonSource, dataContext, { filename: 'data/lesson4.js' });
const data = dataContext.lesson4Data;

assert.equal(data.audioStatus, 'available');
assert.match(data.dialectNote, /丹群/);
assert.ok(Array.isArray(data.audioAssets) && data.audioAssets.length > 0);
for (const asset of data.audioAssets) {
  for (const field of ['sourceUrl', 'dialect', 'status', 'verifiedBy', 'createdAt']) {
    assert.ok(Object.hasOwn(asset, field), `Audio metadata missing ${field}`);
  }
  assert.equal(asset.status, 'generated');
  assert.match(asset.dialect, /丹群/);
  assert.ok(typeof asset.assetPath === 'string');
  assert.ok(fs.existsSync(path.join(root, asset.assetPath)), `Missing audio ${asset.assetPath}`);
}

const imageNames = [
  'lesson4-forest-background.png',
  'lesson4-mole.png',
  'lesson4-relationship-characters.png'
];
for (const imageName of imageNames) {
  assert.ok(fs.existsSync(path.join(root, 'assets', 'images', imageName)), `Missing image ${imageName}`);
  assert.match(`${html}\n${css}\n${read('app.js')}`, new RegExp(imageName.replace('.', '\\.'), 'i')),
    `Image is not integrated: ${imageName}`;
}
for (const entry of [...data.vocabulary, ...data.sentences, ...data.culture]) {
  assert.notEqual(entry.text, entry.imagePath, 'Image metadata must not become lesson text');
}
for (const entry of [...data.vocabulary, ...data.sentences, ...data.culture]) {
  assert.ok(entry.imagePath, `Missing study image path for ${entry.term ?? entry.id ?? entry.title}`);
  assert.ok(fs.existsSync(path.join(root, entry.imagePath)), `Missing vocabulary image ${entry.imagePath}`);
}

class Element {
  constructor(tagName = 'div') {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, handler) { this.listeners[name] = handler; }
  focus() {}
}

const elements = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([match, id]) => [id, new Element()]));
const stored = new Map();
const context = vm.createContext({
  document: {
    getElementById: (id) => elements.get(id),
    createElement: (tagName) => new Element(tagName)
  },
  localStorage: {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value)
  }
});
for (const script of ['data/lesson4.js', 'app.js']) vm.runInContext(read(script), context, { filename: script });

(async () => {
  const missingTrigger = new Element('button');
  assert.equal(typeof context.playAudio, 'function');
  await context.playAudio('', missingTrigger);
  assert.equal(missingTrigger.attributes['data-audio-state'], 'pending');
  assert.match(missingTrigger.textContent, /待補音|音檔待補/);

  const requestedPaths = [];
  context.Audio = class {
    constructor(source) { requestedPaths.push(source); }
    play() { return Promise.resolve(); }
  };
  const existingTrigger = new Element('button');
  const existingAudio = data.audioAssets[0].assetPath;
  await context.playAudio(existingAudio, existingTrigger);
  assert.deepEqual(requestedPaths, [existingAudio]);
  assert.equal(existingTrigger.attributes['data-audio-state'], 'played');

  console.log('PASS: pending audio metadata, missing-audio fallback, addressable audio path, and integrated image assets');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
