import pypdf, re, json, os

pdf_path = r'C:\Users\user\.gemini\antigravity\brain\90136d1c-ba49-4643-9d75-62c69c48192b\.user_uploaded\media_1790767548996.pdf'
reader = pypdf.PdfReader(pdf_path)

blocks_map = {
    'BADERAJPUR': 'बड़ेराजपुर',
    'KESHKAL': 'केशकाल',
    'KONDAGAON': 'कोण्डागांव',
    'MAKADI': 'माकड़ी',
    'PHARASGAON': 'फरसगांव'
}

category_prefixes = [
    '10 - Secondary with Higher Secondary',
    '8 - Secondary Only',
    '7 - Upper Pr. and Secondary',
    '6 - Pr. Up Pr. and Secondary Only',
    '5 - Up. Pr. Secondary and Higher Sec',
    '4 - Upper Primary only',
    '3 - Pr. with Up.Pr. sec. and H.Sec.',
    '2 - Primary with Upper Primary',
    '1 - Primary'
]

prefixes_to_strip = [
    r'SWAMI\s+ATMANAND\s+GOVT\s+(ENGLISH|HINDI)\s+MEDIUM\s+SCHOOL',
    r'SWAMI\s+ATMANAND\s+GOVT\s+(ENGLISH|HINDI)\s+MEDIUM',
    r'SWAMI\s+ATMANAND\s+GOVT\s+ENGLISH\s+MEDIUM\s+SCHOOL',
    r'SWAMI\s+ATMANAND\s+GOVT\s+HINDI\s+MEDIUM\s+SCHOOL',
    r'SWAMI\s+ATMANAND\s+ENGLISH\s+MEDIUM\s+SCHOOL',
    r'SWAMI\s+ATMANAND\s+HINDI\s+MEDIUM\s+SCHOOL',
    r'SWAMI\s+ATMANAND',
    r'GOVT\.SSA\.NAVEEN\s+PS', r'GOVT\.SSA\.NAVIN\s+PS', r'GOVT\.SSA\.GJ\s+PS',
    r'GOVT\.SSA\.PS', r'GOVT\.SSA\.UPS', r'GOVT\.SSA\.MS', r'GOVT\.SSA',
    r'GOVT\.TWD\.MS', r'GOVT\.TWD\.PS', r'GOVT\.TWD\.UPS', r'GOVT\.TWD',
    r'GOVT\.EDU\.PS', r'GOVT\.EDU\.MS', r'GOVT\.EDU\.UPS', r'GOVT\.EDU\s+JPS', r'GOVT\.EDU\s+PS', r'GOVT\.EDU',
    r'GOVT\.JANPAD\s+PS', r'GOVT\.JANPAD', r'GOVT\.GJ\s+PS', r'GOVT\.GJ', r'GOVT\.TRIBAL\s+PS', r'GOVT\.TRIBAL',
    r'GOVT\.PRI\.SCH\.', r'GOVT\.PRI\.SCH', r'GOVT\.HIGH\s+SCHOOL\.', r'GOVT\.HIGH\s+SCHOOL',
    r'GOVT\.HIGHER\s+SECONDARY\s+SCHOOL', r'GOVT\.HIGHER\s+SECONDRY\s+SCHOOL', r'GOVT\.MIDDLE\s+SCHOOL', r'GOVT\.PRIMARY\s+SCHOOL',
    r'GOVT\.UPS\.', r'GOVT\.UPS', r'GOVT\.MS\.', r'GOVT\.MS', r'GOVT\.PS\.', r'GOVT\.PS', r'GOVT\.H\.S\.', r'GOVT\s+H\.S\.',
    r'GOVT\.', r'GOVT', r'SSA\.', r'SSA', r'TWD\.', r'TWD', r'EDU\.', r'EDU', r'JANPAD', r'GJ'
]

prefix_re = re.compile(r'^\s*(?:' + '|'.join(prefixes_to_strip) + r')[\.\s]*', re.I)

def strip_prefixes(text):
    prev = ''
    curr = text
    while curr != prev:
        prev = curr
        curr = prefix_re.sub('', curr).strip()
    return curr

# Extract records layout-wise
all_records = []
for page_num, page in enumerate(reader.pages):
    lines_by_y = {}
    def visitor_text(text, cm, tm, font_dict, font_size):
        if text.strip():
            y = round(tm[5], 1)
            x = round(tm[4], 1)
            lines_by_y.setdefault(y, []).append((x, text.strip()))

    page.extract_text(visitor_text=visitor_text)

    y_keys = sorted(lines_by_y.keys(), reverse=True)
    rows = []
    for y in y_keys:
        items = sorted(lines_by_y[y], key=lambda item: item[0])
        if rows and abs(rows[-1]['y'] - y) < 3:
            rows[-1]['items'].extend(items)
        else:
            rows.append({'y': y, 'items': items})

    for r in rows:
        r['items'].sort(key=lambda item: item[0])

    current_school_parts = []
    for r in rows:
        row_str = ' '.join([it[1] for it in r['items']])
        if 'School_Name' in row_str or 'Lgd_Panchayat_Name' in row_str:
            continue
        
        block_item = None
        block_x = -1
        for item in r['items']:
            if item[1] in blocks_map:
                block_item = item[1]
                block_x = item[0]
                break
        
        if block_item:
            school_parts_row = [it[1] for it in r['items'] if it[0] < block_x - 10]
            full_school_name = ' '.join(current_school_parts + school_parts_row).strip()
            after_block = ' '.join([it[1] for it in r['items'] if it[0] > block_x + 10]).strip()
            
            cat_found = ''
            panchayat_found = ''
            for c_prefix in category_prefixes:
                if after_block.startswith(c_prefix):
                    cat_found = c_prefix
                    panchayat_found = after_block[len(c_prefix):].strip()
                    break
            
            if not cat_found:
                cat_found = 'Other'
                panchayat_found = after_block
            
            all_records.append({
                'school_raw': full_school_name,
                'block_en': block_item,
                'block_hi': blocks_map[block_item],
                'category_raw': cat_found,
                'panchayat_en': panchayat_found
            })
            current_school_parts = []
        else:
            school_parts = [it[1] for it in r['items'] if it[0] < 250]
            if school_parts:
                current_school_parts.append(' '.join(school_parts))

print(f"Total raw records extracted: {len(all_records)}")

# Write raw json for verification
with open('f:/Website/Nodel/scripts/extracted_schools.json', 'w', encoding='utf-8') as f:
    json.dump(all_records, f, ensure_ascii=False, indent=2)
