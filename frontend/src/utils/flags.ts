const COUNTRY_CODES: Record<string, string> = {
  Argentina: 'ar',
  Argelia: 'dz',
  Australia: 'au',
  Austria: 'at',
  Belgica: 'be',
  'Bosnia y Herzegovina': 'ba',
  Brasil: 'br',
  'Cabo Verde': 'cv',
  Camerun: 'cm',
  Canada: 'ca',
  Catar: 'qa',
  Colombia: 'co',
  'Corea del Sur': 'kr',
  'Costa de Marfil': 'ci',
  Croacia: 'hr',
  Dinamarca: 'dk',
  Ecuador: 'ec',
  Espana: 'es',
  'Estados Unidos': 'us',
  Francia: 'fr',
  Ghana: 'gh',
  Haiti: 'ht',
  Hungria: 'hu',
  Inglaterra: 'gb',
  Iran: 'ir',
  Italia: 'it',
  Japon: 'jp',
  Mali: 'ml',
  Marruecos: 'ma',
  Mexico: 'mx',
  Nigeria: 'ng',
  'Nueva Zelanda': 'nz',
  'Paises Bajos': 'nl',
  Panama: 'pa',
  Paraguay: 'py',
  Polonia: 'pl',
  Portugal: 'pt',
  'Republica Checa': 'cz',
  Senegal: 'sn',
  Serbia: 'rs',
  Sudafrica: 'za',
  Suecia: 'se',
  Suiza: 'ch',
  Tunez: 'tn',
  Turquia: 'tr',
  Ucrania: 'ua',
  Uruguay: 'uy',
  Alemania: 'de',
  'Arabia Saudita': 'sa',
};

export function getFlagUrl(pais: string): string {
  const code = COUNTRY_CODES[pais];
  if (!code) return '';
  return `https://flagcdn.com/w20/${code}.png`;
}

export function getFlagSrcset(pais: string): string {
  const code = COUNTRY_CODES[pais];
  if (!code) return '';
  return `https://flagcdn.com/w40/${code}.png 2x`;
}
