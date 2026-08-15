export interface RwandaLocationInfo {
  name: string;
  district: string;
  province: 'Kigali City' | 'Northern Province' | 'Western Province' | 'Southern Province' | 'Eastern Province';
  lat: number;
  lng: number;
  description: string;
  avgPriceGuide: number; // RWF
  tag: string;
}

export const RWANDA_PROVINCES = [
  'Kigali City',
  'Northern Province',
  'Western Province',
  'Southern Province',
  'Eastern Province'
] as const;

export type RwandaProvince = (typeof RWANDA_PROVINCES)[number];

export const RWANDA_DISTRICTS_BY_PROVINCE: Record<RwandaProvince, string[]> = {
  'Kigali City': ['Gasabo', 'Nyarugenge', 'Kicukiro'],
  'Northern Province': ['Musanze', 'Gicumbi', 'Rulindo', 'Burera', 'Gakenke'],
  'Western Province': ['Rubavu', 'Karongi', 'Rusizi', 'Nyamasheke', 'Rutsiro', 'Nyabihu', 'Ngororero'],
  'Southern Province': ['Huye', 'Muhanga', 'Nyanza', 'Ruhango', 'Gisagara', 'Nyamagabe', 'Kamonyi', 'Nyaruguru'],
  'Eastern Province': ['Bugesera', 'Rwamagana', 'Kayonza', 'Nyagatare', 'Gatsibo', 'Kirehe', 'Ngoma']
};

export const RWANDA_LOCATIONS_DATA: Record<string, RwandaLocationInfo> = {
  // === KIGALI CITY ===
  'Kimihurura': {
    name: 'Kimihurura',
    district: 'Gasabo',
    province: 'Kigali City',
    lat: -1.9542,
    lng: 30.0886,
    description: 'Diplomatic quarter, international eateries, convention center hub & tranquil avenues',
    avgPriceGuide: 450000,
    tag: 'Diplomatic & Dining'
  },
  'Nyarutarama': {
    name: 'Nyarutarama',
    district: 'Gasabo',
    province: 'Kigali City',
    lat: -1.9388,
    lng: 30.1042,
    description: 'Prestigious golf course neighborhood with luxury mansions, green belts & embassies',
    avgPriceGuide: 1100000,
    tag: 'Luxury Estates'
  },
  'Kacyiru': {
    name: 'Kacyiru',
    district: 'Gasabo',
    province: 'Kigali City',
    lat: -1.9421,
    lng: 30.0768,
    description: 'Government ministries, King Faisal Hospital, US Embassy & modern duplexes',
    avgPriceGuide: 480000,
    tag: 'Executive & Medical'
  },
  'Gacuriro': {
    name: 'Gacuriro',
    district: 'Gasabo',
    province: 'Kigali City',
    lat: -1.9284,
    lng: 30.1095,
    description: 'Modern planned estates (Vision City), family townhouses and hillside views',
    avgPriceGuide: 700000,
    tag: 'Modern Planned City'
  },
  'Kibagabaga': {
    name: 'Kibagabaga',
    district: 'Gasabo',
    province: 'Kigali City',
    lat: -1.9351,
    lng: 30.1246,
    description: 'Hilltop residential center with sunset vistas, private clinics & trendy cafes',
    avgPriceGuide: 420000,
    tag: 'Hilltop Residential'
  },
  'Remera': {
    name: 'Remera',
    district: 'Gasabo',
    province: 'Kigali City',
    lat: -1.9614,
    lng: 30.1158,
    description: 'Commercial heart near BK Arena, Amahoro National Stadium & Kigali Airport',
    avgPriceGuide: 280000,
    tag: 'Sports & Transit Hub'
  },
  'Kiyovu': {
    name: 'Kiyovu',
    district: 'Nyarugenge',
    province: 'Kigali City',
    lat: -1.9602,
    lng: 30.0618,
    description: 'Historic upscale enclave adjacent to Kigali Downtown and financial quarter',
    avgPriceGuide: 850000,
    tag: 'Historic CBD Enclave'
  },
  'Kicukiro': {
    name: 'Kicukiro',
    district: 'Kicukiro',
    province: 'Kigali City',
    lat: -1.9845,
    lng: 30.1023,
    description: 'Thriving family district (Niboye, Sonatubes) with school corridors & markets',
    avgPriceGuide: 260000,
    tag: 'Family Commercial'
  },
  'Gisozi': {
    name: 'Gisozi',
    district: 'Gasabo',
    province: 'Kigali City',
    lat: -1.9214,
    lng: 30.0652,
    description: 'Elevated university district (ULK) with scenic views and accessible rentals',
    avgPriceGuide: 350000,
    tag: 'University & Hills'
  },
  'Nyamirambo': {
    name: 'Nyamirambo',
    district: 'Nyarugenge',
    province: 'Kigali City',
    lat: -1.9822,
    lng: 30.0456,
    description: 'Culturally vibrant neighborhood with walking trails up Mount Kigali & lively nightlife',
    avgPriceGuide: 240000,
    tag: 'Culture & Heritage'
  },
  'Rebero': {
    name: 'Rebero',
    district: 'Kicukiro',
    province: 'Kigali City',
    lat: -1.9892,
    lng: 30.0784,
    description: 'Panoramic hill overlooking Kigali basin, cultural villages & emerging luxury estates',
    avgPriceGuide: 550000,
    tag: 'Panoramic Crest'
  },

  // === NORTHERN PROVINCE ===
  'Musanze Town (Muhoza)': {
    name: 'Musanze Town (Muhoza)',
    district: 'Musanze',
    province: 'Northern Province',
    lat: -1.4988,
    lng: 29.6350,
    description: 'Northern economic powerhouse, INES University, mountain climate & gateway to Volcanoes',
    avgPriceGuide: 220000,
    tag: 'Tourism & University Hub'
  },
  'Kinigi (Volcanoes Foothills)': {
    name: 'Kinigi (Volcanoes Foothills)',
    district: 'Musanze',
    province: 'Northern Province',
    lat: -1.4320,
    lng: 29.5890,
    description: 'Scenic eco-luxury villas, gorilla trekking park headquarters and fresh volcanic breezes',
    avgPriceGuide: 480000,
    tag: 'Eco-Tourism & Mountain Lodge'
  },
  'Gicumbi (Byumba)': {
    name: 'Gicumbi (Byumba)',
    district: 'Gicumbi',
    province: 'Northern Province',
    lat: -1.5764,
    lng: 30.0675,
    description: 'Lush tea country, high altitude cool climate, commercial border trade corridor',
    avgPriceGuide: 180000,
    tag: 'Highland Tea Country'
  },
  'Rulindo (Tare)': {
    name: 'Rulindo (Tare)',
    district: 'Rulindo',
    province: 'Northern Province',
    lat: -1.7342,
    lng: 29.9984,
    description: 'Scenic valley along the Kigali-Musanze highway, agricultural & handicraft center',
    avgPriceGuide: 160000,
    tag: 'Valley Highway Corridor'
  },

  // === WESTERN PROVINCE ===
  'Rubavu (Gisenyi Beach)': {
    name: 'Rubavu (Gisenyi Beach)',
    district: 'Rubavu',
    province: 'Western Province',
    lat: -1.6975,
    lng: 29.2567,
    description: 'Lake Kivu sandy beachfront, resort avenue, warm tropical climate & cross-border hub',
    avgPriceGuide: 320000,
    tag: 'Lake Kivu Beachfront'
  },
  'Karongi (Kibuye Lakeside)': {
    name: 'Karongi (Kibuye Lakeside)',
    district: 'Karongi',
    province: 'Western Province',
    lat: -2.0628,
    lng: 29.3512,
    description: 'Tranquil lakeside peninsula, boat marinas, island panoramas & peaceful hills',
    avgPriceGuide: 260000,
    tag: 'Serene Island Shores'
  },
  'Rusizi (Kamembe)': {
    name: 'Rusizi (Kamembe)',
    district: 'Rusizi',
    province: 'Western Province',
    lat: -2.4842,
    lng: 28.9078,
    description: 'Southern Lake Kivu trade metropolis, Kamembe Airport & gateway to Nyungwe Forest',
    avgPriceGuide: 240000,
    tag: 'Lake Trade & Forest Gateway'
  },

  // === SOUTHERN PROVINCE ===
  'Huye (Butare / Ngoma)': {
    name: 'Huye (Butare / Ngoma)',
    district: 'Huye',
    province: 'Southern Province',
    lat: -2.5967,
    lng: 29.7394,
    description: 'Academic and cultural capital, University of Rwanda main campus, National Museum',
    avgPriceGuide: 190000,
    tag: 'Academic & Cultural Heart'
  },
  'Muhanga (Gitarama)': {
    name: 'Muhanga (Gitarama)',
    district: 'Muhanga',
    province: 'Southern Province',
    lat: -2.0792,
    lng: 29.7547,
    description: 'Central transport crossroads connecting East, West and South, bustling market city',
    avgPriceGuide: 200000,
    tag: 'Central Crossroads City'
  },
  'Nyanza (Busasamana)': {
    name: 'Nyanza (Busasamana)',
    district: 'Nyanza',
    province: 'Southern Province',
    lat: -2.3524,
    lng: 29.7508,
    description: 'Historic royal monarchy capital, King\'s Palace Museum, serene heritage town',
    avgPriceGuide: 150000,
    tag: 'Historic Kingdom Capital'
  },

  // === EASTERN PROVINCE ===
  'Bugesera (Nyamata)': {
    name: 'Bugesera (Nyamata)',
    district: 'Bugesera',
    province: 'Eastern Province',
    lat: -2.1481,
    lng: 30.0931,
    description: 'Booming modern residential zone near New Bugesera International Airport & lakes',
    avgPriceGuide: 280000,
    tag: 'Airport City & Lake District'
  },
  'Rwamagana (Kigabiro)': {
    name: 'Rwamagana (Kigabiro)',
    district: 'Rwamagana',
    province: 'Eastern Province',
    lat: -1.9486,
    lng: 30.4347,
    description: 'Eastern provincial administrative seat, Lake Muhazi recreation, breezy green estates',
    avgPriceGuide: 210000,
    tag: 'Provincial Seat & Lake Muhazi'
  },
  'Kayonza (Mukarange)': {
    name: 'Kayonza (Mukarange)',
    district: 'Kayonza',
    province: 'Eastern Province',
    lat: -1.9333,
    lng: 30.5000,
    description: 'Eastern transit crossroads and staging city for Akagera National Park safaris',
    avgPriceGuide: 170000,
    tag: 'Akagera Safari Gateway'
  },
  'Nyagatare Town': {
    name: 'Nyagatare Town',
    district: 'Nyagatare',
    province: 'Eastern Province',
    lat: -1.2982,
    lng: 30.3243,
    description: 'Fast-expanding northeastern ranching city, University of Rwanda Nyagatare campus',
    avgPriceGuide: 160000,
    tag: 'Eastern University & Ranch Hub'
  }
};

export const ALL_RWANDA_LOCATIONS = Object.keys(RWANDA_LOCATIONS_DATA);
