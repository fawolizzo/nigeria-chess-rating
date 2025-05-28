
// Create a proper structure for Nigerian states and cities data
export interface StateData {
  name: string;
  code?: string;
  cities: string[];
}

export const nigerianStates: StateData[] = [
  {
    name: "Abia",
    code: "AB",
    cities: ["Umuahia", "Aba", "Ohafia", "Arochukwu", "Bende", "Uzuakoli"]
  },
  {
    name: "Adamawa",
    code: "AD",
    cities: ["Yola", "Mubi", "Jimeta", "Ganye", "Numan", "Mayo-Belwa"]
  },
  {
    name: "Akwa Ibom",
    code: "AK",
    cities: ["Uyo", "Eket", "Ikot Ekpene", "Oron", "Ibeno", "Abak"]
  },
  {
    name: "Anambra",
    code: "AN",
    cities: ["Awka", "Onitsha", "Nnewi", "Ekwulobia", "Aguata", "Abagana"]
  },
  {
    name: "Bauchi",
    code: "BA",
    cities: ["Bauchi", "Azare", "Misau", "Katagum", "Jama'are", "Ningi"]
  },
  {
    name: "Bayelsa",
    code: "BY",
    cities: ["Yenagoa", "Brass", "Nembe", "Ogbia", "Southern Ijaw", "Ekeremor"]
  },
  {
    name: "Benue",
    code: "BE",
    cities: ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala", "Vandeikya", "Zaki Biam"]
  },
  {
    name: "Borno",
    code: "BO",
    cities: ["Maiduguri", "Biu", "Gwoza", "Damboa", "Bama", "Monguno"]
  },
  {
    name: "Cross River",
    code: "CR",
    cities: ["Calabar", "Ugep", "Ogoja", "Ikom", "Obubra", "Obudu"]
  },
  {
    name: "Delta",
    code: "DE",
    cities: ["Asaba", "Warri", "Sapele", "Agbor", "Ughelli", "Abraka"]
  },
  {
    name: "Ebonyi",
    code: "EB",
    cities: ["Abakaliki", "Afikpo", "Onueke", "Ishiagu", "Okposi", "Uburu"]
  },
  {
    name: "Edo",
    code: "ED",
    cities: ["Benin City", "Auchi", "Ekpoma", "Uromi", "Sabongida-Ora", "Igarra"]
  },
  {
    name: "Ekiti",
    code: "EK",
    cities: ["Ado-Ekiti", "Ikere", "Ikole", "Efon-Alaaye", "Ijero", "Aramoko"]
  },
  {
    name: "Enugu",
    code: "EN",
    cities: ["Enugu", "Nsukka", "Oji River", "Awgu", "Udi", "Agbani"]
  },
  {
    name: "Federal Capital Territory",
    code: "FC",
    cities: ["Abuja", "Gwagwalada", "Kuje", "Bwari", "Kwali", "Abaji"]
  },
  {
    name: "Gombe",
    code: "GO",
    cities: ["Gombe", "Billiri", "Kaltungo", "Bajoga", "Kumo", "Dukku"]
  },
  {
    name: "Imo",
    code: "IM",
    cities: ["Owerri", "Okigwe", "Orlu", "Mbaise", "Oguta", "Mbano"]
  },
  {
    name: "Jigawa",
    code: "JI",
    cities: ["Dutse", "Hadejia", "Gumel", "Kazaure", "Ringim", "Babura"]
  },
  {
    name: "Kaduna",
    code: "KD",
    cities: ["Kaduna", "Zaria", "Kafanchan", "Kagoro", "Kachia", "Birnin Gwari"]
  },
  {
    name: "Kano",
    code: "KN",
    cities: ["Kano", "Dala", "Ungogo", "Rano", "Bichi", "Gwarzo"]
  },
  {
    name: "Katsina",
    code: "KT",
    cities: ["Katsina", "Funtua", "Daura", "Dutsin-Ma", "Kankia", "Jibia"]
  },
  {
    name: "Kebbi",
    code: "KE",
    cities: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru", "Jega", "Koko"]
  },
  {
    name: "Kogi",
    code: "KO",
    cities: ["Lokoja", "Okene", "Kabba", "Idah", "Ankpa", "Isanlu"]
  },
  {
    name: "Kwara",
    code: "KW",
    cities: ["Ilorin", "Offa", "Patigi", "Kaiama", "Jebba", "Omu-Aran"]
  },
  {
    name: "Lagos",
    code: "LA",
    cities: ["Ikeja", "Lagos Island", "Badagry", "Epe", "Ikorodu", "Apapa", "Surulere", "Lekki", "Ajah"]
  },
  {
    name: "Nasarawa",
    code: "NA",
    cities: ["Lafia", "Keffi", "Akwanga", "Nasarawa", "Wamba", "Keana"]
  },
  {
    name: "Niger",
    code: "NI",
    cities: ["Minna", "Bida", "Suleja", "Kontagora", "Lapai", "Agaie"]
  },
  {
    name: "Ogun",
    code: "OG",
    cities: ["Abeokuta", "Ijebu Ode", "Sagamu", "Ilaro", "Ota", "Ijebu-Igbo"]
  },
  {
    name: "Ondo",
    code: "ON",
    cities: ["Akure", "Ondo", "Owo", "Okitipupa", "Ikare", "Ore"]
  },
  {
    name: "Osun",
    code: "OS",
    cities: ["Osogbo", "Ife", "Ilesa", "Ede", "Iwo", "Ejigbo"]
  },
  {
    name: "Oyo",
    code: "OY",
    cities: ["Ibadan", "Ogbomosho", "Oyo", "Iseyin", "Saki", "Igboho"]
  },
  {
    name: "Plateau",
    code: "PL",
    cities: ["Jos", "Pankshin", "Shendam", "Langtang", "Wase", "Barkin Ladi"]
  },
  {
    name: "Rivers",
    code: "RI",
    cities: ["Port Harcourt", "Bonny", "Degema", "Bori", "Ahoada", "Eleme"]
  },
  {
    name: "Sokoto",
    code: "SO",
    cities: ["Sokoto", "Tambuwal", "Gwadabawa", "Illela", "Rabah", "Wurno"]
  },
  {
    name: "Taraba",
    code: "TA",
    cities: ["Jalingo", "Wukari", "Bali", "Gembu", "Takum", "Ibi"]
  },
  {
    name: "Yobe",
    code: "YO",
    cities: ["Damaturu", "Potiskum", "Gashua", "Geidam", "Nguru", "Buni Yadi"]
  },
  {
    name: "Zamfara",
    code: "ZA",
    cities: ["Gusau", "Kaura Namoda", "Talata Mafara", "Anka", "Zurmi", "Tsafe"]
  }
];

// Function to get cities for a state
export const getCitiesByState = (stateName: string): string[] => {
  const state = nigerianStates.find(state => 
    state.name === stateName || 
    (stateName === "FCT" && state.name === "Federal Capital Territory")
  );
  return state ? state.cities : [];
};

// Export the Nigeria states array for convenience
export const NIGERIA_STATES = nigerianStates.map(state => state.name);

// Add the missing getAllStates function
export const getAllStates = (): string[] => {
  return NIGERIA_STATES;
};
