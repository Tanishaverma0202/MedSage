import fs from 'fs';

const content = fs.readFileSync('src/pages/Home.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
for (let i = 0; i < 1658; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  const tagRegex = /<\/?(?:div|motion\.div)\b/g;
  let match;
  while ((match = tagRegex.exec(line)) !== null) {
    const type = match[0];
    if (type.startsWith('</')) {
      const tag = type.substring(2);
      if (stack.length > 0 && stack[stack.length - 1].tag === tag) {
        stack.pop();
      } else {
        let foundIdx = -1;
        for (let j = stack.length - 1; j >= 0; j--) {
          if (stack[j].tag === tag) {
            foundIdx = j;
            break;
          }
        }
        if (foundIdx !== -1) {
          stack.splice(foundIdx, 1);
        }
      }
    } else {
      const tag = type.substring(1);
      stack.push({ tag, lineNum, content: line.trim() });
    }
  }
}

console.log("Remaining open tag in stack (the parent of line 1658 close):");
if (stack.length > 0) {
  const last = stack[stack.length - 1];
  console.log(`Line ${last.lineNum}: ${last.content}`);
} else {
  console.log("Stack is empty!");
}
