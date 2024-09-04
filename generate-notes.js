const fs = require("fs");

const noteNames = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const baseFrequency = 440; // A4

let noteFrequencies = {};

// Generate frequencies for each note from C0 to C12
for (let octave = -4; octave <= 12; octave++) {
  for (let i = 0; i < noteNames.length; i++) {
    const noteNumber = i + octave * 12 + 1;
    const frequency = baseFrequency * Math.pow(2, (noteNumber - 49) / 12);
    const note = `${noteNames[i]}${octave}`;
    noteFrequencies[note] = parseFloat(frequency.toFixed(2));
  }
}

// Write to a JSON file
fs.writeFileSync(
  "note_frequencies.json",
  JSON.stringify(noteFrequencies, null, 2)
);

console.log("note_frequencies.json has been created.");
