const test = require('node:test');
const assert = require('node:assert/strict');
const { TouchControls } = require('../touch-controls.js');

test('left stick maps yaw and throttle and returns throttle low on release', () => {
  const controls = new TouchControls();
  controls.setStick('left', 0, 0);
  assert.equal(controls.values.R, 172);
  assert.equal(controls.values.T, 1811);
  controls.releaseStick('left');
  assert.equal(controls.values.R, 992);
  assert.equal(controls.values.T, 172);
});

test('right stick maps roll and pitch and centers on release', () => {
  const controls = new TouchControls();
  controls.setStick('right', 1, 0);
  assert.equal(controls.values.A, 1811);
  assert.equal(controls.values.E, 1811);
  controls.releaseStick('right');
  assert.equal(controls.values.A, 992);
  assert.equal(controls.values.E, 992);
});

test('arming requires low throttle and reset disarms', () => {
  const controls = new TouchControls();
  controls.setStick('left', 0.5, 1);
  assert.equal(controls.setArm(true), true);
  controls.setStick('left', 0.5, 0);
  controls.setArm(false);
  assert.equal(controls.setArm(true), false);
  controls.reset();
  assert.equal(controls.values.arm, 172);
});

test('touch channels follow selected AETR or RETA order', () => {
  const controls = new TouchControls();
  controls.setStick('left', 0, 1);
  controls.setStick('right', 1, 0.5);
  assert.deepEqual(controls.channels('AETR').slice(0, 5), [1811, 992, 172, 172, 172]);
  assert.deepEqual(controls.channels('RETA').slice(0, 5), [172, 992, 172, 1811, 172]);
});
