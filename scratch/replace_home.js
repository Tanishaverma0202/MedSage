import fs from 'fs';

const path = 'src/pages/Home.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Lines are 1-indexed. We want to remove lines 1383 to 1694 inclusive.
// 0-indexed range to remove: from index 1382 to 1693 inclusive.
const startIdx = 1382; // line 1383
const endIdx = 1693;   // line 1694

const removedLines = lines.slice(startIdx, endIdx + 1);
console.log("Removing the following lines:");
console.log("First line:", removedLines[0]);
console.log("Last line:", removedLines[removedLines.length - 1]);
console.log("Total lines to remove:", removedLines.length);

lines.splice(startIdx, endIdx - startIdx + 1);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log("Successfully wrote updated Home.tsx!");
