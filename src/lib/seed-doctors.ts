// Test-Ärzte-Seed: 50 Ärzte pro Bundesland × 16 = 800 Ärzte

export interface SeedDoctor {
  id: string;
  name: string;
  specialty: string;
  address: string;
  city: string;
  zip: string;
  bundesland: string;
  lat: number;
  lon: number;
  phone: string;
  email: string;
}

const SPECIALTIES = [
  "allgemeinmedizin", "innere_medizin", "orthopadie", "dermatologie", "hno",
  "augenheilkunde", "gynakologie", "urologie", "neurologie", "psychiatrie",
  "kardiologie", "zahnarzt", "radiologie", "gastroenterologie", "kinderheilkunde",
];

const SPECIALTY_LABELS: Record<string, string> = {
  allgemeinmedizin: "Allgemeinmedizin", innere_medizin: "Innere Medizin",
  orthopadie: "Orthopädie", dermatologie: "Dermatologie", hno: "HNO",
  augenheilkunde: "Augenheilkunde", gynakologie: "Gynäkologie",
  urologie: "Urologie", neurologie: "Neurologie", psychiatrie: "Psychiatrie",
  kardiologie: "Kardiologie", zahnarzt: "Zahnarzt",
  radiologie: "Radiologie", gastroenterologie: "Gastroenterologie",
  kinderheilkunde: "Kinderheilkunde",
};

const MALE_FIRST = ["Hans", "Klaus", "Werner", "Peter", "Karl", "Dieter", "Stefan", "Andreas",
  "Michael", "Thomas", "Martin", "Christian", "Johannes", "Alexander", "Sebastian",
  "Florian", "Markus", "Jürgen", "Bernd", "Ralf", "Ulrich", "Manfred", "Frank",
  "Tobias", "Daniel"];
const FEMALE_FIRST = ["Maria", "Anna", "Ursula", "Christine", "Monika", "Claudia", "Petra",
  "Sabine", "Sandra", "Andrea", "Nicole", "Julia", "Stefanie", "Lisa", "Sarah",
  "Laura", "Katharina", "Eva", "Helga", "Inge", "Renate", "Brigitte", "Susanne",
  "Karin", "Heike"];
const LAST = ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner",
  "Becker", "Schulz", "Hoffmann", "Koch", "Richter", "Bauer", "Klein", "Wolf",
  "Schröder", "Neumann", "Schwarz", "Zimmermann", "Braun", "Krüger", "Hofmann",
  "Hartmann", "Lange", "Schmitt", "Werner", "Schmitz", "Huber", "Herrmann",
  "Walter", "König", "Schulze", "Ritter", "Schubert", "Vogt", "Sommer",
  "Kunze", "Vogel", "Keller", "Lorenz"];
const STREETS = ["Hauptstraße", "Bahnhofstraße", "Kirchstraße", "Schillerstraße",
  "Goethestraße", "Mozartstraße", "Lindenstraße", "Gartenstraße", "Bergstraße",
  "Waldstraße", "Mühlenweg", "Bismarckstraße", "Kaiserstraße", "Ringstraße",
  "Marktstraße", "Friedrichstraße", "Wilhelmstraße", "Dorfstraße", "Parkstraße",
  "Rathausplatz", "Am Stadtpark", "Brunnenweg", "Rosenstraße", "Tulpenweg"];

// [city, zip, lat, lon]
const BUNDESLAENDER: Record<string, [string, string, number, number][]> = {
  "Baden-Württemberg": [
    ["Stuttgart", "70173", 48.7758, 9.1829], ["Karlsruhe", "76131", 49.0069, 8.4037],
    ["Mannheim", "68161", 49.4875, 8.4660], ["Freiburg im Breisgau", "79098", 47.9990, 7.8421],
    ["Heidelberg", "69115", 49.3988, 8.6724], ["Ulm", "89073", 48.3984, 9.9915],
    ["Heilbronn", "74072", 49.1427, 9.2109], ["Pforzheim", "75175", 48.8924, 8.6917],
    ["Reutlingen", "72764", 48.4912, 9.2042], ["Tübingen", "72070", 48.5216, 9.0576],
  ],
  "Bayern": [
    ["München", "80331", 48.1351, 11.5820], ["Nürnberg", "90402", 49.4521, 11.0767],
    ["Augsburg", "86150", 48.3717, 10.8983], ["Regensburg", "93047", 49.0134, 12.1016],
    ["Würzburg", "97070", 49.7913, 9.9534], ["Ingolstadt", "85049", 48.7665, 11.4258],
    ["Fürth", "90762", 49.4774, 10.9893], ["Erlangen", "91052", 49.5897, 11.0078],
    ["Bamberg", "96052", 49.8988, 10.9028], ["Bayreuth", "95444", 49.9456, 11.5714],
  ],
  "Berlin": [
    ["Berlin", "10115", 52.5200, 13.4050], ["Berlin", "10625", 52.5167, 13.3033],
    ["Berlin", "10827", 52.4833, 13.3500], ["Berlin", "10435", 52.5367, 13.4167],
    ["Berlin", "10997", 52.4997, 13.4032], ["Berlin", "12101", 52.4742, 13.3810],
    ["Berlin", "13347", 52.5492, 13.3636], ["Berlin", "10245", 52.5050, 13.4500],
    ["Berlin", "14195", 52.4564, 13.2985], ["Berlin", "12167", 52.4417, 13.3333],
  ],
  "Brandenburg": [
    ["Potsdam", "14467", 52.3906, 13.0645], ["Cottbus", "03046", 51.7563, 14.3329],
    ["Frankfurt (Oder)", "15230", 52.3400, 14.5541], ["Brandenburg an der Havel", "14770", 52.4122, 12.5386],
    ["Eberswalde", "16225", 52.8363, 13.8261], ["Oranienburg", "16515", 52.7556, 13.2378],
    ["Neuruppin", "16816", 52.9241, 12.8022], ["Strausberg", "15344", 52.5781, 13.8876],
  ],
  "Bremen": [
    ["Bremen", "28195", 53.0793, 8.8017], ["Bremen", "28201", 53.0667, 8.7500],
    ["Bremen", "28325", 53.0833, 8.9167], ["Bremerhaven", "27568", 53.5367, 8.5797],
    ["Bremen", "28357", 53.1000, 8.8667],
  ],
  "Hamburg": [
    ["Hamburg", "20095", 53.5503, 9.9926], ["Hamburg", "22765", 53.5500, 9.9333],
    ["Hamburg", "22041", 53.5667, 10.0833], ["Hamburg", "21029", 53.4833, 10.2167],
    ["Hamburg", "21073", 53.4583, 9.9917], ["Hamburg", "22299", 53.5917, 10.0167],
    ["Hamburg", "20253", 53.5750, 9.9667], ["Hamburg", "22089", 53.5583, 10.0500],
  ],
  "Hessen": [
    ["Frankfurt am Main", "60311", 50.1109, 8.6821], ["Wiesbaden", "65183", 50.0782, 8.2397],
    ["Kassel", "34117", 51.3127, 9.4797], ["Darmstadt", "64283", 49.8728, 8.6512],
    ["Marburg", "35037", 50.8023, 8.7659], ["Offenbach am Main", "63065", 50.1073, 8.7632],
    ["Gießen", "35390", 50.5845, 8.6842], ["Fulda", "36037", 50.5557, 9.6769],
    ["Hanau", "63450", 50.1314, 8.9212], ["Wetzlar", "35578", 50.5597, 8.5076],
  ],
  "Mecklenburg-Vorpommern": [
    ["Rostock", "18055", 54.0924, 12.0991], ["Schwerin", "19053", 53.6296, 11.4141],
    ["Greifswald", "17489", 54.0948, 13.3806], ["Stralsund", "18435", 54.3085, 13.0881],
    ["Neubrandenburg", "17033", 53.5565, 13.2596], ["Wismar", "23966", 53.8900, 11.4647],
    ["Güstrow", "18273", 53.7969, 12.1772], ["Bergen auf Rügen", "18528", 54.4189, 13.4357],
  ],
  "Niedersachsen": [
    ["Hannover", "30159", 52.3759, 9.7320], ["Braunschweig", "38100", 52.2689, 10.5268],
    ["Oldenburg", "26121", 53.1435, 8.2146], ["Göttingen", "37073", 51.5413, 9.9158],
    ["Wolfsburg", "38440", 52.4227, 10.7865], ["Osnabrück", "49074", 52.2799, 8.0472],
    ["Hildesheim", "31134", 52.1508, 9.9510], ["Salzgitter", "38226", 52.0937, 10.3433],
    ["Lüneburg", "21335", 53.2510, 10.4144], ["Wilhelmshaven", "26382", 53.5300, 8.1000],
  ],
  "Nordrhein-Westfalen": [
    ["Köln", "50667", 50.9333, 6.9500], ["Düsseldorf", "40213", 51.2217, 6.7762],
    ["Dortmund", "44135", 51.5136, 7.4653], ["Essen", "45127", 51.4566, 7.0116],
    ["Duisburg", "47051", 51.4344, 6.7623], ["Bonn", "53111", 50.7374, 7.0982],
    ["Münster", "48143", 51.9607, 7.6261], ["Bielefeld", "33602", 52.0302, 8.5325],
    ["Bochum", "44787", 51.4818, 7.2162], ["Wuppertal", "42103", 51.2562, 7.1508],
  ],
  "Rheinland-Pfalz": [
    ["Mainz", "55116", 49.9929, 8.2473], ["Koblenz", "56068", 50.3569, 7.5890],
    ["Trier", "54290", 49.7544, 6.6413], ["Kaiserslautern", "67655", 49.4401, 7.7491],
    ["Ludwigshafen am Rhein", "67059", 49.4811, 8.4353], ["Worms", "67547", 49.6317, 8.3650],
    ["Neustadt an der Weinstraße", "67433", 49.3508, 8.1378], ["Bad Kreuznach", "55543", 49.8469, 7.8686],
  ],
  "Saarland": [
    ["Saarbrücken", "66111", 49.2354, 6.9969], ["Neunkirchen", "66538", 49.3461, 7.1800],
    ["Homburg", "66424", 49.3200, 7.3400], ["Völklingen", "66333", 49.2500, 6.8400],
    ["St. Ingbert", "66386", 49.2753, 7.1108], ["Saarlouis", "66740", 49.3139, 6.7531],
  ],
  "Sachsen": [
    ["Dresden", "01067", 51.0504, 13.7373], ["Leipzig", "04109", 51.3397, 12.3731],
    ["Chemnitz", "09111", 50.8278, 12.9214], ["Zwickau", "08056", 50.7198, 12.4964],
    ["Plauen", "08523", 50.4972, 12.1347], ["Görlitz", "02826", 51.1563, 14.9878],
    ["Bautzen", "02625", 51.1803, 14.4356], ["Zittau", "02763", 50.8961, 14.8064],
  ],
  "Sachsen-Anhalt": [
    ["Magdeburg", "39104", 52.1205, 11.6276], ["Halle (Saale)", "06108", 51.4969, 11.9691],
    ["Dessau-Roßlau", "06842", 51.8346, 12.2365], ["Wittenberg", "06886", 51.8667, 12.6500],
    ["Stendal", "39576", 52.6052, 11.8598], ["Bernburg", "06406", 51.7886, 11.7419],
    ["Halberstadt", "38820", 51.8960, 11.0480], ["Quedlinburg", "06484", 51.7872, 11.1428],
  ],
  "Schleswig-Holstein": [
    ["Kiel", "24103", 54.3233, 10.1394], ["Lübeck", "23552", 53.8655, 10.6866],
    ["Flensburg", "24937", 54.7933, 9.4367], ["Neumünster", "24534", 54.0714, 9.9870],
    ["Schleswig", "24837", 54.5217, 9.5662], ["Heide", "25746", 54.1950, 9.0967],
    ["Husum", "25813", 54.4722, 9.0594], ["Rendsburg", "24768", 54.3047, 9.6641],
  ],
  "Thüringen": [
    ["Erfurt", "99084", 50.9784, 11.0298], ["Jena", "07743", 50.9274, 11.5863],
    ["Gera", "07545", 50.8815, 12.0820], ["Weimar", "99423", 50.9795, 11.3235],
    ["Eisenach", "99817", 50.9742, 10.3148], ["Gotha", "99867", 50.9474, 10.7003],
    ["Nordhausen", "99734", 51.5039, 10.7889], ["Mühlhausen", "99974", 51.2117, 10.4556],
  ],
};

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 4294967296; };
}

export function generateSeedDoctors(): SeedDoctor[] {
  const doctors: SeedDoctor[] = [];
  let globalIdx = 0;

  for (const [bundesland, cities] of Object.entries(BUNDESLAENDER)) {
    const rand = rng(bundesland.charCodeAt(0) * 31337);

    for (let i = 0; i < 50; i++) {
      const specialty = SPECIALTIES[i % SPECIALTIES.length];
      const city = cities[i % cities.length];
      const [cityName, zip, baseLat, baseLon] = city;

      // Spread doctors within ~3km radius of city center
      const latOffset = (rand() - 0.5) * 0.05;
      const lonOffset = (rand() - 0.5) * 0.07;

      const isFemale = rand() > 0.45;
      const firstName = isFemale
        ? FEMALE_FIRST[Math.floor(rand() * FEMALE_FIRST.length)]
        : MALE_FIRST[Math.floor(rand() * MALE_FIRST.length)];
      const lastName = LAST[Math.floor(rand() * LAST.length)];
      const title = rand() > 0.3 ? "Dr. med. " : (rand() > 0.5 ? "Prof. Dr. " : "");
      const street = STREETS[Math.floor(rand() * STREETS.length)];
      const houseNum = Math.floor(rand() * 120) + 1;

      const specialtyLabel = SPECIALTY_LABELS[specialty];
      const areaCode = zip.slice(0, 3);

      doctors.push({
        id: `seed-${bundesland.slice(0, 3).toLowerCase()}-${i}-${globalIdx}`,
        name: `${title}${firstName} ${lastName}`,
        specialty,
        address: `${street} ${houseNum}`,
        city: cityName,
        zip,
        bundesland,
        lat: baseLat + latOffset,
        lon: baseLon + lonOffset,
        phone: `+49 ${areaCode}0 ${Math.floor(rand() * 9000000) + 1000000}`,
        email: `praxis.${lastName.toLowerCase()}.${specialtyLabel.toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/\s+/g,"")}@testpraxis.de`,
      });

      globalIdx++;
    }
  }

  return doctors;
}
