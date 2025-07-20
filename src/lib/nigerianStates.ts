export interface NigerianState {
  name: string;
  cities: string[];
}

export const NIGERIA_STATES: NigerianState[] = [
  {
    name: 'Abia',
    cities: ['Umuahia', 'Aba', 'Arochukwu', 'Ohafia', 'Bende'],
  },
  {
    name: 'Adamawa',
    cities: ['Yola', 'Mubi', 'Jimeta', 'Numan', 'Ganye'],
  },
  {
    name: 'Akwa Ibom',
    cities: ['Uyo', 'Ikot Ekpene', 'Eket', 'Oron', 'Abak'],
  },
  {
    name: 'Anambra',
    cities: ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Agulu'],
  },
  {
    name: 'Bauchi',
    cities: ['Bauchi', 'Azare', 'Misau', "Jama'are", 'Katagum'],
  },
  {
    name: 'Bayelsa',
    cities: ['Yenagoa', 'Brass', 'Sagbama', 'Ogbia', 'Nembe'],
  },
  {
    name: 'Benue',
    cities: ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala', 'Vandeikya'],
  },
  {
    name: 'Borno',
    cities: ['Maiduguri', 'Biu', 'Bama', 'Dikwa', 'Gubio'],
  },
  {
    name: 'Cross River',
    cities: ['Calabar', 'Ugep', 'Ogoja', 'Ikom', 'Obudu'],
  },
  {
    name: 'Delta',
    cities: ['Asaba', 'Warri', 'Sapele', 'Ughelli', 'Agbor'],
  },
  {
    name: 'Ebonyi',
    cities: ['Abakaliki', 'Afikpo', 'Onueke', 'Ezza', 'Ishielu'],
  },
  {
    name: 'Edo',
    cities: ['Benin City', 'Auchi', 'Ekpoma', 'Uromi', 'Igarra'],
  },
  {
    name: 'Ekiti',
    cities: ['Ado-Ekiti', 'Ikere', 'Oye', 'Efon', 'Ijero'],
  },
  {
    name: 'Enugu',
    cities: ['Enugu', 'Nsukka', 'Oji River', 'Agbani', 'Awgu'],
  },
  {
    name: 'FCT',
    cities: ['Abuja', 'Gwagwalada', 'Kuje', 'Bwari', 'Kwali', 'Abaji'],
  },
  {
    name: 'Gombe',
    cities: ['Gombe', 'Kumo', 'Billiri', 'Kaltungo', 'Dukku'],
  },
  {
    name: 'Imo',
    cities: ['Owerri', 'Orlu', 'Okigwe', 'Oguta', 'Mbaise'],
  },
  {
    name: 'Jigawa',
    cities: ['Dutse', 'Hadejia', 'Kazaure', 'Gumel', 'Ringim'],
  },
  {
    name: 'Kaduna',
    cities: ['Kaduna', 'Zaria', 'Kafanchan', 'Kagoro', 'Malumfashi'],
  },
  {
    name: 'Kano',
    cities: ['Kano', 'Wudil', 'Garko', 'Bichi', 'Gwarzo'],
  },
  {
    name: 'Katsina',
    cities: ['Katsina', 'Daura', 'Funtua', 'Malumfashi', 'Dutsin-Ma'],
  },
  {
    name: 'Kebbi',
    cities: ['Birnin Kebbi', 'Argungu', 'Yauri', 'Zuru', 'Bagudo'],
  },
  {
    name: 'Kogi',
    cities: ['Lokoja', 'Okene', 'Kabba', 'Anyigba', 'Idah'],
  },
  {
    name: 'Kwara',
    cities: ['Ilorin', 'Offa', 'Omu-Aran', 'Lafiagi', 'Kaiama'],
  },
  {
    name: 'Lagos',
    cities: ['Lagos Island', 'Ikeja', 'Epe', 'Ikorodu', 'Badagry'],
  },
  {
    name: 'Nasarawa',
    cities: ['Lafia', 'Keffi', 'Akwanga', 'Nasarawa', 'Doma'],
  },
  {
    name: 'Niger',
    cities: ['Minna', 'Bida', 'Kontagora', 'Suleja', 'New Bussa'],
  },
  {
    name: 'Ogun',
    cities: ['Abeokuta', 'Sagamu', 'Ijebu-Ode', 'Ilaro', 'Ota'],
  },
  {
    name: 'Ondo',
    cities: ['Akure', 'Ondo', 'Owo', 'Ikare', 'Okitipupa'],
  },
  {
    name: 'Osun',
    cities: ['Osogbo', 'Ile-Ife', 'Ilesa', 'Ede', 'Iwo'],
  },
  {
    name: 'Oyo',
    cities: ['Ibadan', 'Ogbomoso', 'Oyo', 'Iseyin', 'Saki'],
  },
  {
    name: 'Plateau',
    cities: ['Jos', 'Bukuru', 'Shendam', 'Pankshin', 'Mangu'],
  },
  {
    name: 'Rivers',
    cities: ['Port Harcourt', 'Obio-Akpor', 'Okrika', 'Degema', 'Bonny'],
  },
  {
    name: 'Sokoto',
    cities: ['Sokoto', 'Tambuwal', 'Gwadabawa', 'Bodinga', 'Yabo'],
  },
  {
    name: 'Taraba',
    cities: ['Jalingo', 'Wukari', 'Bali', 'Gembu', 'Serti'],
  },
  {
    name: 'Yobe',
    cities: ['Damaturu', 'Potiskum', 'Gashua', 'Nguru', 'Geidam'],
  },
  {
    name: 'Zamfara',
    cities: ['Gusau', 'Kaura Namoda', 'Talata Mafara', 'Zurmi', 'Anka'],
  },
];

export const getAllStates = (): string[] => {
  return NIGERIA_STATES.map((state) => state.name);
};

export const getCitiesByState = (stateName: string): string[] => {
  const state = NIGERIA_STATES.find((s) => s.name === stateName);
  return state ? state.cities : [];
};

// Export all cities for backwards compatibility
export const NIGERIA_CITIES = NIGERIA_STATES.flatMap((state) => state.cities);

export const nigerianStates = NIGERIA_STATES;
