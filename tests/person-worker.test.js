const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('worker loads model and returns detections for a frame', async () => {
  const messages = [];
  const worker = {
    importScripts() {},
    tf: { setBackend: async () => true, ready: async () => {} },
    cocoSsd: { load: async () => ({ detect: async () => [{ class: 'person', score: 0.9, bbox: [1, 2, 3, 4] }] }) },
    postMessage: message => messages.push(message),
  };
  vm.runInNewContext(fs.readFileSync('person-worker.js', 'utf8'), worker);
  await worker.onmessage({ data: { type: 'init' } });
  await worker.onmessage({ data: { type: 'frame', image: { width: 320, height: 240 }, run: 7 } });
  assert.equal(messages[0].type, 'ready');
  assert.equal(messages[1].type, 'result');
  assert.equal(messages[1].predictions[0].class, 'person');
  assert.equal(messages[1].run, 7);
});
