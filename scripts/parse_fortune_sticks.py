import re
import json

chinese_num_map = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15, '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
    '二十一': 21, '二十二': 22, '二十三': 23, '二十四': 24, '二十五': 25, '二十六': 26, '二十七': 27, '二十八': 28, '二十九': 29, '三十': 30,
    '三十一': 31, '三十二': 32, '三十三': 33, '三十四': 34, '三十五': 35, '三十六': 36, '三十七': 37, '三十八': 38, '三十九': 39, '四十': 40,
    '四十一': 41, '四十二': 42, '四十三': 43, '四十四': 44, '四十五': 45, '四十六': 46, '四十七': 47, '四十八': 48, '四十九': 49, '五十': 50,
    '五十一': 51, '五十二': 52, '五十三': 53, '五十四': 54, '五十五': 55, '五十六': 56, '五十七': 57, '五十八': 58, '五十九': 59, '六十': 60,
    '六十一': 61, '六十二': 62, '六十三': 63, '六十四': 64, '六十五': 65, '六十六': 66, '六十七': 67, '六十八': 68, '六十九': 69, '七十': 70,
    '七十一': 71, '七十二': 72, '七十三': 73, '七十四': 74, '七十五': 75, '七十六': 76, '七十七': 77, '七十八': 78, '七十九': 79, '八十': 80,
    '八十一': 81, '八十二': 82, '八十三': 83, '八十四': 84, '八十五': 85, '八十六': 86, '八十七': 87, '八十八': 88, '八十九': 89, '九十': 90,
    '九十一': 91, '九十二': 92, '九十三': 93, '九十四': 94, '九十五': 95, '九十六': 96, '九十七': 97, '九十八': 98, '九十九': 99, '一百': 100
}

with open('/Users/david/git/tbdavid2019/qimen/data/skills_reference/yinyuan/references/fortune-sticks.md', 'r', encoding='utf-8') as f:
    text = f.read()

matches = list(re.finditer(r'\*\*第([一二三四五六七八九十百0-9]+)签[·\s]+([^\*\n]+)\*\*', text))

items = []
for i, m in enumerate(matches):
    num_str = m.group(1).strip()
    grade = m.group(2).strip()
    start_pos = m.start()
    end_pos = matches[i+1].start() if i + 1 < len(matches) else len(text)
    chunk = text[start_pos:end_pos]
    
    num = chinese_num_map.get(num_str, int(num_str) if num_str.isdigit() else i + 1)
    
    # Extract poem from ```...```
    poem_m = re.search(r'```(.*?)```', chunk, re.DOTALL)
    if poem_m:
        poem = '\n'.join([line.strip() for line in poem_m.group(1).strip().split('\n') if line.strip()])
    else:
        lines = chunk.split('\n')[1:]
        poem_lines = []
        for l in lines:
            if l.startswith('签解') or l.startswith('姻缘解读') or l.startswith('---') or l.startswith('###'):
                break
            if l.strip():
                poem_lines.append(l.strip())
        poem = '\n'.join(poem_lines)
    
    explanation_m = re.search(r'签解[：:]([^\n]+)', chunk)
    explanation = explanation_m.group(1).strip() if explanation_m else ''
    
    reading_m = re.search(r'姻缘解读[：:]([^\n]+)', chunk)
    reading = reading_m.group(1).strip() if reading_m else ''
    
    title = f'{grade}籤' if not grade.endswith('籤') and not grade.endswith('签') else grade
    
    items.append({
        'number': num,
        'title': title,
        'grade': grade,
        'poem': poem,
        'explanation': explanation or f'此籤為「{grade}」之象，緣分自有天時。',
        'reading': reading or f'感情路上順應心意，真誠以待，自得良緣。'
    })

print(f'Parsed {len(items)} sticks.')
with open('/Users/david/git/tbdavid2019/qimen/data/fortune-sticks-100.json', 'w', encoding='utf-8') as out:
    json.dump(items, out, ensure_ascii=False, indent=2)

print('Stick 1:', items[0])
print('Stick 50:', items[49])
print('Stick 100:', items[99])
