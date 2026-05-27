/**
 * Generates 10,000 realistic Thai accommodation records.
 * Run: node scripts/generate-hotels.js
 * Output: src/data/hotels.json
 */
const fs = require("fs");
const path = require("path");

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function lcg(seed) {
  let s = Math.abs(seed % 233280);
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function pick(arr, rand) { return arr[Math.floor(rand() * arr.length)]; }
function range(lo, hi, rand) { return lo + Math.floor(rand() * (hi - lo + 1)); }

// ─── Province data ────────────────────────────────────────────────────────────
const PROVINCES = [
  // Central / Bangkok
  { id: "bangkok",         name: "Bangkok",                    lat: 13.7563, lng: 100.5018, region: "Central Thailand",       w: 18, scatter: 0.20, ac: "02",  districts: ["Pathum Wan","Silom","Sukhumvit","Siam","Sathorn","Lumpini","Bang Rak","Ratchada","Chatuchak","Lat Phrao","Huai Khwang","Min Buri","Bang Na","Prawet"] },
  { id: "nonthaburi",      name: "Nonthaburi",                  lat: 13.8591, lng: 100.5159, region: "Central Thailand",       w:  2, scatter: 0.08, ac: "02",  districts: ["Mueang Nonthaburi","Bang Bua Thong","Pak Kret"] },
  { id: "pathum-thani",    name: "Pathum Thani",                lat: 14.0208, lng: 100.5251, region: "Central Thailand",       w:  1, scatter: 0.12, ac: "02",  districts: ["Mueang Pathum Thani","Khlong Luang","Thanyaburi"] },
  { id: "ayutthaya",       name: "Phra Nakhon Si Ayutthaya",   lat: 14.3532, lng: 100.5679, region: "Central Thailand",       w:  3, scatter: 0.15, ac: "035", districts: ["Phra Nakhon Si Ayutthaya","Bang Pa-in","Uthai"] },
  { id: "nakhon-pathom",   name: "Nakhon Pathom",               lat: 13.8199, lng: 100.0464, region: "Central Thailand",       w:  1, scatter: 0.12, ac: "034", districts: ["Mueang Nakhon Pathom","Sam Phran","Nakhon Chai Si"] },
  { id: "samut-prakan",    name: "Samut Prakan",                lat: 13.5991, lng: 100.5978, region: "Central Thailand",       w:  1, scatter: 0.10, ac: "02",  districts: ["Mueang Samut Prakan","Bang Phli","Bang Bo"] },
  { id: "saraburi",        name: "Saraburi",                    lat: 14.5289, lng: 100.9105, region: "Central Thailand",       w:  1, scatter: 0.15, ac: "036", districts: ["Mueang Saraburi","Kaeng Khoi","Nong Khae"] },
  { id: "lopburi",         name: "Lopburi",                     lat: 14.7995, lng: 100.6534, region: "Central Thailand",       w:  2, scatter: 0.15, ac: "036", districts: ["Mueang Lopburi","Phatthana Nikhom","Khok Samrong"] },
  { id: "suphan-buri",     name: "Suphan Buri",                 lat: 14.4744, lng: 100.1178, region: "Central Thailand",       w:  1, scatter: 0.18, ac: "035", districts: ["Mueang Suphan Buri","U Thong","Song Phi Nong"] },

  // Western
  { id: "kanchanaburi",    name: "Kanchanaburi",                lat: 14.0058, lng: 99.5321,  region: "Central Thailand",       w:  3, scatter: 0.30, ac: "034", districts: ["Mueang Kanchanaburi","Tha Maka","Sai Yok","Sangkhla Buri","Erawan"] },
  { id: "ratchaburi",      name: "Ratchaburi",                  lat: 13.5282, lng: 99.8134,  region: "Central Thailand",       w:  1, scatter: 0.18, ac: "032", districts: ["Mueang Ratchaburi","Damnoen Saduak","Ban Pong"] },
  { id: "phetchaburi",     name: "Phetchaburi",                 lat: 13.1119, lng: 99.9395,  region: "Central Thailand",       w:  2, scatter: 0.18, ac: "032", districts: ["Mueang Phetchaburi","Cha-am","Khao Yoi"] },
  { id: "prachuap",        name: "Prachuap Khiri Khan (Hua Hin)",lat:12.5706, lng: 99.9576,  region: "Central Thailand",       w:  4, scatter: 0.25, ac: "032", districts: ["Hua Hin","Pranburi","Kui Buri","Thap Sakae"] },

  // Northern
  { id: "chiang-mai",      name: "Chiang Mai",                  lat: 18.7883, lng: 98.9853,  region: "Northern Thailand",      w: 10, scatter: 0.40, ac: "053", districts: ["Mueang","Doi Saket","Mae Rim","Hang Dong","San Kamphaeng","Doi Tao","Fang","Mae Taeng","Samoeng","Pai (Mae Hong Son)"] },
  { id: "chiang-rai",      name: "Chiang Rai",                  lat: 19.9105, lng: 99.8406,  region: "Northern Thailand",      w:  4, scatter: 0.40, ac: "053", districts: ["Mueang","Chiang Saen","Mae Sai","Mae Chan","Chiang Khong","Wiang Pa Pao"] },
  { id: "mae-hong-son",    name: "Mae Hong Son",                lat: 19.3020, lng: 97.9654,  region: "Northern Thailand",      w:  2, scatter: 0.28, ac: "053", districts: ["Mueang","Pai","Mae Sariang","Khun Yuam"] },
  { id: "lampang",         name: "Lampang",                     lat: 18.2889, lng: 99.4908,  region: "Northern Thailand",      w:  2, scatter: 0.22, ac: "054", districts: ["Mueang Lampang","Mae Mo","Wang Nuea"] },
  { id: "lamphun",         name: "Lamphun",                     lat: 18.5739, lng: 99.0087,  region: "Northern Thailand",      w:  1, scatter: 0.15, ac: "053", districts: ["Mueang Lamphun","Li","Mae Tha"] },
  { id: "nan",             name: "Nan",                         lat: 18.7756, lng: 100.7730, region: "Northern Thailand",      w:  2, scatter: 0.28, ac: "054", districts: ["Mueang Nan","Pua","Bo Kluea","Thung Chang"] },
  { id: "phrae",           name: "Phrae",                       lat: 18.1445, lng: 100.1406, region: "Northern Thailand",      w:  1, scatter: 0.18, ac: "054", districts: ["Mueang Phrae","Song","Den Chai"] },
  { id: "uttaradit",       name: "Uttaradit",                   lat: 17.6200, lng: 100.0996, region: "Northern Thailand",      w:  1, scatter: 0.18, ac: "055", districts: ["Mueang Uttaradit","Tron","Phichai"] },
  { id: "sukhothai",       name: "Sukhothai",                   lat: 17.0078, lng: 99.8264,  region: "Northern Thailand",      w:  3, scatter: 0.18, ac: "055", districts: ["Mueang Sukhothai","Si Satchanalai","Sawankhalok","Si Samrong"] },
  { id: "phitsanulok",     name: "Phitsanulok",                 lat: 16.8211, lng: 100.2659, region: "Northern Thailand",      w:  2, scatter: 0.18, ac: "055", districts: ["Mueang Phitsanulok","Bang Rakam","Phrom Phiram"] },
  { id: "kamphaeng-phet",  name: "Kamphaeng Phet",              lat: 16.4827, lng: 99.5226,  region: "Northern Thailand",      w:  1, scatter: 0.18, ac: "055", districts: ["Mueang Kamphaeng Phet","Khanu Woralaksaburi"] },
  { id: "tak",             name: "Tak",                         lat: 16.8660, lng: 99.1259,  region: "Northern Thailand",      w:  1, scatter: 0.25, ac: "055", districts: ["Mueang Tak","Mae Sot","Umphang","Lansang"] },
  { id: "phichit",         name: "Phichit",                     lat: 16.4419, lng: 100.3489, region: "Northern Thailand",      w:  1, scatter: 0.15, ac: "056", districts: ["Mueang Phichit","Bang Mun Nak","Taphan Hin"] },
  { id: "nakhon-sawan",    name: "Nakhon Sawan",                lat: 15.6980, lng: 100.1304, region: "Central Thailand",       w:  1, scatter: 0.18, ac: "056", districts: ["Mueang Nakhon Sawan","Phak Hai","Takhli"] },
  { id: "uthai-thani",     name: "Uthai Thani",                 lat: 15.3835, lng: 100.0255, region: "Central Thailand",       w:  1, scatter: 0.18, ac: "056", districts: ["Mueang Uthai Thani","Nong Chang","Ban Rai"] },

  // Eastern
  { id: "chonburi",        name: "Chonburi (Pattaya)",          lat: 12.9236, lng: 100.8825, region: "Eastern Thailand",       w:  7, scatter: 0.20, ac: "038", districts: ["Pattaya","Bang Lamung","Si Racha","Mueang Chonburi","Sattahip","Bang Sare"] },
  { id: "rayong",          name: "Rayong",                      lat: 12.6814, lng: 101.2816, region: "Eastern Thailand",       w:  3, scatter: 0.20, ac: "038", districts: ["Mueang Rayong","Ban Chang","Klaeng","Mae Phim"] },
  { id: "chanthaburi",     name: "Chanthaburi",                 lat: 12.6127, lng: 102.1037, region: "Eastern Thailand",       w:  2, scatter: 0.20, ac: "039", districts: ["Mueang Chanthaburi","Tha Mai","Kaeng Hang Maeo"] },
  { id: "trat",            name: "Trat (Koh Chang)",            lat: 12.0752, lng: 102.3290, region: "Eastern Thailand",       w:  3, scatter: 0.25, ac: "039", districts: ["Koh Chang","Mueang Trat","Koh Kut","Laem Ngop"] },
  { id: "nakhon-nayok",    name: "Nakhon Nayok",                lat: 14.2069, lng: 101.2130, region: "Eastern Thailand",       w:  1, scatter: 0.15, ac: "037", districts: ["Mueang Nakhon Nayok","Pak Phli","Ban Na"] },
  { id: "prachin-buri",    name: "Prachin Buri",                lat: 14.0506, lng: 101.3716, region: "Eastern Thailand",       w:  1, scatter: 0.18, ac: "037", districts: ["Mueang Prachin Buri","Kabin Buri","Na Di"] },
  { id: "sa-kaeo",         name: "Sa Kaeo",                     lat: 13.8247, lng: 102.0647, region: "Eastern Thailand",       w:  1, scatter: 0.20, ac: "037", districts: ["Mueang Sa Kaeo","Aranyaprathet","Wang Nam Yen"] },

  // Southern
  { id: "phuket",          name: "Phuket",                      lat:  7.8804, lng:  98.3923, region: "Southern Thailand",      w: 10, scatter: 0.12, ac: "076", districts: ["Patong","Kata","Karon","Rawai","Kamala","Surin","Bang Tao","Cherng Talay","Mueang Phuket","Kathu","Nai Harn","Cape Panwa"] },
  { id: "krabi",           name: "Krabi",                       lat:  8.0863, lng:  98.9063, region: "Southern Thailand",      w:  5, scatter: 0.30, ac: "075", districts: ["Ao Nang","Koh Lanta","Railay","Mueang Krabi","Koh Phi Phi","Noppharat Thara"] },
  { id: "phang-nga",       name: "Phang Nga",                   lat:  8.4509, lng:  98.5266, region: "Southern Thailand",      w:  3, scatter: 0.28, ac: "076", districts: ["Mueang Phang Nga","Takua Pa","Khao Lak","Koh Yao","Thai Mueang"] },
  { id: "surat-thani",     name: "Surat Thani (Koh Samui)",     lat:  9.5120, lng: 100.0136, region: "Southern Thailand",      w:  6, scatter: 0.40, ac: "077", districts: ["Koh Samui","Koh Phangan","Koh Tao","Mueang Surat Thani","Chaiya","Phunphin"] },
  { id: "nakhon-st",       name: "Nakhon Si Thammarat",         lat:  8.4321, lng: 100.0036, region: "Southern Thailand",      w:  2, scatter: 0.28, ac: "075", districts: ["Mueang Nakhon Si Thammarat","Pak Phanang","Cha-uat","Tha Sala"] },
  { id: "trang",           name: "Trang",                       lat:  7.5591, lng:  99.6114, region: "Southern Thailand",      w:  3, scatter: 0.22, ac: "075", districts: ["Mueang Trang","Koh Libong","Kantang","Sikao","Palian"] },
  { id: "satun",           name: "Satun",                       lat:  6.6238, lng: 100.0673, region: "Southern Thailand",      w:  2, scatter: 0.20, ac: "074", districts: ["Mueang Satun","La-ngu","Thung Wa","Koh Lipe"] },
  { id: "songkhla",        name: "Songkhla (Hat Yai)",          lat:  7.0061, lng: 100.4748, region: "Southern Thailand",      w:  3, scatter: 0.25, ac: "074", districts: ["Hat Yai","Mueang Songkhla","Singhanakhon","Na Mom"] },
  { id: "chumphon",        name: "Chumphon",                    lat: 10.4930, lng:  99.1800, region: "Southern Thailand",      w:  2, scatter: 0.22, ac: "077", districts: ["Mueang Chumphon","Pak Nam Chumphon","Thung Tako","Sawi"] },
  { id: "ranong",          name: "Ranong",                      lat:  9.9529, lng:  98.6085, region: "Southern Thailand",      w:  1, scatter: 0.20, ac: "077", districts: ["Mueang Ranong","Kra Buri","Kapoe"] },
  { id: "phatthalung",     name: "Phatthalung",                 lat:  7.6167, lng: 100.0741, region: "Southern Thailand",      w:  1, scatter: 0.18, ac: "074", districts: ["Mueang Phatthalung","Tamot","Khuan Khanun"] },

  // Northeastern
  { id: "nakhon-rat",      name: "Nakhon Ratchasima",           lat: 14.9799, lng: 102.0977, region: "Northeastern Thailand",  w:  4, scatter: 0.28, ac: "044", districts: ["Mueang Nakhon Ratchasima","Pak Chong","Sikhio","Bua Yai","Dan Khun Thot"] },
  { id: "khon-kaen",       name: "Khon Kaen",                   lat: 16.4419, lng: 102.8360, region: "Northeastern Thailand",  w:  3, scatter: 0.22, ac: "043", districts: ["Mueang Khon Kaen","Ban Phai","Chum Phae","Phu Wiang"] },
  { id: "udon-thani",      name: "Udon Thani",                  lat: 17.4082, lng: 102.7870, region: "Northeastern Thailand",  w:  3, scatter: 0.22, ac: "042", districts: ["Mueang Udon Thani","Nong Han","Ban Dung","Kumphawapi"] },
  { id: "nong-khai",       name: "Nong Khai",                   lat: 17.8782, lng: 102.7458, region: "Northeastern Thailand",  w:  2, scatter: 0.20, ac: "042", districts: ["Mueang Nong Khai","Tha Bo","Sangkhom","Si Chiang Mai"] },
  { id: "ubon-rat",        name: "Ubon Ratchathani",            lat: 15.2448, lng: 104.8473, region: "Northeastern Thailand",  w:  2, scatter: 0.22, ac: "045", districts: ["Mueang Ubon Ratchathani","Warin Chamrap","Det Udom","Si Mueang Mai"] },
  { id: "loei",            name: "Loei",                        lat: 17.4860, lng: 101.7223, region: "Northeastern Thailand",  w:  2, scatter: 0.28, ac: "042", districts: ["Mueang Loei","Chiang Khan","Pak Chom","Dan Sai","Phu Kradueng"] },
  { id: "buriram",         name: "Buri Ram",                    lat: 14.9930, lng: 103.1029, region: "Northeastern Thailand",  w:  2, scatter: 0.22, ac: "044", districts: ["Mueang Buri Ram","Nang Rong","Prakhon Chai","Khu Mueang"] },
  { id: "surin",           name: "Surin",                       lat: 14.8820, lng: 103.4930, region: "Northeastern Thailand",  w:  1, scatter: 0.20, ac: "044", districts: ["Mueang Surin","Prasat","Tha Tum","Sangkha"] },
  { id: "sisaket",         name: "Si Sa Ket",                   lat: 15.1186, lng: 104.3221, region: "Northeastern Thailand",  w:  1, scatter: 0.20, ac: "045", districts: ["Mueang Si Sa Ket","Kantharalak","Uthumphon Phisai"] },
  { id: "roi-et",          name: "Roi Et",                      lat: 16.0536, lng: 103.6520, region: "Northeastern Thailand",  w:  1, scatter: 0.18, ac: "043", districts: ["Mueang Roi Et","Selaphum","Kaset Wisai"] },
  { id: "maha-sarakham",   name: "Maha Sarakham",               lat: 16.1852, lng: 103.3049, region: "Northeastern Thailand",  w:  1, scatter: 0.15, ac: "043", districts: ["Mueang Maha Sarakham","Kosum Phisai","Kantharawichai"] },
  { id: "sakon-nakhon",    name: "Sakon Nakhon",                lat: 17.1664, lng: 104.1486, region: "Northeastern Thailand",  w:  1, scatter: 0.20, ac: "042", districts: ["Mueang Sakon Nakhon","Phanna Nikhom","Wanon Niwat"] },
  { id: "nakhon-phanom",   name: "Nakhon Phanom",               lat: 17.3921, lng: 104.7694, region: "Northeastern Thailand",  w:  1, scatter: 0.20, ac: "042", districts: ["Mueang Nakhon Phanom","That Phanom","Renu Nakhon"] },
  { id: "mukdahan",        name: "Mukdahan",                    lat: 16.5456, lng: 104.7235, region: "Northeastern Thailand",  w:  1, scatter: 0.15, ac: "042", districts: ["Mueang Mukdahan","Dong Luang","Nikhom Kham Soi"] },
  { id: "chaiyaphum",      name: "Chaiyaphum",                  lat: 15.8068, lng: 102.0317, region: "Northeastern Thailand",  w:  1, scatter: 0.22, ac: "044", districts: ["Mueang Chaiyaphum","Bamnet Narong","Kaset Sombun"] },
];

const TOTAL_WEIGHT = PROVINCES.reduce((s, p) => s + p.w, 0);

// ─── Name components ──────────────────────────────────────────────────────────
const ADJ = ["Grand","Royal","Golden","Blue","Green","White","Lotus","Orchid","Jasmine","Mango","Baan","Sala","Malee","Rattana","Chan","Dao","Serene","Tranquil","Breeze","Jade","Emerald","Crystal","Silver","Pacific","Oriental","Tropical","Coconut","Palm","Bamboo","River","Mountain","Garden"];
const CORE = ["Palace","Haven","Retreat","Oasis","Paradise","Escape","Garden","Suite","Suites","Residence","Place","Manor","Lodge","Estate"];
const BRAND = ["Amari","Centara","Dusit","SALA","Anantara","Avani","X2","Deevana","Novotel","Ibis","Mercure","Pullman","Holiday Inn","Best Western","Radisson","Marriott","Sheraton","Hilton","Hyatt","Four Seasons","Waldorf","Rosewood","Aman","Six Senses","Aleenta","Keemala","Trisara","Como"];
const THAI_NAMES = ["Siam","Lanna","Rattanakosin","Chao Phraya","Phuphaya","Rimnam","Thara","Baan Thai","Sawasdee","Muangthong","Phutawan","Tara","Nava","Vimanmek","Siripanya","Orchid Spring","Lotus Pond","Bamboo Grove","Mango Tree","Coconut Shell","Jasmine House","River View","Mountain Mist","Golden Triangle"];
const SUFFIX_BY_TYPE = {
  hotel: ["Hotel","Hotel & Spa","Hotel Bangkok","City Hotel","Business Hotel","Heritage Hotel","Classic Hotel"],
  resort: ["Resort","Beach Resort","Spa Resort","Eco Resort","Mountain Resort","Pool Villa Resort","Luxury Resort","Garden Resort"],
  hostel: ["Hostel","Backpackers","Guesthouse","Bunkhouse","Traveller's Inn","Budget Stay"],
  villa: ["Villa","Villas","Pool Villa","Private Villa","Luxury Villa","Holiday Villa","Beach Villa"],
  guesthouse: ["Guesthouse","Bed & Breakfast","Inn","House","Home Stay","Guest House","Boutique Inn"],
  boutique: ["Boutique Hotel","Boutique Resort","Boutique Suites","Design Hotel","Lifestyle Hotel","Art Hotel"],
};

// ─── Hotel types ──────────────────────────────────────────────────────────────
const TYPES = [
  { type: "hotel",      weight: 28, stars: [3,3,3,4,4,5],   baseMin: 1200, baseMax:  7000 },
  { type: "resort",     weight: 22, stars: [4,4,4,5,5,5],   baseMin: 2500, baseMax: 18000 },
  { type: "hostel",     weight: 15, stars: [1,1,2,2],        baseMin:  300, baseMax:   900 },
  { type: "guesthouse", weight: 15, stars: [1,2,2,3,3],      baseMin:  600, baseMax:  2500 },
  { type: "villa",      weight: 12, stars: [4,4,5,5,5],      baseMin: 4000, baseMax: 30000 },
  { type: "boutique",   weight:  8, stars: [3,3,4,4,5],      baseMin: 1800, baseMax:  8000 },
];
const TYPE_TOTAL_W = TYPES.reduce((s, t) => s + t.weight, 0);

// ─── Tags / preferences ───────────────────────────────────────────────────────
const PREF_TAGS = {
  phuket:        ["beach","island"],
  krabi:         ["beach","waterfall"],
  "phang-nga":   ["beach","island"],
  "surat-thani": ["island","beach"],
  trang:         ["beach","island"],
  satun:         ["island","beach"],
  trat:          ["beach","island"],
  rayong:        ["beach"],
  chonburi:      ["beach","city"],
  "chiang-mai":  ["mountain","culture","waterfall"],
  "chiang-rai":  ["mountain","culture"],
  "mae-hong-son":["mountain","waterfall"],
  lampang:       ["culture","mountain"],
  nan:           ["mountain","culture"],
  tak:           ["mountain","waterfall"],
  "mae-hong-son":["mountain"],
  sukhothai:     ["culture"],
  ayutthaya:     ["culture"],
  kanchanaburi:  ["waterfall","mountain","camping"],
  loei:          ["mountain","camping","waterfall"],
  bangkok:       ["city","foodie","culture"],
  "nakhon-rat":  ["city","culture"],
  "khon-kaen":   ["city","culture"],
  "udon-thani":  ["city","culture"],
  "nong-khai":   ["culture","foodie"],
  chumphon:      ["beach","island"],
  ranong:        ["beach","island"],
  phatthalung:   ["culture","waterfall"],
  songkhla:      ["beach","city","foodie"],
};
function tagsFor(provinceId, hotelType) {
  const base = PREF_TAGS[provinceId] || ["city"];
  if (hotelType === "hostel") return [...base.slice(0,1), "camping"].slice(0,2);
  if (hotelType === "resort" || hotelType === "villa") return base.slice(0,2);
  return base.slice(0,1);
}

// ─── Amenities ────────────────────────────────────────────────────────────────
const AMENITIES = {
  budget:  ["Free WiFi","Shared Kitchen","Common Area","Luggage Storage","Tours Desk","Fan","Hot Shower"],
  mid:     ["Free WiFi","Swimming Pool","Restaurant","Room Service","Laundry","Parking","Air Conditioning","24h Front Desk","Tour Booking"],
  luxury:  ["Free WiFi","Infinity Pool","Spa","Multiple Restaurants","Butler","Gym","Concierge","Beach Access","Airport Transfer","Room Service","Bar","Valet Parking"],
  resort:  ["Free WiFi","Beach Access","Spa","Water Sports","Kids Club","Multiple Pools","All Day Dining","Bar","Jacuzzi","Snorkeling"],
  villa:   ["Private Pool","Free WiFi","Butler","Full Kitchen","BBQ","Garden","Sun Deck","Outdoor Shower","Daily Housekeeping","Airport Transfer"],
};
function amenitiesFor(stars, type) {
  if (type === "villa") return shuffle([...AMENITIES.villa], Math.random).slice(0, 5+Math.floor(Math.random()*4));
  if (type === "resort") return shuffle([...AMENITIES.resort], Math.random).slice(0, 6+Math.floor(Math.random()*3));
  if (stars >= 4) return shuffle([...AMENITIES.luxury], Math.random).slice(0, 7+Math.floor(Math.random()*4));
  if (stars >= 3) return shuffle([...AMENITIES.mid], Math.random).slice(0, 5+Math.floor(Math.random()*3));
  return shuffle([...AMENITIES.budget], Math.random).slice(0, 3+Math.floor(Math.random()*3));
}
function shuffle(arr, random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Photos ───────────────────────────────────────────────────────────────────
const PHOTOS = {
  resort: [
    "1566073771259-6a8506099945","1540541338287-41700207dee6","1571896349842-33c89424de2d",
    "1582719508461-905c673771fd","1600585154340-be6161a56a0c","1587213811864-c02b093c04b7",
    "1506929562872-bb421503ef21","1559599101-f09722fb4948","1476514525535-07fb3b4ae5f1",
    "1563911302283-d2bc129e7570","1601628828688-632f38a5a7d0",
  ],
  hotel: [
    "1551882547-ff40c63fe5fa","1520250497591-112f2f40a3f4","1578683010236-d716f9a3f461",
    "1445019980597-93fa8acb246c","1611892440504-42a792e24d32","1590490360182-c33d57733427",
    "1631049307264-da0ec9d70304","1551918120-9739cb430c6d","1499955085172-a7ff21ea4b05",
    "1525596662741-e6e52a3e4c4b","1519449556-43bf9ffe0c3d",
  ],
  villa: [
    "1600585154340-be6161a56a0c","1571896349842-33c89424de2d","1476514525535-07fb3b4ae5f1",
    "1559599101-f09722fb4948","1470770841072-f978cf4d019e","1436491865332-7a61a109cc05",
  ],
  hostel: [
    "1510798831971-d919f57aa773","1522798514-97ceb8c4f1c8","1455587734955-081b22074882",
    "1414235077428-338989a2e8c0","1496417263034-38ec4f0b665a",
  ],
  guesthouse: [
    "1414235077428-338989a2e8c0","1496417263034-38ec4f0b665a","1455587734955-081b22074882",
    "1519449556-43bf9ffe0c3d","1551882547-ff40c63fe5fa",
  ],
  boutique: [
    "1519449556-43bf9ffe0c3d","1614964975671-4bda1c0d4b9d","1578683010236-d716f9a3f461",
    "1499955085172-a7ff21ea4b05","1551882547-ff40c63fe5fa","1611892440504-42a792e24d32",
  ],
};
function photoFor(type, idx) {
  const pool = PHOTOS[type] || PHOTOS.hotel;
  return `https://images.unsplash.com/photo-${pool[idx % pool.length]}?w=800&q=80`;
}

// ─── Check-in / Check-out ─────────────────────────────────────────────────────
const CHECKINS  = ["12:00","13:00","14:00","14:00","14:00","15:00","15:00","16:00"];
const CHECKOUTS = ["10:00","11:00","11:00","11:00","12:00","12:00"];
const SVC_HOURS = ["24 hours","06:00 – 22:00","07:00 – 23:00","08:00 – 22:00","07:00 – 22:00"];

// ─── Generation ───────────────────────────────────────────────────────────────
function generateName(type, province, i, rand) {
  const r = rand();
  if (type === "villa") return `${pick(ADJ, rand)} ${pick(["Villa","Pool Villa","Private Villas"], rand)}`;
  if (r < 0.12 && (type === "hotel" || type === "resort")) return `${pick(BRAND, rand)} ${province.name}`;
  if (r < 0.25) return pick(THAI_NAMES, rand);
  if (r < 0.55) return `${pick(ADJ, rand)} ${pick(CORE, rand)}`;
  return `${pick(ADJ, rand)} ${province.name.split(" ")[0]}`;
}

const TARGET = 10000;

function pickType(rand) {
  let x = rand() * TYPE_TOTAL_W;
  for (const t of TYPES) { x -= t.weight; if (x <= 0) return t; }
  return TYPES[0];
}

console.log("Generating 10,000 hotel records…");

const records = [];
let id = 1;

// Distribute across provinces by weight
for (const province of PROVINCES) {
  const count = Math.round((province.w / TOTAL_WEIGHT) * TARGET);
  for (let i = 0; i < count; i++) {
    const rand = lcg(id * 73 + i * 17 + province.lat * 1000);
    const typeInfo = pickType(rand);
    const { type, stars: starsPool, baseMin, baseMax } = typeInfo;
    const stars = starsPool[Math.floor(rand() * starsPool.length)];

    // Coordinates: scatter around province center
    const lat = province.lat + (rand() - 0.5) * 2 * province.scatter;
    const lng = province.lng + (rand() - 0.5) * 2 * province.scatter;

    // Price — scale with stars and add location premium
    const locationMult = ["phuket","surat-thani","chiang-mai"].includes(province.id) ? 1.25 : 1.0;
    const priceBase = baseMin + Math.floor(rand() * (baseMax - baseMin));
    const priceMin = Math.round(priceBase * locationMult / 100) * 100;
    const priceMax = Math.round(priceMin * (1.5 + rand() * 0.8) / 100) * 100;

    // Name
    const name = generateName(type, province, i, rand);
    const suffix = pick(SUFFIX_BY_TYPE[type], rand);
    const fullName = name.endsWith(type) || BRAND.some(b => name.includes(b)) ? name : `${name} ${suffix}`;

    // District
    const district = pick(province.districts, rand);

    // Phone
    const isMobile = rand() < 0.3;
    const phone = isMobile
      ? `+66 ${pick(["80","81","82","83","84","85","86","87","88","89","90","91","92","93","94","95","96","97","98","99"], rand)} ${range(100,999,rand)} ${range(1000,9999,rand)}`
      : `+66 ${province.ac} ${range(100,999,rand)} ${range(1000,9999,rand)}`;

    // Email
    const slug = fullName.toLowerCase().replace(/[^a-z0-9]/g," ").trim().split(/\s+/).slice(0,3).join("");
    const domain = pick(["gmail.com","hotel.com","resort.co.th","stay.th","booking.co.th","inn.co.th"], rand);
    const prefix = pick(["info","booking","reservations","contact","hello"], rand);
    const email = `${prefix}@${slug}.${domain}`;

    // Photos
    const imgUrl = photoFor(type, i);
    const gallery = [photoFor(type, i+1), photoFor(type, i+2), photoFor(type, i+3)];

    // Tags
    const tags = tagsFor(province.id, type);

    // Rating
    const rating = +(3.0 + rand() * 2.0).toFixed(1);
    const reviewCount = range(type === "hostel" ? 20 : 50, type === "resort" || stars >= 4 ? 3000 : 800, rand);

    // Service
    const checkIn  = pick(CHECKINS, rand);
    const checkOut = pick(CHECKOUTS, rand);
    const serviceHours = stars >= 4 ? "24 hours" : pick(SVC_HOURS, rand);
    const address = `${range(1, 999, rand)} ${pick(["Moo","Soi","Th.","Rd.","Village"], rand)} ${district}`;

    records.push({
      id: `h-${String(id).padStart(5, "0")}`,
      name: fullName,
      province: province.name,
      district,
      region: province.region,
      address: `${address}, ${province.name}`,
      lat: +lat.toFixed(6),
      lng: +lng.toFixed(6),
      type,
      stars,
      priceMin,
      priceMax,
      phone,
      email,
      imageUrl: imgUrl,
      gallery,
      amenities: amenitiesFor(stars, type),
      checkIn,
      checkOut,
      serviceHours,
      tags,
      rating,
      reviewCount,
    });
    id++;
    if (records.length >= TARGET) break;
  }
  if (records.length >= TARGET) break;
}

// Top up to exactly 10,000 if needed
while (records.length < TARGET) {
  const province = PROVINCES[records.length % PROVINCES.length];
  const rand = lcg(id * 99 + records.length);
  const typeInfo = pickType(rand);
  const { type, stars: sp, baseMin, baseMax } = typeInfo;
  const stars = sp[Math.floor(rand() * sp.length)];
  const lat = province.lat + (rand() - 0.5) * 2 * province.scatter;
  const lng = province.lng + (rand() - 0.5) * 2 * province.scatter;
  const priceMin = Math.round((baseMin + Math.floor(rand() * (baseMax - baseMin))) / 100) * 100;
  const priceMax = Math.round(priceMin * (1.5 + rand() * 0.8) / 100) * 100;
  const name = generateName(type, province, records.length, rand);
  const suffix = pick(SUFFIX_BY_TYPE[type], rand);
  const fullName = `${name} ${suffix}`;
  const district = pick(province.districts, rand);
  const phone = `+66 ${province.ac} ${range(100,999,rand)} ${range(1000,9999,rand)}`;
  const slug = fullName.toLowerCase().replace(/[^a-z0-9]/g," ").trim().split(/\s+/).slice(0,3).join("").slice(0,12);
  const email = `info@${slug || "stay"}.co.th`;
  records.push({
    id: `h-${String(id).padStart(5, "0")}`,
    name: fullName,
    province: province.name,
    district,
    region: province.region,
    address: `${range(1,999,rand)} ${district}, ${province.name}`,
    lat: +lat.toFixed(6),
    lng: +lng.toFixed(6),
    type,
    stars,
    priceMin,
    priceMax,
    phone,
    email,
    imageUrl: photoFor(type, records.length),
    gallery: [photoFor(type, records.length+1), photoFor(type, records.length+2)],
    amenities: amenitiesFor(stars, type),
    checkIn: pick(CHECKINS, rand),
    checkOut: pick(CHECKOUTS, rand),
    serviceHours: stars >= 4 ? "24 hours" : pick(SVC_HOURS, rand),
    tags: tagsFor(province.id, type),
    rating: +(3.0 + rand() * 2.0).toFixed(1),
    reviewCount: range(20, 1200, rand),
  });
  id++;
}

const outDir = path.join(__dirname, "..", "src", "data");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "hotels.json");
fs.writeFileSync(outPath, JSON.stringify(records, null, 0), "utf8");

const kb = Math.round(fs.statSync(outPath).size / 1024);
console.log(`✓ Written ${records.length} records to ${outPath} (${kb} KB)`);

// Stats
const byType = {};
records.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1; });
console.log("By type:", byType);
const byRegion = {};
records.forEach(r => { byRegion[r.region] = (byRegion[r.region] || 0) + 1; });
console.log("By region:", byRegion);
