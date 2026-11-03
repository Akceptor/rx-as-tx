function drawPeople(ctx, predictions, mirror = false) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const people = predictions.filter(p => p.class === 'person' && p.score >= 0.5);
  ctx.strokeStyle = '#34c37a';
  ctx.fillStyle = '#34c37a';
  ctx.lineWidth = Math.max(2, ctx.canvas.width / 320);
  ctx.font = `${Math.max(14, Math.round(ctx.canvas.width / 60))}px sans-serif`;
  for (const person of people) {
    let [x, y, width, height] = person.bbox;
    if (mirror) x = ctx.canvas.width - x - width;
    const label = `person ${Math.round(person.score * 100)}%`;
    const labelWidth = ctx.measureText(label).width + 8;
    const labelY = Math.max(0, y - 24);
    ctx.strokeRect(x, y, width, height);
    ctx.fillRect(x, labelY, labelWidth, 24);
    ctx.fillStyle = '#000';
    ctx.fillText(label, x + 4, labelY + 18);
    ctx.fillStyle = '#34c37a';
  }
  return people.length;
}

function scalePeople(predictions, scaleX, scaleY) {
  return predictions.map(p => ({
    ...p,
    bbox: [p.bbox[0] * scaleX, p.bbox[1] * scaleY, p.bbox[2] * scaleX, p.bbox[3] * scaleY],
  }));
}

if (typeof module !== 'undefined') module.exports = { drawPeople, scalePeople };
