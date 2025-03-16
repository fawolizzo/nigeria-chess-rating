
/**
 * Nigerian States and FCT data
 */

export interface StateData {
  code: string;
  name: string;
  cities: string[];
}

export const nigerianStates: StateData[] = [
  {
    code: "AB",
    name: "Abia",
    cities: ["Umuahia", "Aba", "Ohafia", "Arochukwu", "Bende", "Uzuakoli"]
  },
  {
    code: "AD",
    name: "Adamawa",
    cities: ["Yola", "Mubi", "Jimeta", "Ganye", "Numan", "Mayo-Belwa"]
  },
  {
    code: "AK",
    name: "Akwa Ibom",
    cities: ["Uyo", "Eket", "Ikot Ekpene", "Oron", "Abak", "Itu"]
  },
  {
    code: "AN",
    name: "Anambra",
    cities: ["Awka", "Onitsha", "Nnewi", "Ekwulobia", "Ihiala", "Aguata"]
  },
  {
    code: "BA",
    name: "Bauchi",
    cities: ["Bauchi", "Azare", "Misau", "Jama'are", "Dass", "Tafawa Balewa"]
  },
  {
    code: "BY",
    name: "Bayelsa",
    cities: ["Yenagoa", "Brass", "Nembe", "Ogbia", "Sagbama", "Ekeremor"]
  },
  {
    code: "BE",
    name: "Benue",
    cities: ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala", "Oju", "Vandeikya"]
  },
  {
    code: "BO",
    name: "Borno",
    cities: ["Maiduguri", "Biu", "Gwoza", "Bama", "Konduga", "Monguno"]
  },
  {
    code: "CR",
    name: "Cross River",
    cities: ["Calabar", "Ogoja", "Obudu", "Ikom", "Odukpani", "Akamkpa"]
  },
  {
    code: "DE",
    name: "Delta",
    cities: ["Asaba", "Warri", "Ughelli", "Sapele", "Agbor", "Burutu"]
  },
  {
    code: "EB",
    name: "Ebonyi",
    cities: ["Abakaliki", "Afikpo", "Onueke", "Ishieke", "Ezzamgbo", "Unwana"]
  },
  {
    code: "ED",
    name: "Edo",
    cities: ["Benin City", "Auchi", "Ekpoma", "Uromi", "Sabongida-Ora", "Igarra"]
  },
  {
    code: "EK",
    name: "Ekiti",
    cities: ["Ado-Ekiti", "Ikere", "Efon", "Ijero", "Ikole", "Ise"]
  },
  {
    code: "EN",
    name: "Enugu",
    cities: ["Enugu", "Nsukka", "Oji River", "Awgu", "Udi", "Agbani"]
  },
  {
    code: "FC",
    name: "Federal Capital Territory",
    cities: ["Abuja", "Gwagwalada", "Kuje", "Bwari", "Kwali", "Abaji"]
  },
  {
    code: "GO",
    name: "Gombe",
    cities: ["Gombe", "Billiri", "Dukku", "Kaltungo", "Bajoga", "Kumo"]
  },
  {
    code: "IM",
    name: "Imo",
    cities: ["Owerri", "Orlu", "Okigwe", "Mbaise", "Oguta", "Nkwerre"]
  },
  {
    code: "JI",
    name: "Jigawa",
    cities: ["Dutse", "Hadejia", "Birnin Kudu", "Gumel", "Kazaure", "Ringim"]
  },
  {
    code: "KD",
    name: "Kaduna",
    cities: ["Kaduna", "Zaria", "Kafanchan", "Kachia", "Birnin Gwari", "Saminaka"]
  },
  {
    code: "KN",
    name: "Kano",
    cities: ["Kano", "Bichi", "Wudil", "Gaya", "Rano", "Karaye"]
  },
  {
    code: "KT",
    name: "Katsina",
    cities: ["Katsina", "Funtua", "Daura", "Jibia", "Dutsin-Ma", "Kankia"]
  },
  {
    code: "KE",
    name: "Kebbi",
    cities: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru", "Jega", "Koko"]
  },
  {
    code: "KO",
    name: "Kogi",
    cities: ["Lokoja", "Okene", "Kabba", "Anyigba", "Idah", "Ankpa"]
  },
  {
    code: "KW",
    name: "Kwara",
    cities: ["Ilorin", "Offa", "Omu-Aran", "Patigi", "Jebba", "Lafiagi"]
  },
  {
    code: "LA",
    name: "Lagos",
    cities: ["Ikeja", "Lagos Island", "Badagry", "Epe", "Ikorodu", "Mushin"]
  },
  {
    code: "NA",
    name: "Nasarawa",
    cities: ["Lafia", "Keffi", "Akwanga", "Nasarawa", "Wamba", "Keana"]
  },
  {
    code: "NI",
    name: "Niger",
    cities: ["Minna", "Bida", "Kontagora", "Suleja", "Lapai", "New Bussa"]
  },
  {
    code: "OG",
    name: "Ogun",
    cities: ["Abeokuta", "Ijebu Ode", "Sagamu", "Ilaro", "Ota", "Ifo"]
  },
  {
    code: "ON",
    name: "Ondo",
    cities: ["Akure", "Ondo", "Owo", "Ikare", "Ilaje", "Okitipupa"]
  },
  {
    code: "OS",
    name: "Osun",
    cities: ["Osogbo", "Ile-Ife", "Ilesa", "Ede", "Iwo", "Ikire"]
  },
  {
    code: "OY",
    name: "Oyo",
    cities: ["Ibadan", "Ogbomosho", "Oyo", "Iseyin", "Saki", "Igboho"]
  },
  {
    code: "PL",
    name: "Plateau",
    cities: ["Jos", "Pankshin", "Shendam", "Barkin Ladi", "Langtang", "Mangu"]
  },
  {
    code: "RI",
    name: "Rivers",
    cities: ["Port Harcourt", "Bonny", "Okrika", "Opobo", "Buguma", "Bori"]
  },
  {
    code: "SO",
    name: "Sokoto",
    cities: ["Sokoto", "Tambuwal", "Wurno", "Gada", "Illela", "Rabah"]
  },
  {
    code: "TA",
    name: "Taraba",
    cities: ["Jalingo", "Wukari", "Bali", "Gembu", "Takum", "Ibi"]
  },
  {
    code: "YO",
    name: "Yobe",
    cities: ["Damaturu", "Potiskum", "Gashua", "Nguru", "Geidam", "Buni Yadi"]
  },
  {
    code: "ZA",
    name: "Zamfara",
    cities: ["Gusau", "Kaura Namoda", "Talata Mafara", "Anka", "Zurmi", "Shinkafi"]
  }
];

// Get all states as an array of names
export const getAllStates = (): string[] => {
  return nigerianStates.map(state => state.name);
};

// Get all cities for a given state
export const getCitiesByState = (stateName: string): string[] => {
  const state = nigerianStates.find(
    s => s.name.toLowerCase() === stateName.toLowerCase()
  );
  return state ? state.cities : [];
};

// Get state by name or code
export const getStateByNameOrCode = (nameOrCode: string): StateData | undefined => {
  return nigerianStates.find(
    s => 
      s.name.toLowerCase() === nameOrCode.toLowerCase() || 
      s.code.toLowerCase() === nameOrCode.toLowerCase()
  );
};
