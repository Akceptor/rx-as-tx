const ROLE_LABELS = { A: 'Roll', E: 'Pitch', T: 'Throttle', R: 'Yaw' };
const DEFAULT_AXIS = { A: 'a0', E: 'a1', T: 'a2', R: 'a3' };

function validChannelOrder(order) { return order === 'AETR' || order === 'RETA'; }
function channelIndex(order, role) { return order.indexOf(role); }
function channelLabel(order, index) {
  if (index < 4) return ROLE_LABELS[order[index]];
  return ['Arm', 'Mode'][index - 4] || `AUX${index - 3}`;
}
function defaultChannelMap(order) {
  if (!validChannelOrder(order)) throw new Error(`Unsupported channel order: ${order}`);
  const sources = [...order].map(role => DEFAULT_AXIS[role]).concat(['a5', 'a6']);
  return Array.from({ length: 16 }, (_, index) => ({ src: sources[index] || 'n', inv: false }));
}
function resolveActivePreset(value, presets) {
  if (typeof value !== 'string' || !value) return '';
  if (value.startsWith('builtin:')) return validChannelOrder(value.slice(8)) ? value : '';
  return Object.prototype.hasOwnProperty.call(presets, value) ? value : '';
}

if (typeof module !== 'undefined') module.exports = { validChannelOrder, channelLabel, channelIndex, defaultChannelMap, resolveActivePreset };
