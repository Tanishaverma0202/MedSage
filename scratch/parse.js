import fs from 'fs';

const content = fs.readFileSync('src/pages/Home.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, index) => {
  const lineNum = index + 1;
  
  // A simple regex to find open and close tags of interest (div, motion.div)
  // Note: We need to handle tags that open/close on the same line separately if we want precision,
  // but for tracing hierarchy, we can look at match sequences.
  
  let matches = [];
  // Find all matches in order of occurrence
  const tagRegex = /<\/?(?:div|motion\.div)\b/g;
  let match;
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
      if (stack.length > 0) {
        const last = stack.pop();
        if (last.tag === tag) {
          console.log(`Match: ${tag} ${last.lineNum} -> ${m.lineNum} | ${last.content}`);
        } else {
          console.log(`Mismatch: close ${tag} at ${m.lineNum} closes ${last.tag} from ${last.lineNum} | ${m.content}`);
        }
      } else {
        console.log(`Unmatched close: ${tag} at ${m.lineNum} | ${m.content}`);
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
});
