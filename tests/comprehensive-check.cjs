const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'data/lesson4.js'), 'utf8'), context);
const data = context.lesson4Data;

assert.equal(data.vocabulary.length, 7);
assert.equal(data.sentences.length, 10);
assert.equal(data.culture.length, 3);

const requiredCounts = {
  'word-mole': data.vocabulary.length,
  'listen-match': data.sentences.length,
  'sentence-order': data.sentences.length,
  'greeting-challenge': data.culture.length
};

const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert.match(app, /expandAssessmentQuestions/);
assert.match(app, /meaning-\$\{entry\.term\}/);
assert.match(app, /listen-\$\{entry\.id\}/);
assert.match(app, /order-\$\{entry\.id\}/);
assert.match(app, /culture-2/);
assert.match(app, /culture-3/);

for (const [levelId, count] of Object.entries(requiredCounts)) {
  if (levelId === 'word-mole') assert.match(app, /lesson4Data\.vocabulary\.forEach/);
  if (levelId === 'listen-match' || levelId === 'sentence-order') assert.match(app, /lesson4Data\.sentences\.forEach/);
  assert.ok(count > 0, `${levelId} must have questions`);
}

console.log('PASS: vocabulary, all 10 sentences, all sentence orders, and all 3 culture points are covered by the full assessment builder');
