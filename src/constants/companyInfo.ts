
export const COMPANY_INFO = {
  // Registered name (RCS, AXA certificate); Overbound is the trade name it operates under.
  legalName: 'Palvadeau Organisation',
  tradeName: 'Overbound',
  legalForm: 'Société par Actions Simplifiée Unipersonnelle',
  capital: '5000 €',

  address: {
    street: '105 rue de la brèche du houx',
    city: 'Jouars-Pontchartrain',
    zipCode: '78760',
    country: 'France',
    full: '105 rue de la brèche du houx, 78760 Jouars-Pontchartrain, France',
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

  /**
   * Organiser liability insurance (art. L321-1 Code du sport), from the AXA certificate
   * dated 2026-09-10. Participants must be told its existence, scope and limits
   * (Cass. 1re civ., 28 janv. 2026, n° 24-20.866). Update for every new policy period.
   */
  insurance: {
    insurer: 'AXA France IARD',
    product: 'Responsabilité Civile Prestataire',
    policyNumber: '0000011530476604',
    validFrom: '11/09/2026',
    validUntil: '01/01/2027',
    coveredActivities: 'promotion et organisation de la manifestation sportive Overbound ; restauration et vente de boissons réalisées par des sous-traitants',
    limits: [
      { label: 'Tous dommages confondus (corporels, matériels et immatériels consécutifs)', amount: '9 000 000 € par année d’assurance' },
      { label: 'dont dommages corporels', amount: '9 000 000 € par année d’assurance' },
      { label: 'dont dommages matériels et immatériels consécutifs', amount: '1 200 000 € par année d’assurance' },
      { label: 'Dommages immatériels non consécutifs', amount: '150 000 € par année d’assurance' },
      { label: 'Dommages aux biens confiés', amount: '150 000 € par sinistre' },
      { label: 'Atteinte accidentelle à l’environnement', amount: '1 000 000 € par année d’assurance' },
    ],
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
