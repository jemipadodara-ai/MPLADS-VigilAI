/**
 * Geographic Reference Dataset and Coordinate Resolution Engine for MPLADS VigilAI
 * Strictly validates real Indian coordinates and maps approximate district locations
 * where exact GPS coordinates are not provided.
 */

export type LocationAccuracy = 'exact' | 'district' | 'unavailable' | 'invalid_region';

export interface ProjectLocationResult {
  latitude: number | null;
  longitude: number | null;
  accuracy: LocationAccuracy;
  locationName?: string;
  sourceField?: string;
  notes: string;
}

export interface DistrictGeoRef {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

// Indian geographic boundaries
// Latitude: ~6.0 N (Great Nicobar) to ~37.5 N (Ladakh)
// Longitude: ~68.0 E (Gujarat) to ~97.5 E (Arunachal Pradesh)
export const INDIA_GEO_BOUNDS = {
  minLat: 6.0,
  maxLat: 37.5,
  minLng: 68.0,
  maxLng: 97.5,
};

/**
 * Validates coordinate quality and ensures it falls within Indian territory
 */
export function validateCoordinates(lat?: any, lng?: any): {
  isValid: boolean;
  isWithinIndia: boolean;
  reason?: string;
} {
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return { isValid: false, isWithinIndia: false, reason: 'missing' };
  }

  const numLat = Number(lat);
  const numLng = Number(lng);

  if (isNaN(numLat) || isNaN(numLng)) {
    return { isValid: false, isWithinIndia: false, reason: 'NaN' };
  }

  // Reject impossible geographic values
  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
    return { isValid: false, isWithinIndia: false, reason: 'out_of_world_bounds' };
  }

  // Reject suspicious 0,0 null-island coordinates
  if (Math.abs(numLat) < 0.001 && Math.abs(numLng) < 0.001) {
    return { isValid: false, isWithinIndia: false, reason: 'null_island_0_0' };
  }

  // Check if within India geographic territory
  const isWithinIndia =
    numLat >= INDIA_GEO_BOUNDS.minLat &&
    numLat <= INDIA_GEO_BOUNDS.maxLat &&
    numLng >= INDIA_GEO_BOUNDS.minLng &&
    numLng <= INDIA_GEO_BOUNDS.maxLng;

  return {
    isValid: true,
    isWithinIndia,
    reason: isWithinIndia ? undefined : 'outside_india_boundaries',
  };
}

/**
 * Authentic district coordinates mapping across Indian states and union territories.
 * Kept strictly isolated as a static geographic reference dataset.
 */
export const DISTRICT_GEO_REFERENCE: Record<string, DistrictGeoRef> = {
  // Uttar Pradesh
  varanasi: { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  lucknow: { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  kanpur: { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  prayagraj: { name: 'Prayagraj', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
  allahabad: { name: 'Prayagraj', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
  gorakhpur: { name: 'Gorakhpur', state: 'Uttar Pradesh', lat: 26.7606, lng: 83.3732 },
  agra: { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  meerut: { name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064 },
  bareilly: { name: 'Bareilly', state: 'Uttar Pradesh', lat: 28.367, lng: 79.4304 },
  aligarh: { name: 'Aligarh', state: 'Uttar Pradesh', lat: 27.8974, lng: 78.088 },
  moradabad: { name: 'Moradabad', state: 'Uttar Pradesh', lat: 28.8386, lng: 78.7733 },
  ghaziabad: { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538 },
  gautam_buddha_nagar: { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.391 },
  noida: { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.391 },
  ayodhya: { name: 'Ayodhya', state: 'Uttar Pradesh', lat: 26.7922, lng: 82.1998 },
  faizabad: { name: 'Ayodhya', state: 'Uttar Pradesh', lat: 26.7922, lng: 82.1998 },

  // Gujarat
  gandhinagar: { name: 'Gandhinagar', state: 'Gujarat', lat: 23.2156, lng: 72.6369 },
  ahmedabad: { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  rajkot: { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
  surat: { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  vadodara: { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
  bhavnagar: { name: 'Bhavnagar', state: 'Gujarat', lat: 21.7645, lng: 72.1519 },
  jamnagar: { name: 'Jamnagar', state: 'Gujarat', lat: 22.4707, lng: 70.0577 },
  junagadh: { name: 'Junagadh', state: 'Gujarat', lat: 21.5222, lng: 70.4579 },
  kutch: { name: 'Kutch', state: 'Gujarat', lat: 23.242, lng: 69.6669 },
  bhuj: { name: 'Kutch', state: 'Gujarat', lat: 23.242, lng: 69.6669 },

  // Karnataka
  bengaluru_rural: { name: 'Bengaluru Rural', state: 'Karnataka', lat: 13.0285, lng: 77.5461 },
  bengaluru_urban: { name: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  bangalore: { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  bengaluru: { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  mysuru: { name: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
  mysore: { name: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
  ramanagara: { name: 'Ramanagara', state: 'Karnataka', lat: 12.8712, lng: 77.4915 },
  belagavi: { name: 'Belagavi', state: 'Karnataka', lat: 15.8497, lng: 74.4977 },
  hubballi: { name: 'Hubballi-Dharwad', state: 'Karnataka', lat: 15.3647, lng: 75.124 },
  mangaluru: { name: 'Mangaluru', state: 'Karnataka', lat: 12.9141, lng: 74.856 },
  shivamogga: { name: 'Shivamogga', state: 'Karnataka', lat: 13.9299, lng: 75.5681 },
  kalaburagi: { name: 'Kalaburagi', state: 'Karnataka', lat: 17.3297, lng: 76.8343 },

  // Delhi NCT
  new_delhi: { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209 },
  delhi: { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209 },
  east_delhi: { name: 'East Delhi', state: 'Delhi', lat: 28.6279, lng: 77.2784 },
  south_delhi: { name: 'South Delhi', state: 'Delhi', lat: 28.5402, lng: 77.2155 },
  north_delhi: { name: 'North Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
  west_delhi: { name: 'West Delhi', state: 'Delhi', lat: 28.6562, lng: 77.0718 },

  // Bihar
  patna: { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  patna_sahib: { name: 'Patna Sahib', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  gaya: { name: 'Gaya', state: 'Bihar', lat: 24.7914, lng: 85.0002 },
  muzaffarpur: { name: 'Muzaffarpur', state: 'Bihar', lat: 26.1209, lng: 85.3647 },
  bhagalpur: { name: 'Bhagalpur', state: 'Bihar', lat: 25.2425, lng: 86.9842 },
  darbhanga: { name: 'Darbhanga', state: 'Bihar', lat: 26.1542, lng: 85.8918 },
  purnia: { name: 'Purnia', state: 'Bihar', lat: 25.7771, lng: 87.4753 },

  // Kerala
  thiruvananthapuram: { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
  trivandrum: { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
  wayanad: { name: 'Wayanad', state: 'Kerala', lat: 11.5543, lng: 76.1284 },
  kochi: { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  ernakulam: { name: 'Ernakulam', state: 'Kerala', lat: 9.9816, lng: 76.2999 },
  kozhikode: { name: 'Kozhikode', state: 'Kerala', lat: 11.2588, lng: 75.7804 },
  thrissur: { name: 'Thrissur', state: 'Kerala', lat: 10.5276, lng: 76.2144 },
  kollam: { name: 'Kollam', state: 'Kerala', lat: 8.8932, lng: 76.6141 },

  // Maharashtra
  mumbai: { name: 'Mumbai', state: 'Maharashtra', lat: 18.969, lng: 72.8205 },
  mumbai_south: { name: 'Mumbai South', state: 'Maharashtra', lat: 18.969, lng: 72.8205 },
  pune: { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  nagpur: { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  thane: { name: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781 },
  nashik: { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
  aurangabad: { name: 'Chhatrapati Sambhaji Nagar', state: 'Maharashtra', lat: 19.8762, lng: 75.3433 },
  palghar: { name: 'Palghar', state: 'Maharashtra', lat: 19.9142, lng: 73.2321 },
  kolhapur: { name: 'Kolhapur', state: 'Maharashtra', lat: 16.705, lng: 74.2433 },
  solapur: { name: 'Solapur', state: 'Maharashtra', lat: 17.6599, lng: 75.9064 },

  // West Bengal
  kolkata: { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  kolkata_south: { name: 'Kolkata South', state: 'West Bengal', lat: 22.518, lng: 88.3585 },
  darjeeling: { name: 'Darjeeling', state: 'West Bengal', lat: 26.8821, lng: 88.2785 },
  siliguri: { name: 'Siliguri', state: 'West Bengal', lat: 26.7271, lng: 88.3953 },
  howrah: { name: 'Howrah', state: 'West Bengal', lat: 22.5958, lng: 88.2636 },
  asansol: { name: 'Asansol', state: 'West Bengal', lat: 23.6739, lng: 86.9524 },
  durgapur: { name: 'Durgapur', state: 'West Bengal', lat: 23.5204, lng: 87.3119 },

  // Rajasthan
  jaipur: { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  jodhpur: { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
  udaipur: { name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
  kota: { name: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648 },
  bikaner: { name: 'Bikaner', state: 'Rajasthan', lat: 28.0229, lng: 73.3119 },
  ajmer: { name: 'Ajmer', state: 'Rajasthan', lat: 26.4499, lng: 74.6399 },

  // Madhya Pradesh
  bhopal: { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  indore: { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  gwalior: { name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828 },
  jabalpur: { name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
  ujjain: { name: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1765, lng: 75.7885 },

  // Telangana & Andhra Pradesh
  hyderabad: { name: 'Hyderabad', state: 'Telangana', lat: 17.3616, lng: 78.4747 },
  secunderabad: { name: 'Secunderabad', state: 'Telangana', lat: 17.4399, lng: 78.4983 },
  warangal: { name: 'Warangal', state: 'Telangana', lat: 17.9689, lng: 79.5941 },
  visakhapatnam: { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  vijayawada: { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.648 },
  guntur: { name: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lng: 80.4365 },
  tirupati: { name: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192 },

  // Tamil Nadu
  chennai: { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  coimbatore: { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  madurai: { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198 },
  tiruchirappalli: { name: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.7905, lng: 78.7047 },
  salem: { name: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.146 },

  // Odisha
  puri: { name: 'Puri', state: 'Odisha', lat: 19.8135, lng: 85.8312 },
  bhubaneswar: { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  cuttack: { name: 'Cuttack', state: 'Odisha', lat: 20.4625, lng: 85.883 },
  rourkela: { name: 'Rourkela', state: 'Odisha', lat: 22.2604, lng: 84.8536 },

  // Assam & Northeast
  gauhati: { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  guwahati: { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  dibrugarh: { name: 'Dibrugarh', state: 'Assam', lat: 27.4728, lng: 94.912 },
  shillong: { name: 'Shillong', state: 'Meghalaya', lat: 25.5788, lng: 91.8933 },
  agartala: { name: 'Agartala', state: 'Tripura', lat: 23.8315, lng: 91.2868 },
  imphal: { name: 'Imphal', state: 'Manipur', lat: 24.817, lng: 93.9368 },
  aizawl: { name: 'Aizawl', state: 'Mizoram', lat: 23.7271, lng: 92.7176 },
  kohima: { name: 'Kohima', state: 'Nagaland', lat: 25.6751, lng: 94.1086 },
  itanagar: { name: 'Itanagar', state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053 },
  gangtok: { name: 'Gangtok', state: 'Sikkim', lat: 27.3314, lng: 88.6138 },

  // Punjab, Haryana, Himachal & J&K
  chandigarh: { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  amritsar: { name: 'Amritsar', state: 'Punjab', lat: 31.634, lng: 74.8723 },
  ludhiana: { name: 'Ludhiana', state: 'Punjab', lat: 30.901, lng: 75.8573 },
  gurugram: { name: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  gurgaon: { name: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  faridabad: { name: 'Faridabad', state: 'Haryana', lat: 28.4089, lng: 77.3178 },
  shimla: { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  dehradun: { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  srinagar: { name: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lng: 74.7973 },
  jammu: { name: 'Jammu', state: 'Jammu and Kashmir', lat: 32.7266, lng: 74.857 },
  leh: { name: 'Leh', state: 'Ladakh', lat: 34.1526, lng: 77.5771 },

  // Chhattisgarh & Jharkhand
  raipur: { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  ranchi: { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  jamshedpur: { name: 'Jamshedpur', state: 'Jharkhand', lat: 22.8046, lng: 86.2029 },
  dhanbad: { name: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lng: 86.4304 },

  // Goa & Islands
  panaji: { name: 'North Goa', state: 'Goa', lat: 15.4909, lng: 73.8278 },
  margao: { name: 'South Goa', state: 'Goa', lat: 15.2832, lng: 73.9862 },
  port_blair: { name: 'Andaman & Nicobar', state: 'Andaman and Nicobar', lat: 11.6234, lng: 92.7265 },
  kavaratti: { name: 'Lakshadweep', state: 'Lakshadweep', lat: 10.5667, lng: 72.6417 },
};

/**
 * Normalizes text for matching against district keys
 */
function normalizeKey(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Clean mapping function that strictly resolves real project coordinates
 * or returns an appropriate approximate district location.
 */
export function getProjectCoordinates(project: any): ProjectLocationResult {
  if (!project) {
    return {
      latitude: null,
      longitude: null,
      accuracy: 'unavailable',
      notes: 'Null or missing project record',
    };
  }

  // 1. Inspect all potential exact coordinate fields from Firebase document schemas
  let rawLat: any = undefined;
  let rawLng: any = undefined;
  let sourceField = '';

  // Order of preference for exact coordinate fields
  if (project.gpsLat !== undefined && project.gpsLng !== undefined) {
    rawLat = project.gpsLat;
    rawLng = project.gpsLng;
    sourceField = 'gpsLat/gpsLng';
  } else if (project.latitude !== undefined && project.longitude !== undefined) {
    rawLat = project.latitude;
    rawLng = project.longitude;
    sourceField = 'latitude/longitude';
  } else if (project.lat !== undefined && project.lng !== undefined) {
    rawLat = project.lat;
    rawLng = project.lng;
    sourceField = 'lat/lng';
  } else if (project.coordinates?.lat !== undefined && project.coordinates?.lng !== undefined) {
    rawLat = project.coordinates.lat;
    rawLng = project.coordinates.lng;
    sourceField = 'coordinates.lat/lng';
  } else if (project.coordinates?.latitude !== undefined && project.coordinates?.longitude !== undefined) {
    rawLat = project.coordinates.latitude;
    rawLng = project.coordinates.longitude;
    sourceField = 'coordinates.latitude/longitude';
  } else if (project.geoPoint?.latitude !== undefined && project.geoPoint?.longitude !== undefined) {
    rawLat = project.geoPoint.latitude;
    rawLng = project.geoPoint.longitude;
    sourceField = 'geoPoint.latitude/longitude';
  } else if (project.geoPoint?._latitude !== undefined && project.geoPoint?._longitude !== undefined) {
    rawLat = project.geoPoint._latitude;
    rawLng = project.geoPoint._longitude;
    sourceField = 'geoPoint._latitude/_longitude';
  } else if (project.actualGeoCoordinates?.lat !== undefined && project.actualGeoCoordinates?.lng !== undefined) {
    rawLat = project.actualGeoCoordinates.lat;
    rawLng = project.actualGeoCoordinates.lng;
    sourceField = 'actualGeoCoordinates';
  }

  // 2. Validate exact coordinates if found
  if (rawLat !== undefined && rawLng !== undefined) {
    const val = validateCoordinates(rawLat, rawLng);
    if (val.isValid) {
      if (val.isWithinIndia) {
        return {
          latitude: Number(rawLat),
          longitude: Number(rawLng),
          accuracy: 'exact',
          sourceField,
          notes: 'Exact verified GPS coordinates',
        };
      } else {
        // Outside Indian geographic boundaries
        return {
          latitude: null,
          longitude: null,
          accuracy: 'invalid_region',
          sourceField,
          notes: 'Invalid/Unexpected Location: coordinates fall outside Indian geographic boundaries',
        };
      }
    }
  }

  // 3. Fallback: Search for an authentic district / constituency level location
  const candidates = [
    project.district,
    project.constituencyId,
    project.constituency,
    project.nodalDistrict,
    project.location,
    project.city,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const key = normalizeKey(candidate);
    if (DISTRICT_GEO_REFERENCE[key]) {
      const ref = DISTRICT_GEO_REFERENCE[key];
      return {
        latitude: ref.lat,
        longitude: ref.lng,
        accuracy: 'district',
        locationName: `${ref.name}, ${ref.state}`,
        notes: 'Approximate district location',
      };
    }

    // Try substring matching if candidate is longer (e.g. "Nelamangala Taluk, Bengaluru Rural")
    for (const [refKey, ref] of Object.entries(DISTRICT_GEO_REFERENCE)) {
      if (key.includes(refKey) || normalizeKey(ref.name).includes(key)) {
        return {
          latitude: ref.lat,
          longitude: ref.lng,
          accuracy: 'district',
          locationName: `${ref.name}, ${ref.state}`,
          notes: 'Approximate district location',
        };
      }
    }
  }

  // 4. Return null if no reliable location is available
  return {
    latitude: null,
    longitude: null,
    accuracy: 'unavailable',
    notes: 'No geographic coordinates or reliable district reference available',
  };
}
