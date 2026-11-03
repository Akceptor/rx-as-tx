const test = require('node:test');
const assert = require('node:assert/strict');
const { drawPeople, scalePeople } = require('../person-detection.js');

test('draws only confident person detections at video coordinates', () => {
  const calls = [];
  const ctx = {
    canvas: { width: 640, height: 480 },
    clearRect: (...args) => calls.push(['clear', ...args]),
    strokeRect: (...args) => calls.push(['box', ...args]),
    fillRect: (...args) => calls.push(['fill', ...args]),
    fillText: (...args) => calls.push(['text', ...args]),
    measureText: text => ({ width: text.length * 8 }),
  };
  const count = drawPeople(ctx, [
    { class: 'person', score: 0.91, bbox: [10, 20, 30, 40] },
    { class: 'dog', score: 0.99, bbox: [50, 60, 70, 80] },
    { class: 'person', score: 0.30, bbox: [90, 100, 110, 120] },
  ]);

  assert.equal(count, 1);
  assert.deepEqual(calls[0], ['clear', 0, 0, 640, 480]);
  assert.deepEqual(calls.filter(c => c[0] === 'box'), [['box', 10, 20, 30, 40]]);
  assert.match(calls.find(c => c[0] === 'text')[1], /person.*91%/);
});

test('mirrors box position without reversing its label', () => {
  const boxes = [];
  const ctx = {
    canvas: { width: 640, height: 480 },
    clearRect() {}, strokeRect: (...args) => boxes.push(args),
    fillRect() {}, fillText() {}, measureText: () => ({ width: 80 }),
  };
  drawPeople(ctx, [{ class: 'person', score: 0.9, bbox: [10, 20, 30, 40] }], true);
  assert.deepEqual(boxes, [[600, 20, 30, 40]]);
});

test('scales worker boxes to the source video size', () => {
  const boxes = scalePeople([{ class: 'person', score: 0.8, bbox: [10, 20, 30, 40] }], 4, 3);
  assert.deepEqual(boxes[0].bbox, [40, 60, 120, 120]);
});
