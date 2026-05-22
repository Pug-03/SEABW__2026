const fs = require('fs');
const path = require('path');

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"') {
      if (inQuote && next === '"') { cell += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      row.push(cell); cell = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (ch === '\r' && next === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(c => c.trim())) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) { row.push(cell); if (row.some(c => c.trim())) rows.push(row); }
  return rows;
}

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim();
}

function escTs(s) {
  return (s || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ');
}

const catMap = {
  'แหล่งท่องเที่ยวทางธรรมชาติ': 'nature',
  'แหล่งท่องเที่ยวทางประวัติศาสตร์ และวัฒนธรรม': 'culture',
  'แหล่งท่องเที่ยวสำหรับกิจกรรมพิเศษ นันทนาการ และความสนใจพิเศษ': 'activity',
  'แหล่งท่องเที่ยวเชิงเกษตร': 'agro',
};

const regionMap = {
  'ภาคเหนือ': 'Northern Thailand',
  'ภาคกลาง': 'Central Thailand',
  'ภาคตะวันออก': 'Eastern Thailand',
  'ภาคตะวันออกเฉียงเหนือ': 'Northeastern Thailand',
  'ภาคใต้': 'Southern Thailand',
  'ภาคตะวันตก': 'Western Thailand',
};

const content = fs.readFileSync('C:/Users/Pug/Downloads/attraction.csv', 'utf8');
const rows = parseCSV(content);
const header = rows[0];
const idx = {};
header.forEach((h, i) => { idx[h.trim()] = i; });

const validRows = rows.slice(1).filter(r => r[0] && /^2025/.test(r[0]) && r.length >= 50);
console.log('Valid rows:', validRows.length);

const attractions = validRows.map((r, i) => {
  const locStr = r[idx['ATT_LOCATION']] || '';
  const coords = locStr.match(/([-\d.]+),\s*([-\d.]+)/);
  const descRaw = r[idx['ATT_DETAIL_EN']] || r[idx['ATT_DETAIL_TH']] || '';
  const descEn = stripHtml(descRaw).slice(0, 450);
  const nameEn = (r[idx['ATT_NAME_EN']] || r[idx['ATT_NAME_TH']] || '').trim();
  const nameTh = (r[idx['ATT_NAME_TH']] || '').trim();
  const catLabel = (r[idx['ATT_CATEGORY_LABEL']] || '').trim();
  const typeLabel = (r[idx['ATT_TYPE_LABEL']] || '').trim();
  const province = (r[idx['PROVINCE_NAME_TH']] || '').trim();
  const district = (r[idx['DISTRICT_NAME_TH']] || '').trim();
  const regionTh = (r[idx['REGION_NAME_TH']] || '').trim();
  const region = regionMap[regionTh] || regionTh;
  const phone = (r[idx['ATT_TEL']] || '').replace(/\s+/g, ' ').trim();
  const website = (r[idx['ATT_WEBSITE']] || '').trim();
  const openHours = (r[idx['ATT_START_END']] || '').replace(/\s+/g, ' ').trim();
  const lat = coords ? parseFloat(coords[1]) : null;
  const lng = coords ? parseFloat(coords[2]) : null;

  return { id: `att-${String(i + 1).padStart(3, '0')}`, nameEn, nameTh, descEn, province, district, region, category: catMap[catLabel] || 'other', categoryLabel: catLabel, typeLabel, lat, lng, phone, website, openHours };
});

// Build TypeScript output
let out = `// AUTO-GENERATED from attraction.csv — ${new Date().toISOString().slice(0,10)}
// ${attractions.length} Thai tourist attractions from the Tourism Authority of Thailand dataset
import type { Attraction } from "./types";

export const ATTRACTIONS: Attraction[] = [\n`;

for (const a of attractions) {
  out += `  {\n`;
  out += `    id: "${escTs(a.id)}",\n`;
  out += `    nameEn: "${escTs(a.nameEn)}",\n`;
  out += `    nameTh: "${escTs(a.nameTh)}",\n`;
  out += `    descriptionEn: "${escTs(a.descEn)}",\n`;
  out += `    province: "${escTs(a.province)}",\n`;
  out += `    district: "${escTs(a.district)}",\n`;
  out += `    region: "${escTs(a.region)}",\n`;
  out += `    category: "${a.category}",\n`;
  out += `    categoryLabel: "${escTs(a.categoryLabel)}",\n`;
  out += `    typeLabel: "${escTs(a.typeLabel)}",\n`;
  if (a.lat !== null && a.lng !== null) {
    out += `    coords: { lat: ${a.lat}, lng: ${a.lng} },\n`;
  } else {
    out += `    coords: null,\n`;
  }
  if (a.phone) out += `    phone: "${escTs(a.phone)}",\n`;
  if (a.website) out += `    website: "${escTs(a.website)}",\n`;
  if (a.openHours) out += `    openHours: "${escTs(a.openHours)}",\n`;
  out += `  },\n`;
}

out += `];\n`;

const outPath = path.join('C:/VS_Code_Pug/SEABW__2026/src/lib/attractions-data.ts');
fs.writeFileSync(outPath, out, 'utf8');
console.log('Written to:', outPath);
console.log('File size KB:', Math.round(out.length / 1024));

// Print category/region summary
const cats = {};
const regs = {};
attractions.forEach(a => { cats[a.category] = (cats[a.category]||0)+1; regs[a.region] = (regs[a.region]||0)+1; });
console.log('Categories:', JSON.stringify(cats));
console.log('Regions:', JSON.stringify(regs));
console.log('With coords:', attractions.filter(a => a.lat !== null).length);
