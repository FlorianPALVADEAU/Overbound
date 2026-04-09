export type PartnerType = {
    name: string;
    logo: string;
    url?: string;
};

export const PARTNERS_DATA: PartnerType[] = [
    {
        name: 'Au Vieux Campeur',
        logo: '/images/partners_logo/avc_logo.webp',
        url: 'https://www.auvieuxcampeur.fr/'
    },
    // {
    //     name: 'Decathlon',
    //     logo: '/images/partners_logo/decathlon_logo.webp',
    // },
    {
        name: 'Fiskars',
        logo: '/images/partners_logo/fiskars_logo.webp',
    },
    {
        name: 'Intersport Plaisir',
        logo: '/images/partners_logo/intersport_plaisir_logo.webp',
        url: 'https://www.intersport.fr/Yvelines-78/PLAISIR-LESCLAYESSOUSBOIS-78340/INTERSPORT-LESCLAYESSOUSBOIS/00628_000/'
    },
    {
        name: 'Saint Quentin en Yvelines',
        logo: '/images/partners_logo/sqy_logo.webp',
        url: 'https://saint-quentin-en-yvelines.fr/'
    },
    {
        name: 'Département des Yvelines',
        logo: '/images/partners_logo/yvelines_logo.webp',
        url: 'https://www.yvelines.fr/'
    },
    {
        name: 'Ïle de Loisirs de SQY',
        logo: '/images/partners_logo/ile_de_loisirs_logo.webp',
        url: 'https://saint-quentin-en-yvelines.iledeloisirs.fr/'
    },
];