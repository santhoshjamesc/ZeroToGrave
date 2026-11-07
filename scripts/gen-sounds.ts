/**
 * Procedurally synthesises every sound effect and the music loop as 16-bit mono 22.05kHz WAV.
 * Run: `npx tsx scripts/gen-sounds.ts`. Output is committed to assets/sounds (all bundled, offline).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SR = 22050;
const OUT = join(__dirname, '..', 'assets', 'sounds');

const hz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);
const buf = (sec: number): Float32Array => new Float32Array(Math.floor(sec * SR));

/** Add a decaying tone (with a few harmonics) into the buffer. */
function tone(
  b: Float32Array,
  start: number,
  dur: number,
  freq: number,
  o: {
    amp?: number;
    attack?: number;
    decay?: number;
    harm?: number[];
    slide?: number;
    wave?: 'sine' | 'square';
  } = {},
): void {
  const amp = o.amp ?? 0.4;
  const attack = o.attack ?? 0.005;
  const decay = o.decay ?? 6;
  const harm = o.harm ?? [1, 0.3, 0.1];
  const s0 = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  for (let i = 0; i < n && s0 + i < b.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t / attack) * Math.exp(-decay * t);
    const f = freq * (1 + (o.slide ?? 0) * t);
    let v = 0;
    harm.forEach((h, k) => {
      const ph = 2 * Math.PI * f * (k + 1) * t;
      v += h * (o.wave === 'square' ? Math.sign(Math.sin(ph)) * 0.5 : Math.sin(ph));
    });
    b[s0 + i] = (b[s0 + i] ?? 0) + v * env * amp;
  }
}

function wav(b: Float32Array): Buffer {
  let peak = 0;
  for (const v of b) peak = Math.max(peak, Math.abs(v));
  const gain = peak > 0.9 ? 0.9 / peak : 1;
  const data = Buffer.alloc(b.length * 2);
  b.forEach((v, i) =>
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * gain)) * 32767), i * 2),
  );
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const sounds: Record<string, () => Float32Array> = {
  tap: () => {
    const b = buf(0.08);
    tone(b, 0, 0.08, 900, { amp: 0.35, decay: 55, harm: [1, 0.2] });
    return b;
  },
  select: () => {
    const b = buf(0.16);
    tone(b, 0, 0.08, hz(76), { amp: 0.3, decay: 28 });
    tone(b, 0.07, 0.09, hz(83), { amp: 0.3, decay: 28 });
    return b;
  },
  success: () => {
    const b = buf(0.5);
    [72, 76, 79].forEach((m, i) => tone(b, i * 0.08, 0.35, hz(m), { amp: 0.3, decay: 9 }));
    return b;
  },
  age: () => {
    const b = buf(1.4);
    [60, 64, 67, 72, 76, 79].forEach((m, i) =>
      tone(b, i * 0.16, 0.9, hz(m), { amp: 0.22, decay: 4.5, harm: [1, 0.15, 0.05] }),
    );
    return b;
  },
  bad: () => {
    const b = buf(0.45);
    tone(b, 0, 0.4, 110, {
      amp: 0.35,
      decay: 6,
      harm: [1, 0.6, 0.4, 0.3],
      wave: 'square',
      slide: -0.6,
    });
    tone(b, 0.0, 0.4, 116, { amp: 0.25, decay: 6, harm: [1, 0.5], wave: 'square', slide: -0.6 });
    return b;
  },
  coin: () => {
    const b = buf(0.4);
    tone(b, 0, 0.08, hz(83), { amp: 0.3, decay: 20, harm: [1, 0.4] });
    tone(b, 0.07, 0.33, hz(88), { amp: 0.3, decay: 11, harm: [1, 0.4] });
    return b;
  },
  achievement: () => {
    const b = buf(1.6);
    [67, 72, 76, 79, 84].forEach((m, i) => tone(b, i * 0.11, 0.5, hz(m), { amp: 0.25, decay: 6 }));
    [72, 76, 79, 84].forEach((m) => tone(b, 0.6, 1.0, hz(m), { amp: 0.16, decay: 3.2 }));
    return b;
  },
  death: () => {
    const b = buf(3.2);
    for (let i = 0; i < 3; i++) {
      tone(b, i * 1.0, 1.0, hz(38), { amp: 0.4, decay: 2.2, harm: [1, 0.5, 0.35, 0.2] });
      tone(b, i * 1.0, 1.0, hz(50), { amp: 0.2, decay: 2.6, harm: [1, 0.3] });
    }
    return b;
  },
};

/** ~16s seamless loop: slow Am–F–C–G pad with a soft arpeggio. All partials sit on whole cycles. */
function music(): Float32Array {
  const dur = 16;
  const b = buf(dur);
  const chords = [
    [57, 60, 64],
    [53, 57, 60],
    [48, 52, 55],
    [55, 59, 62],
  ];
  const seg = dur / chords.length;
  chords.forEach((ch, ci) => {
    ch.forEach((m) => {
      // Pad: sine with a long swell that returns to zero at segment edges (loop-safe).
      const f = hz(m);
      const s0 = Math.floor(ci * seg * SR);
      const n = Math.floor(seg * SR);
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const env = Math.sin((Math.PI * i) / n) ** 2;
        const idx = s0 + i;
        b[idx] =
          (b[idx] ?? 0) +
          (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2 * t)) * env * 0.09;
      }
    });
    // Arpeggio, one note every half second, decaying.
    for (let k = 0; k < seg * 2; k++) {
      const m = (ch[k % 3] as number) + 12 + (k % 6 === 5 ? 12 : 0);
      tone(b, ci * seg + k * 0.5, 0.9, hz(m), { amp: 0.07, decay: 4, harm: [1, 0.2] });
    }
  });
  // Fade the final 50ms to zero so the wrap point is click-free.
  const fade = Math.floor(0.05 * SR);
  for (let i = 0; i < fade; i++) {
    const idx = b.length - 1 - i;
    b[idx] = (b[idx] ?? 0) * (i / fade);
  }
  return b;
}

mkdirSync(OUT, { recursive: true });
for (const [name, make] of Object.entries(sounds)) {
  writeFileSync(join(OUT, `${name}.wav`), wav(make()));
}
writeFileSync(join(OUT, 'music.wav'), wav(music()));
console.log(`Wrote ${Object.keys(sounds).length + 1} sounds to ${OUT}`);
