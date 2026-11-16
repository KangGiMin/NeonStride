import { SOUND_CUES, SOUND_ICONS } from "../config/sounds.js";

export function createAudio(get) {
  let enabled = false,
    audio;
  function tone(freq, duration = 0.15, type = "sine", volume = 0.05) {
    if (!enabled) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const oscillator = audio.createOscillator(),
        gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        freq * 0.55,
        audio.currentTime + duration,
      );
      gain.gain.setValueAtTime(volume, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + duration,
      );
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    } catch {}
  }
  const play = (cue) => tone(...SOUND_CUES[cue]);
  return {
    play,
    toggle() {
      enabled = !enabled;
      const label = enabled ? "효과음 끄기" : "효과음 켜기";
      get("sound").setAttribute("aria-label", label);
      get("sound").title = label;
      get("soundIcon").innerHTML = SOUND_ICONS[enabled ? "on" : "off"];
      play("toggle");
    },
  };
}
