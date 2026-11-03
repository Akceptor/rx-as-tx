const test = require('node:test');
const assert = require('node:assert/strict');
const { validChannelOrder, channelLabel, channelIndex, defaultChannelMap, resolveActivePreset } = require('../channel-order.js');

test('AETR and RETA put roll and yaw on the expected channels', () => {
  assert.equal(channelIndex('AETR', 'A'), 0);
  assert.equal(channelIndex('AETR', 'R'), 3);
  assert.equal(channelIndex('RETA', 'R'), 0);
  assert.equal(channelIndex('RETA', 'A'), 3);
  assert.equal(channelLabel('RETA', 0), 'Yaw');
  assert.equal(channelLabel('RETA', 3), 'Roll');
});

test('built-in maps preserve each stick function when channel order changes', () => {
  const aetr = defaultChannelMap('AETR');
  const reta = defaultChannelMap('RETA');
  assert.deepEqual(aetr.slice(0, 6).map(c => c.src), ['a0', 'a1', 'a2', 'a3', 'a5', 'a6']);
  assert.deepEqual(reta.slice(0, 6).map(c => c.src), ['a3', 'a1', 'a2', 'a0', 'a5', 'a6']);
  assert.equal(reta.length, 16);
});

test('only supported channel orders are accepted', () => {
  assert.equal(validChannelOrder('AETR'), true);
  assert.equal(validChannelOrder('RETA'), true);
  assert.equal(validChannelOrder('TAER'), false);
});

test('restores only an available built-in or saved preset', () => {
  const saved = { MyPad: { map: [] } };
  assert.equal(resolveActivePreset('builtin:RETA', saved), 'builtin:RETA');
  assert.equal(resolveActivePreset('MyPad', saved), 'MyPad');
  assert.equal(resolveActivePreset('deleted', saved), '');
});
