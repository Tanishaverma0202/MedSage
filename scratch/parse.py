import re

def parse_tags(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    stack = []
    for idx, line in enumerate(lines):
        line_num = idx + 1
        # Find div open tags
        opens = re.findall(r'<div\b', line)
        closes = re.findall(r'</div\b', line)
        motion_opens = re.findall(r'<motion\.div\b', line)
        motion_closes = re.findall(r'</motion\.div\b', line)
        
        for _ in opens:
            stack.append(('div', line_num, line.strip()))
        for _ in motion_opens:
            stack.append(('motion.div', line_num, line.strip()))
            
        for _ in closes:
            if stack:
                tag, start_line, orig = stack.pop()
                if tag == 'div':
                    print(f"Match: div {start_line} -> {line_num} | {orig}")
                else:
                    print(f"Mismatch close: div at {line_num} closes {tag} from {start_line}")
            else:
                print(f"Unmatched close: div at {line_num}")
                
        for _ in motion_closes:
            if stack:
                tag, start_line, orig = stack.pop()
                if tag == 'motion.div':
                    print(f"Match: motion.div {start_line} -> {line_num} | {orig}")
                else:
                    print(f"Mismatch close: motion.div at {line_num} closes {tag} from {start_line}")
            else:
                print(f"Unmatched close: motion.div at {line_num}")

parse_tags('c:/Users/DELL/OneDrive/Desktop/Tanisha/MedSage 15/src/pages/Home.tsx')
