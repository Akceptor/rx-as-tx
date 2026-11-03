function captureToDisplayMs(metadata) {
  const delay = metadata.expectedDisplayTime - metadata.captureTime;
  if (!Number.isFinite(delay) || delay < 0 || delay > 10000) return null;
  return Math.round(delay);
}

if (typeof module !== 'undefined') module.exports = { captureToDisplayMs };
