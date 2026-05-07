// ─── Données partagées (équivalent des props Inertia globales) ────────────────

export const auth = {
  user: {
    id: 1,
    nom: 'Admin Démo',
    email: 'admin@incunable.local',
    role: 'admin',
  },
};

export const appConfig = {
  nom_librairie: 'Librairie Incunable',
  theme_hue: 348,
  theme_sat: 62,
  theme_dark: false,
};

export const flash = {};

// ─── Distributeurs ────────────────────────────────────────────────────────────

export const distributeurs = [
  {
    id: 1,
    nom: 'Hachette Livre',
    email: 'comptabilite@hachette.fr',
    telephone: '01 43 92 30 00',
    delai_commandes_mois: 3,
    delai_offices_mois: 2,
    iban: 'FR76 3000 4028 3798 7654 3210 943',
    nb_lettres_actives: 4,
    nb_offices_actifs: 2,
  },
  {
    id: 2,
    nom: 'Gallimard',
    email: 'facturation@gallimard.fr',
    telephone: '01 49 54 42 00',
    delai_commandes_mois: 4,
    delai_offices_mois: 3,
    iban: 'FR76 3000 6000 0112 3456 7890 189',
    nb_lettres_actives: 2,
    nb_offices_actifs: 3,
  },
  {
    id: 3,
    nom: 'Le Seuil',
    email: 'gestion@seuil.com',
    telephone: '01 40 46 50 50',
    delai_commandes_mois: 3,
    delai_offices_mois: 2,
    iban: null,
    nb_lettres_actives: 1,
    nb_offices_actifs: 1,
  },
  {
    id: 4,
    nom: 'Actes Sud',
    email: 'diffusion@actes-sud.fr',
    telephone: '04 90 49 86 91',
    delai_commandes_mois: 5,
    delai_offices_mois: 3,
    iban: 'FR76 3000 4028 3798 0000 1111 222',
    nb_lettres_actives: 0,
    nb_offices_actifs: 1,
  },
];

// ─── Lettres de change ────────────────────────────────────────────────────────

export const lettres = {
  data: [
    {
      id: 1,
      reference: 'LCR-2024-0021',
      distributeur: { id: 1, nom: 'Hachette Livre' },
      montant_ttc: 3450.00,
      date_emission: '2024-10-01',
      date_echeance: '2025-01-01',
      statut: 'en_retard',
      paye_le: null,
      jours_restants: -110,
      notes: 'Commande automne 2024.',
      cree_par: 'Admin Démo',
      cree_le: '01/10/2024',
      lignes: [
        { id: 1, designation: 'Romans — lot automne', quantite: 40, prix_unitaire_ht: 72.50 },
        { id: 2, designation: 'Essais — sélection', quantite: 15, prix_unitaire_ht: 35.00 },
      ],
    },
    {
      id: 2,
      reference: 'LCR-2025-0001',
      distributeur: { id: 2, nom: 'Gallimard' },
      montant_ttc: 1820.00,
      date_emission: '2025-01-15',
      date_echeance: '2025-04-15',
      statut: 'en_attente',
      paye_le: null,
      jours_restants: 5,
      notes: null,
      cree_par: 'Admin Démo',
      cree_le: '15/01/2025',
      lignes: [
        { id: 3, designation: 'Collection Blanche — janvier', quantite: 22, prix_unitaire_ht: 68.00 },
        { id: 4, designation: 'Folio — réassort', quantite: 30, prix_unitaire_ht: 15.00 },
      ],
    },
    {
      id: 3,
      reference: 'LCR-2025-0002',
      distributeur: { id: 1, nom: 'Hachette Livre' },
      montant_ttc: 2100.00,
      date_emission: '2025-02-01',
      date_echeance: '2025-05-01',
      statut: 'en_attente',
      paye_le: null,
      jours_restants: 21,
      notes: 'Commande spéciale foire du livre.',
      cree_par: 'Admin Démo',
      cree_le: '01/02/2025',
      lignes: [],
    },
    {
      id: 4,
      reference: 'LCR-2025-0003',
      distributeur: { id: 3, nom: 'Le Seuil' },
      montant_ttc: 980.50,
      date_emission: '2025-01-20',
      date_echeance: '2025-06-20',
      statut: 'en_attente',
      paye_le: null,
      jours_restants: 61,
      notes: null,
      cree_par: 'Admin Démo',
      cree_le: '20/01/2025',
      lignes: [],
    },
    {
      id: 5,
      reference: 'LCR-2024-0018',
      distributeur: { id: 2, nom: 'Gallimard' },
      montant_ttc: 1650.00,
      date_emission: '2024-09-01',
      date_echeance: '2024-12-01',
      statut: 'paye',
      paye_le: '2024-11-28',
      jours_restants: null,
      notes: null,
      cree_par: 'Admin Démo',
      cree_le: '01/09/2024',
      lignes: [],
    },
  ],
  last_page: 1,
  links: [],
};

// ─── Offices ──────────────────────────────────────────────────────────────────

export const offices = {
  data: [
    {
      id: 1,
      reference: 'OFF-2025-0004',
      distributeur: { id: 1, nom: 'Hachette Livre' },
      type: 'facon',
      montant_ttc: 2300.00,
      montant_retourne: 0,
      montant_net: 2300.00,
      date_reception: '2025-01-10',
      date_retour_limite: '2025-03-10',
      statut: 'en_attente',
      jours_retour_restants: 20,
      notes: 'Officier romans policiers — jan 2025.',
      cree_par: 'Admin Démo',
      lignes: [
        { id: 1, titre: 'La Nuit des Temps', isbn: '978-2-07-036822-8', quantite_recue: 12, quantite_retournee: 0, quantite_disponible: 12 },
        { id: 2, titre: 'Le Petit Prince', isbn: '978-2-07-040850-4', quantite_recue: 8, quantite_retournee: 0, quantite_disponible: 8 },
      ],
    },
    {
      id: 2,
      reference: 'OFF-2025-0003',
      distributeur: { id: 2, nom: 'Gallimard' },
      type: 'grille',
      montant_ttc: 1500.00,
      montant_retourne: 450.00,
      montant_net: 1050.00,
      date_reception: '2024-12-05',
      date_retour_limite: '2025-02-05',
      statut: 'retour_partiel',
      jours_retour_restants: -75,
      notes: null,
      cree_par: 'Admin Démo',
      lignes: [],
    },
    {
      id: 3,
      reference: 'OFF-2024-0021',
      distributeur: { id: 3, nom: 'Le Seuil' },
      type: 'facon',
      montant_ttc: 870.00,
      montant_retourne: 870.00,
      montant_net: 0,
      date_reception: '2024-10-15',
      date_retour_limite: '2024-12-15',
      statut: 'retourne',
      jours_retour_restants: null,
      notes: null,
      cree_par: 'Admin Démo',
      lignes: [],
    },
    {
      id: 4,
      reference: 'OFF-2025-0005',
      distributeur: { id: 4, nom: 'Actes Sud' },
      type: 'exceptionnel',
      montant_ttc: 650.00,
      montant_retourne: 0,
      montant_net: 650.00,
      date_reception: '2025-02-01',
      date_retour_limite: '2025-05-01',
      statut: 'en_attente',
      jours_retour_restants: 41,
      notes: 'Commande exceptionnelle Salon du Livre.',
      cree_par: 'Admin Démo',
      lignes: [],
    },
  ],
  last_page: 1,
  links: [],
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardStats = {
  stats: {
    du_ce_mois: 1820.00,
    du_30j: 3980.50,
    en_retard: 3450.00,
    offices_alerte: 2,
  },
  prochaines: [
    { id: 2, reference: 'LCR-2025-0001', distributeur: 'Gallimard', montant_ttc: 1820.00, date_echeance: '2025-04-15', jours_restants: 5 },
    { id: 3, reference: 'LCR-2025-0002', distributeur: 'Hachette Livre', montant_ttc: 2100.00, date_echeance: '2025-05-01', jours_restants: 21 },
  ],
  alertes_retard: [
    { id: 1, reference: 'LCR-2024-0021', distributeur: 'Hachette Livre', montant_ttc: 3450.00, date_echeance: '2025-01-01' },
  ],
  alertes_proches: [
    { id: 2, reference: 'LCR-2025-0001', distributeur: 'Gallimard', montant_ttc: 1820.00, date_echeance: '2025-04-15', jours_restants: 5 },
  ],
  alertes_offices: [
    { id: 1, reference: 'OFF-2025-0004', distributeur: 'Hachette Livre', date_retour_limite: '2025-03-10' },
  ],
  chart_data: [
    { label: 'Oct 24', lettres: 3450, offices: 870 },
    { label: 'Nov 24', lettres: 0, offices: 0 },
    { label: 'Déc 24', lettres: 1650, offices: 1500 },
    { label: 'Jan 25', lettres: 1820, offices: 2300 },
    { label: 'Fév 25', lettres: 2100, offices: 650 },
    { label: 'Mar 25', lettres: 980, offices: 0 },
  ],
  distrib_stats: [
    { nom: 'Hachette Livre', total: 5550 },
    { nom: 'Gallimard', total: 1820 },
    { nom: 'Le Seuil', total: 980.50 },
    { nom: 'Actes Sud', total: 0 },
  ],
};

// ─── Tickets ──────────────────────────────────────────────────────────────────

export const tickets = [
  {
    id: 1,
    sujet: 'Export PDF des LCR',
    description: 'Serait-il possible d\'ajouter un bouton d\'export PDF sur la page détail d\'une lettre de change ?',
    priorite: 'normale',
    statut: 'ouvert',
    created_at: '2025-02-10',
  },
  {
    id: 2,
    sujet: 'Erreur de calcul sur office retourné partiellement',
    description: 'Lorsque l\'on enregistre un retour partiel, le montant net n\'est pas recalculé automatiquement dans la liste.',
    priorite: 'haute',
    statut: 'en_cours',
    created_at: '2025-03-01',
  },
  {
    id: 3,
    sujet: 'Rappels email non reçus',
    description: 'Les alertes par email configurées pour J-7 ne semblent pas partir. Le SMTP est pourtant configuré.',
    priorite: 'urgente',
    statut: 'ouvert',
    created_at: '2025-03-15',
  },
];

// ─── Corbeille ────────────────────────────────────────────────────────────────

export const corbeille = {
  lettres: [
    {
      id: 99,
      reference: 'LCR-2024-0015',
      distributeur: { nom: 'Gallimard' },
      montant_ttc: 750.00,
      statut: 'en_attente',
      supprime_le: '2025-01-08',
    },
  ],
  offices: [
    {
      id: 98,
      reference: 'OFF-2024-0018',
      distributeur: { nom: 'Hachette Livre' },
      type: 'facon',
      montant_ttc: 430.00,
      statut: 'retourne',
      supprime_le: '2025-02-14',
    },
  ],
};

// ─── Configuration ────────────────────────────────────────────────────────────

export const configuration = {
  nom_librairie: 'Librairie Incunable',
  siret: '123 456 789 00042',
  email: 'contact@incunable.local',
  telephone: '04 91 00 12 34',
  adresse: '12 rue des Librairies\n13001 Marseille',
  delai_commandes_mois: 3,
  delai_offices_mois: 2,
  alerte_7j: true,
  alerte_1j: true,
  alerte_retard: true,
  alerte_retour_expiration: true,
  alerte_recap_hebdo: false,
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_username: 'contact@incunable.local',
  smtp_password: '',
  smtp_from_email: 'contact@incunable.local',
  smtp_from_name: 'Incunable',
  smtp_tls: true,
  theme_hue: 348,
  theme_sat: 62,
  theme_dark: false,
};
