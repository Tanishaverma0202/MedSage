import fs from 'fs';

const content = fs.readFileSync('src/pages/Home.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
for (let i = 0; i < 1695; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // A simple scanner that pushes <div or <motion.div to stack, and pops on </div or </motion.div
  const tagRegex = /<\/?(?:div|motion\.div)\b/g;
  let match;
  let matches = [];
  while ((match = tagRegex.exec(line)) !== null) {
    matches.push({
      type: match[0],
      lineNum,
      content: line.trim()
    });
  }
  
  matches.forEach(m => {
    if (m.type.startsWith('</')) {
      const tag = m.type.substring(2);
      if (stack.length > 0 && stack[stack.length - 1].tag === tag) {
        stack.pop();
      } else {
        // Find matching tag in stack
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
      const tag = m.type.substring(1);
      stack.push({
        tag,
        lineNum: m.lineNum,
        content: m.content
      });
    }
  });
}

console.log("Open tags in stack at line 1695:");
stack.forEach(s => {
  console.log(`Line ${s.lineNum}: ${s.content}`);
});
