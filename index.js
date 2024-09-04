const fs = require("fs");

// Note to frequency mapping (in Hz)
const noteFrequencies = JSON.parse(
  fs.readFileSync("note_frequencies.json", "utf-8")
);

var offset = 0;
// Read and parse the melody file
const melody = fs
  .readFileSync("melody.mel", "utf-8")
  .split("\r\n")
  .filter((line) => !line.trim().startsWith("//"))
  .filter((line, i) => {
    if (i == 0) {
      offset = parseFloat(line.trim().replace(/base=/, "").trim());
      if (isNaN(offset)) offset = 0;
      return false;
    }
    const [noteOrFreq, duration] = line.split("#");

    if (!noteOrFreq || !duration) return false;

    return (
      (!isNaN(parseFloat(noteOrFreq)) ||
        noteFrequencies[noteOrFreq] !== undefined) &&
      !isNaN(parseFloat(duration))
    );
  })
  .map((line) => {
    const [noteOrFreq, duration] = line.split("#");
    const frequency = isNaN(parseFloat(noteOrFreq))
      ? noteFrequencies[noteOrFreq]
      : parseFloat(noteOrFreq);
    return [frequency, parseFloat(duration)];
  });

const sampleRate = 44100; // Standard sample rate (44.1kHz)
const amplitude = 32760; // Maximum amplitude for 16-bit audio

// Calculate total duration
const totalDuration = melody.reduce(
  (total, [_, duration]) => total + duration,
  0
);
const numSamples = Math.floor(sampleRate * totalDuration);

// Allocate buffers
const header = Buffer.alloc(44); // WAV header
const data = Buffer.alloc(numSamples * 2); // Audio data (16-bit = 2 bytes per sample)

// Write WAV header
header.write("RIFF", 0);
header.writeUInt32LE(36 + numSamples * 2, 4); // Total size
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16); // PCM format
header.writeUInt16LE(1, 20); // Audio format (PCM)
header.writeUInt16LE(1, 22); // Mono
header.writeUInt32LE(sampleRate, 24); // Sample rate
header.writeUInt32LE(sampleRate * 2, 28); // Byte rate (sampleRate * NumChannels * BitsPerSample / 8)
header.writeUInt16LE(2, 32); // Block align
header.writeUInt16LE(16, 34); // Bits per sample (16 bits)
header.write("data", 36);
header.writeUInt32LE(numSamples * 2, 40); // Data chunk size

// Generate sine wave audio data for each melody part
let sampleIndex = 0;
melody.forEach(([frequency, duration]) => {
  const numNoteSamples = Math.floor(sampleRate * duration); // Number of samples for this note

  for (let i = 0; i < numNoteSamples; i++) {
    const sample =
      Math.sin(2 * Math.PI * (frequency + offset) * (i / sampleRate)) *
      amplitude;
    data.writeInt16LE(sample, sampleIndex * 2); // Write 16-bit sample
    sampleIndex++;
  }
});

// Combine header and data
const wavBuffer = Buffer.concat([header, data]);

// Write the WAV file
const filename = "out.wav";
fs.writeFileSync(filename, wavBuffer);
