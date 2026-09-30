with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re
# Find all occurrences of #guitarCanvas
matches = re.findall(r'#guitarCanvas\s*\{[^}]+\}', css)
for m in matches:
    print('--- MATCH ---')
    print(m)
