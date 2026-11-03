class TouchControls {
  constructor() { this.reset(); }
  setStick(side, x, y) {
    const toChannel = value => Math.round(172 + Math.max(0, Math.min(1, value)) * (1811 - 172));
    if (side === 'left') {
      this.values.R = toChannel(x);
      this.values.T = toChannel(1 - y);
    } else if (side === 'right') {
      this.values.A = toChannel(x);
      this.values.E = toChannel(1 - y);
    }
  }
  releaseStick(side) {
    if (side === 'left') { this.values.R = 992; this.values.T = 172; }
    if (side === 'right') { this.values.A = 992; this.values.E = 992; }
  }
  setArm(armed) {
    if (armed && this.values.T > 300) return false;
    this.values.arm = armed ? 1811 : 172;
    return true;
  }
  reset() { this.values = { A: 992, E: 992, T: 172, R: 992, arm: 172 }; }
  channels(order) {
    if (order !== 'AETR' && order !== 'RETA') throw new Error(`Unsupported channel order: ${order}`);
    const channels = Array(16).fill(172);
    [...order].forEach((role, index) => { channels[index] = this.values[role]; });
    channels[4] = this.values.arm;
    return channels;
  }
}

if (typeof module !== 'undefined') module.exports = { TouchControls };
