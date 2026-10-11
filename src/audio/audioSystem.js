let audioCtx = null;
let ambientGain = null;
let ambientOsc1 = null;
let ambientOsc2 = null;
let isAudioActive = false;

export function initAudioEngine() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return;
  }

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audioCtx = new AudioContextClass();

    // Subtle relaxing spatial showroom ambient drone
    ambientGain = audioCtx.createGain();
    ambientGain.gain.setValueAtTime(0.025, audioCtx.currentTime);
    ambientGain.connect(audioCtx.destination);

    ambientOsc1 = audioCtx.createOscillator();
    ambientOsc1.type = 'sine';
    ambientOsc1.frequency.setValueAtTime(110, audioCtx.currentTime); // 110 Hz warm drone (A2)

    ambientOsc2 = audioCtx.createOscillator();
    ambientOsc2.type = 'triangle';
    ambientOsc2.frequency.setValueAtTime(164.81, audioCtx.currentTime); // E3 warm harmonic

    ambientOsc1.connect(ambientGain);
    ambientOsc2.connect(ambientGain);

    ambientOsc1.start();
    ambientOsc2.start();
    isAudioActive = true;
  } catch (err) {
    console.warn('AudioContext initialization skipped:', err);
  }
}

export function setAudioMute(enabled) {
  if (enabled) {
    if (!audioCtx) {
      initAudioEngine();
    } else if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (ambientGain && audioCtx) {
      ambientGain.gain.setTargetAtTime(0.025, audioCtx.currentTime, 0.4);
    }
    isAudioActive = true;
  } else {
    if (ambientGain && audioCtx) {
      ambientGain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.2);
    }
    isAudioActive = false;
  }
}

export function playChime(freq = 520) {
  if (!isAudioActive) return;
  if (!audioCtx) initAudioEngine();
  if (!audioCtx) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.36);
  } catch (e) {
    // Ignore audio glitches
  }
}

export function playThud() {
  if (!isAudioActive) return;
  if (!audioCtx) initAudioEngine();
  if (!audioCtx) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(28, audioCtx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    // Ignore
  }
}

export function playSnap() {
  if (!isAudioActive) return;
  if (!audioCtx) initAudioEngine();
  if (!audioCtx) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.10);
  } catch (e) {
    // Ignore
  }
}

export function playFootstep(surface = 'wood') {
  if (!isAudioActive) return;
  if (!audioCtx) initAudioEngine();
  if (!audioCtx) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    const isTile = surface === 'tile';
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isTile ? 220 : 130, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isTile ? 90 : 55, audioCtx.currentTime + 0.07);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isTile ? 800 : 450, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.09);
  } catch (e) {
    // Ignore
  }
}

export function playSwitch() {
  if (!isAudioActive) return;
  if (!audioCtx) initAudioEngine();
  if (!audioCtx) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.07);
  } catch (e) {
    // Ignore
  }
}

export function playDoorSlide() {
  if (!isAudioActive) return;
  if (!audioCtx) initAudioEngine();
  if (!audioCtx) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, audioCtx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, audioCtx.currentTime);
    filter.Q.setValueAtTime(2.0, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.46);
  } catch (e) {
    // Ignore
  }
}

export function playDrawerSlide() {
  if (!isAudioActive) return;
  if (!audioCtx) initAudioEngine();
  if (!audioCtx) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(170, audioCtx.currentTime + 0.25);
    osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.48);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.045, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.52);
  } catch (e) {
    // Ignore
  }
}

