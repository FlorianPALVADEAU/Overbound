
export const COMPANY_INFO = {
  legalName: 'Overbound SASU',
  legalForm: 'Société par Actions Simplifiée Unipersonnelle',
  capital: '5000 €',

  address: {
    street: '105 rue de la brèche du houx',
    city: 'Jouars-Pontchartrain',
    zipCode: '78350',
    country: 'France',
    full: '105 rue de la brèche du houx, Jouars-Pontchartrain, France',
  },

  rcs: {
    city: 'Versailles',
    number: '992 578 229',
    full: 'RCS Versailles 992 578 229',
  },

  vat: 'FR84 992578229',

  director: {
    name: 'Florian Palvadeau',
    title: 'Président',
  },

  contact: {
    email: 'contact@overbound-race.com',
    phone: '+33 (0)6 52 26 60 54',
    phoneFormatted: '+33 6 52 26 60 54',
  },

  emails: {
    general: 'contact@overbound-race.com',
    support: 'contact@overbound-race.com',
    press: 'press@overbound-race.com',
    partnerships: 'partners@overbound-race.com',
    privacy: 'contact@overbound-race.com',
    dpo: 'dpo@overbound-race.com',
    medical: 'contact@overbound-race.com',
    billing: 'contact@overbound-race.com',
    brand: 'contact@overbound-race.com',
  },

  supportHours: 'Du lundi au vendredi, 9h00 – 18h00 (CET)',

  hosting: {
    web: {
      name: 'Vercel Inc.',
      address: '340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis',
      website: 'https://vercel.com',
    },
    database: {
      name: 'Supabase Inc.',
      address: '970 Toa Payoh North #07-04, Singapour',
      website: 'https://supabase.com',
    },
  },

  // DPO (Délégué à la Protection des Données)
  dpo: {
    name: 'Cabinet LexData',
    address: '12 rue d\'Uzès, 75002 Paris',
    email: 'dpo@overbound-race.com',
  },

  mediation: {
    name: 'CM2C - Centre de médiation de la consommation des conciliateurs de justice',
    address: '14 rue Saint Jean, 75017 Paris',
    website: 'https://cm2c.net',
  },

  website: {
    url: 'https://overbound-race.com',
    name: 'Overbound',
  },
} as const

export const getFullAddress = () => COMPANY_INFO.address.full

export const getFullRCS = () => COMPANY_INFO.rcs.full

export const getFullIdentification = () => ({
  legalName: COMPANY_INFO.legalName,
  legalForm: COMPANY_INFO.legalForm,
  capital: COMPANY_INFO.capital,
  address: COMPANY_INFO.address.full,
  rcs: COMPANY_INFO.rcs.full,
  vat: COMPANY_INFO.vat,
})
