import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

ids_in_js = re.findall(r'getElementById\(["\']([^"\']+)["\']\)', app_js)
print(f"Found {len(ids_in_js)} getElementById calls ({len(set(ids_in_js))} unique).")

missing = []
for el_id in sorted(set(ids_in_js)):
    if f'id="{el_id}"' not in index_html and f"id='{el_id}'" not in index_html:
        missing.append(el_id)

print("Missing IDs:", missing)
