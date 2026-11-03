const test = require('node:test');
const assert = require('node:assert/strict');
const { captureToDisplayMs } = require('../video-latency.js');

test('estimates capture-to-display delay from frame metadata', () => {
  assert.equal(captureToDisplayMs({ captureTime: 100, expectedDisplayTime: 155.4 }), 55);
});

test('returns unavailable when capture time is missing or invalid', () => {
  assert.equal(captureToDisplayMs({ expectedDisplayTime: 155 }), null);
  assert.equal(captureToDisplayMs({ captureTime: 200, expectedDisplayTime: 155 }), null);
  assert.equal(captureToDisplayMs({ captureTime: 100, expectedDisplayTime: 15000 }), null);
});
