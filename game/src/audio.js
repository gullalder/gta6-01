let context,
  muted = false;
export function unlockAudio() {
  try {
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    context.resume();
  } catch {}
}
export function toggleSound() {
  muted = !muted;
  return muted;
}
export function sound(kind) {
  if (!context || muted) return;
  const t = context.currentTime,
    o = context.createOscillator(),
    g = context.createGain();
  o.connect(g);
  g.connect(context.destination);
  let duration = 0.14,
    volume = 0.055;
  if (kind === "shot") {
    o.type = "sawtooth";
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(35, t + 0.12);
    volume = 0.09;
  } else if (kind === "siren") {
    o.type = "sine";
    o.frequency.setValueAtTime(700, t);
    o.frequency.linearRampToValueAtTime(1050, t + 0.23);
    duration = 0.3;
    volume = 0.025;
  } else if (kind === "crash") {
    o.type = "triangle";
    o.frequency.setValueAtTime(85, t);
    o.frequency.exponentialRampToValueAtTime(20, t + 0.2);
    duration = 0.22;
    volume = 0.12;
  } else if (kind === "reward") {
    o.type = "sine";
    o.frequency.setValueAtTime(520, t);
    o.frequency.setValueAtTime(660, t + 0.1);
    o.frequency.setValueAtTime(880, t + 0.2);
    duration = 0.4;
  } else {
    o.type = "triangle";
    o.frequency.setValueAtTime(330, t);
    o.frequency.linearRampToValueAtTime(580, t + 0.1);
  }
  g.gain.setValueAtTime(volume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  o.start(t);
  o.stop(t + duration);
}
