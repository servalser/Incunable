/* Données fictives réalistes pour la prévisualisation */

export const distributeurs = [
  { id: 1, nom: "Hachette Livre", email: "commandes@hachette.fr", telephone: "01 43 92 30 00", delai_commandes_mois: 3, delai_offices_mois: 2, actif: true, nb_lettres_actives: 5, nb_offices_actifs: 3 },
  { id: 2, nom: "Gallimard Distribution", email: "offices@gallimard.fr", telephone: "01 43 20 10 00", delai_commandes_mois: null, delai_offices_mois: 3, actif: true, nb_lettres_actives: 2, nb_offices_actifs: 1 },
  { id: 3, nom: "CDE / Sodis", email: "contact@sodis.fr", telephone: "01 64 33 41 41", delai_commandes_mois: 2, delai_offices_mois: null, actif: true, nb_lettres_actives: 3, nb_offices_actifs: 2 },
  { id: 4, nom: "Interforum", email: "commandes@interforum.fr", telephone: "02 38 32 71 00", delai_commandes_mois: 4, delai_offices_mois: 2, actif: false, nb_lettres_actives: 0, nb_offices_actifs: 0 },
  { id: 5, nom: "Volumen", email: "volumen@volumen.fr", telephone: "01 40 46 01 10", delai_commandes_mois: 3, delai_offices_mois: 3, actif: true, nb_lettres_actives: 1, nb_offices_actifs: 4 },
];

export const lettres = [
  { id: 1, reference: "LCR-2025-0042", statut: "en_retard",  distributeur: { id: 1, nom: "Hachette Livre" },       montant_ttc: 3420.50, date_emission: "2025-01-15", date_echeance: "2025-04-15", paye_le: null,                 jours_restants: -8,  notes: "Commande hiver 2025 — réassort BD et romans.", created_at: "2025-01-15T10:30:00", cree_par: { nom: "Marie Dupont" }, lignes: [{ id:1, designation:"Romans adulte", quantite:24, prix_unitaire_ht:8.50, montant_ht:204 },{ id:2, designation:"Bandes dessinées", quantite:18, prix_unitaire_ht:11.20, montant_ht:201.60 }] },
  { id: 2, reference: "LCR-2025-0043", statut: "en_attente", distributeur: { id: 2, nom: "Gallimard Distribution" }, montant_ttc: 1850.00, date_emission: "2025-02-01", date_echeance: "2025-05-01", paye_le: null,                 jours_restants: 5,   notes: null,                                             created_at: "2025-02-01T09:00:00", cree_par: { nom: "Marie Dupont" }, lignes: [] },
  { id: 3, reference: "LCR-2025-0041", statut: "paye",       distributeur: { id: 1, nom: "Hachette Livre" },       montant_ttc: 2100.00, date_emission: "2025-01-01", date_echeance: "2025-04-01", paye_le: "2025-03-28T14:00:00", jours_restants: 0,   notes: null,                                             created_at: "2025-01-01T08:00:00", cree_par: { nom: "Thomas Martin" }, lignes: [] },
  { id: 4, reference: "LCR-2025-0044", statut: "en_attente", distributeur: { id: 3, nom: "CDE / Sodis" },          montant_ttc: 4780.00, date_emission: "2025-02-15", date_echeance: "2025-04-25", paye_le: null,                 jours_restants: 2,   notes: "Urgence — rappel envoyé le 20/04.",              created_at: "2025-02-15T11:00:00", cree_par: { nom: "Marie Dupont" }, lignes: [] },
  { id: 5, reference: "LCR-2025-0040", statut: "en_retard",  distributeur: { id: 5, nom: "Volumen" },              montant_ttc: 920.00,  date_emission: "2024-12-01", date_echeance: "2025-03-01", paye_le: null,                 jours_restants: -53, notes: null,                                             created_at: "2024-12-01T08:00:00", cree_par: { nom: "Thomas Martin" }, lignes: [] },
  { id: 6, reference: "LCR-2025-0045", statut: "en_attente", distributeur: { id: 2, nom: "Gallimard Distribution" }, montant_ttc: 3100.00, date_emission: "2025-03-01", date_echeance: "2025-06-01", paye_le: null,               jours_restants: 39,  notes: null,                                             created_at: "2025-03-01T09:00:00", cree_par: { nom: "Marie Dupont" }, lignes: [] },
  { id: 7, reference: "LCR-2025-0039", statut: "paye",       distributeur: { id: 3, nom: "CDE / Sodis" },          montant_ttc: 1560.00, date_emission: "2024-11-15", date_echeance: "2025-02-15", paye_le: "2025-02-10T10:00:00", jours_restants: 0,   notes: null,                                             created_at: "2024-11-15T08:00:00", cree_par: { nom: "Thomas Martin" }, lignes: [] },
];

export const offices = [
  { id: 1, reference: "OFF-2025-0018", statut: "en_retard",     type: "facon",        distributeur: { id: 1, nom: "Hachette Livre" },       montant_ttc: 5200.00, montant_retourne: 800.00,  montant_net: 4400.00, date_reception: "2025-01-10", date_retour_limite: "2025-03-10", paye_le: null, jours_restants: -43, notes: "Office printemps littéraire.", created_at: "2025-01-10T08:00:00", cree_par: { nom: "Marie Dupont" }, lignes: [{ id:1, titre:"Sérotonine", isbn:"9782072920226", quantite_recue:12, quantite_retournee:3, quantite_disponible:9, prix_unitaire_ttc:20.90 },{ id:2, titre:"La Carte et le Territoire", isbn:"9782072920210", quantite_recue:8, quantite_retournee:2, quantite_disponible:6, prix_unitaire_ttc:22.50 }] },
  { id: 2, reference: "OFF-2025-0019", statut: "en_attente",    type: "grille",       distributeur: { id: 2, nom: "Gallimard Distribution" }, montant_ttc: 3800.00, montant_retourne: 0,       montant_net: 3800.00, date_reception: "2025-02-20", date_retour_limite: "2025-05-20", paye_le: null, jours_restants: 27,  notes: null,                          created_at: "2025-02-20T09:00:00", cree_par: { nom: "Thomas Martin" }, lignes: [] },
  { id: 3, reference: "OFF-2025-0017", statut: "retour_partiel", type: "facon",        distributeur: { id: 3, nom: "CDE / Sodis" },          montant_ttc: 2400.00, montant_retourne: 900.00,  montant_net: 1500.00, date_reception: "2025-01-05", date_retour_limite: "2025-03-05", paye_le: null, jours_restants: -48, notes: null,                          created_at: "2025-01-05T08:00:00", cree_par: { nom: "Marie Dupont" }, lignes: [] },
  { id: 4, reference: "OFF-2025-0020", statut: "retourne",      type: "exceptionnel", distributeur: { id: 5, nom: "Volumen" },              montant_ttc: 1100.00, montant_retourne: 1100.00, montant_net: 0,       date_reception: "2025-02-01", date_retour_limite: "2025-04-01", paye_le: null, jours_restants: 0,   notes: "Foire du livre.",             created_at: "2025-02-01T08:00:00", cree_par: { nom: "Thomas Martin" }, lignes: [] },
  { id: 5, reference: "OFF-2025-0021", statut: "paye",          type: "grille",       distributeur: { id: 1, nom: "Hachette Livre" },       montant_ttc: 4600.00, montant_retourne: 1200.00, montant_net: 3400.00, date_reception: "2024-12-15", date_retour_limite: "2025-02-15", paye_le: "2025-04-01T10:00:00", jours_restants: 0, notes: null,           created_at: "2024-12-15T08:00:00", cree_par: { nom: "Marie Dupont" }, lignes: [] },
];

export const tickets = [
  { id: 1, sujet: "Erreur sur le montant de LCR-2025-0042", description: "Le montant affiché ne correspond pas à la facture papier reçue. Différence de 12,50 €. Merci de vérifier.", priorite: "haute", statut: "ouvert",   cree_par: { nom: "Marie Dupont" },  created_at: "2025-04-20T14:30:00" },
  { id: 2, sujet: "Ajouter le distributeur Dilicom",         description: "Nous travaillons maintenant avec Dilicom pour les commandes numériques. Il faudrait l'ajouter dans la liste des fournisseurs avec un délai LCR de 2 mois.", priorite: "normale", statut: "en_cours", cree_par: { nom: "Thomas Martin" }, created_at: "2025-04-18T09:00:00" },
  { id: 3, sujet: "Les alertes e-mail ne fonctionnent pas",  description: "Je n'ai reçu aucune alerte pour les LCR en retard ce mois-ci alors que la configuration SMTP est correcte.", priorite: "urgente", statut: "ouvert",   cree_par: { nom: "Marie Dupont" },  created_at: "2025-04-22T08:15:00" },
  { id: 4, sujet: "Question sur le délai par défaut",        description: "Quelle est la différence entre le délai défini sur le fournisseur et le délai par défaut de la configuration ?", priorite: "faible", statut: "ferme",   cree_par: { nom: "Thomas Martin" }, created_at: "2025-04-10T11:00:00" },
];

export const config = {
  nom_librairie: "Librairie du Vieux Carré", siret: "48250261500025", email: "contact@vieux-carre.fr",
  telephone: "04 67 58 12 34", adresse: "12 rue de la Loge\n34000 Montpellier",
  delai_commandes_mois: 3, delai_offices_mois: 2,
  alerte_7j: true, alerte_1j: false, alerte_retard: true, alerte_retour_expiration: true, alerte_recap_hebdo: false,
  smtp_host: "smtp.gmail.com", smtp_port: 587, smtp_username: "contact@vieux-carre.fr", smtp_password: "••••••••",
  smtp_from_email: "contact@vieux-carre.fr", smtp_from_name: "Librairie du Vieux Carré", smtp_tls: true,
  theme_hue: 160, theme_sat: 65, theme_dark: false,
};

export const stats = {
  du_ce_mois: 3420.50, du_30j: 6570.50, en_retard: 4340.50, offices_alerte: 2,
};

export const chart_data = [
  { label: "Mai 24",  lettres: 4200,  offices: 3100 },
  { label: "Juin 24", lettres: 2800,  offices: 5400 },
  { label: "Juil 24", lettres: 1200,  offices: 2200 },
  { label: "Août 24", lettres: 800,   offices: 900  },
  { label: "Sep 24",  lettres: 5600,  offices: 4300 },
  { label: "Oct 24",  lettres: 7200,  offices: 3800 },
  { label: "Nov 24",  lettres: 6100,  offices: 6200 },
  { label: "Déc 24",  lettres: 8400,  offices: 9100 },
  { label: "Jan 25",  lettres: 5520,  offices: 7200 },
  { label: "Fév 25",  lettres: 4950,  offices: 5800 },
  { label: "Mar 25",  lettres: 3100,  offices: 4400 },
  { label: "Avr 25",  lettres: 6340,  offices: 3200 },
];

export const distrib_stats = [
  { nom: "Hachette Livre",       total: 3420.50 },
  { nom: "CDE / Sodis",          total: 5700.00 },
  { nom: "Gallimard Distribution",total: 1850.00 },
  { nom: "Volumen",               total: 920.00  },
];

export const alertes_retard  = lettres.filter(l => l.statut === 'en_retard').map(l => ({ ...l, distributeur: l.distributeur.nom }));
export const alertes_proches = lettres.filter(l => l.jours_restants >= 0 && l.jours_restants <= 7).map(l => ({ ...l, distributeur: l.distributeur.nom }));
export const alertes_offices = offices.filter(o => o.jours_restants >= 0 && o.jours_restants <= 30).map(o => ({ ...o, distributeur: o.distributeur.nom }));

export const lettres_supprimees = [
  { id: 8, reference: "LCR-2024-0031", distributeur: { nom: "Interforum" }, montant_ttc: 1200.00, statut: "en_attente", supprime_le: "2025-03-15" },
  { id: 9, reference: "LCR-2024-0028", distributeur: { nom: "Hachette Livre" }, montant_ttc: 670.50, statut: "en_retard", supprime_le: "2025-02-28" },
];

export const offices_supprimes = [
  { id: 6, reference: "OFF-2024-0012", distributeur: { nom: "CDE / Sodis" }, montant_ttc: 3400.00, statut: "retour_partiel", supprime_le: "2025-04-01" },
];

/* ══════════════════════════════════════════════════════════════
   STOCK — catalogue livres + mouvements
   ══════════════════════════════════════════════════════════════ */
export const livres = [
  { id: 1,  isbn: "9782072920226", titre: "Sérotonine",                    auteur: "Michel Houellebecq",      editeur: "Flammarion",          distributeur: { id: 1, nom: "Hachette Livre" },       prix_ttc: 20.90, categorie: "Roman",       quantite: 12, seuil_alerte: 3,  quantite_commandee: 0,  derniere_vente: "2025-04-22", created_at: "2024-09-01" },
  { id: 2,  isbn: "9782072920210", titre: "La Carte et le Territoire",     auteur: "Michel Houellebecq",      editeur: "Flammarion",          distributeur: { id: 1, nom: "Hachette Livre" },       prix_ttc: 22.50, categorie: "Roman",       quantite: 3,  seuil_alerte: 3,  quantite_commandee: 0,  derniere_vente: "2025-04-18", created_at: "2024-09-01" },
  { id: 3,  isbn: "9782070360024", titre: "L'Étranger",                    auteur: "Albert Camus",            editeur: "Gallimard",           distributeur: { id: 2, nom: "Gallimard Distribution" }, prix_ttc: 7.50,  categorie: "Classique",  quantite: 28, seuil_alerte: 5,  quantite_commandee: 0,  derniere_vente: "2025-04-23", created_at: "2024-06-15" },
  { id: 4,  isbn: "9782070360031", titre: "La Nausée",                     auteur: "Jean-Paul Sartre",        editeur: "Gallimard",           distributeur: { id: 2, nom: "Gallimard Distribution" }, prix_ttc: 8.90,  categorie: "Classique",  quantite: 7,  seuil_alerte: 5,  quantite_commandee: 0,  derniere_vente: "2025-04-15", created_at: "2024-06-15" },
  { id: 5,  isbn: "9782253004226", titre: "Le Petit Prince",               auteur: "Antoine de Saint-Exupéry","editeur": "Gallimard",          distributeur: { id: 2, nom: "Gallimard Distribution" }, prix_ttc: 8.20,  categorie: "Jeunesse",   quantite: 45, seuil_alerte: 10, quantite_commandee: 20, derniere_vente: "2025-04-24", created_at: "2024-03-01" },
  { id: 6,  isbn: "9782264078650", titre: "Dune",                          auteur: "Frank Herbert",           editeur: "Robert Laffont",      distributeur: { id: 3, nom: "CDE / Sodis" },          prix_ttc: 14.90, categorie: "SF",          quantite: 1,  seuil_alerte: 4,  quantite_commandee: 12, derniere_vente: "2025-04-21", created_at: "2024-11-01" },
  { id: 7,  isbn: "9782070360840", titre: "Madame Bovary",                 auteur: "Gustave Flaubert",        editeur: "Gallimard",           distributeur: { id: 2, nom: "Gallimard Distribution" }, prix_ttc: 9.50,  categorie: "Classique",  quantite: 15, seuil_alerte: 4,  quantite_commandee: 0,  derniere_vente: "2025-04-10", created_at: "2024-06-15" },
  { id: 8,  isbn: "9782714300560", titre: "Les Misérables",                auteur: "Victor Hugo",             editeur: "Le Livre de Poche",   distributeur: { id: 3, nom: "CDE / Sodis" },          prix_ttc: 12.90, categorie: "Classique",  quantite: 9,  seuil_alerte: 4,  quantite_commandee: 0,  derniere_vente: "2025-04-08", created_at: "2024-06-15" },
  { id: 9,  isbn: "9782221256701", titre: "Fondation",                     auteur: "Isaac Asimov",            editeur: "Robert Laffont",      distributeur: { id: 3, nom: "CDE / Sodis" },          prix_ttc: 12.50, categorie: "SF",          quantite: 0,  seuil_alerte: 3,  quantite_commandee: 6,  derniere_vente: "2025-04-19", created_at: "2024-11-01" },
  { id: 10, isbn: "9782266312561", titre: "Neuromancien",                  auteur: "William Gibson",          editeur: "J'ai lu",             distributeur: { id: 5, nom: "Volumen" },              prix_ttc: 9.90,  categorie: "SF",          quantite: 4,  seuil_alerte: 3,  quantite_commandee: 0,  derniere_vente: "2025-03-28", created_at: "2024-11-01" },
  { id: 11, isbn: "9782211050210", titre: "Où est Charlie ?",              auteur: "Martin Handford",         editeur: "Gründ",               distributeur: { id: 1, nom: "Hachette Livre" },       prix_ttc: 11.90, categorie: "Jeunesse",   quantite: 22, seuil_alerte: 6,  quantite_commandee: 0,  derniere_vente: "2025-04-22", created_at: "2024-03-01" },
  { id: 12, isbn: "9782290349229", titre: "1984",                          auteur: "George Orwell",           editeur: "J'ai lu",             distributeur: { id: 5, nom: "Volumen" },              prix_ttc: 8.90,  categorie: "Classique",  quantite: 2,  seuil_alerte: 5,  quantite_commandee: 0,  derniere_vente: "2025-04-17", created_at: "2024-06-15" },
];

export const mouvements_stock = [
  { id: 1,  livre_id: 1, type: "entree",     quantite: 12,  note: "Réception office OFF-2025-0018",      created_at: "2025-01-10T08:00:00", cree_par: "Marie Dupont" },
  { id: 2,  livre_id: 1, type: "sortie",     quantite: 3,   note: "Ventes semaine 03",                   created_at: "2025-01-20T17:00:00", cree_par: "Système" },
  { id: 3,  livre_id: 1, type: "sortie",     quantite: 2,   note: "Ventes semaine 05",                   created_at: "2025-02-03T17:00:00", cree_par: "Système" },
  { id: 4,  livre_id: 3, type: "entree",     quantite: 30,  note: "Commande LCR-2025-0043",              created_at: "2025-02-01T09:00:00", cree_par: "Thomas Martin" },
  { id: 5,  livre_id: 3, type: "sortie",     quantite: 2,   note: "Ventes semaine 06",                   created_at: "2025-02-10T17:00:00", cree_par: "Système" },
  { id: 6,  livre_id: 6, type: "entree",     quantite: 15,  note: "Réception office OFF-2025-0017",      created_at: "2025-01-05T08:00:00", cree_par: "Marie Dupont" },
  { id: 7,  livre_id: 6, type: "sortie",     quantite: 10,  note: "Ventes semaines 02-08",               created_at: "2025-02-28T17:00:00", cree_par: "Système" },
  { id: 8,  livre_id: 6, type: "retour",     quantite: 4,   note: "Retour partiel office OFF-2025-0017", created_at: "2025-03-01T10:00:00", cree_par: "Marie Dupont" },
  { id: 9,  livre_id: 9, type: "entree",     quantite: 8,   note: "Commande LCR-2025-0044",              created_at: "2025-02-15T11:00:00", cree_par: "Thomas Martin" },
  { id: 10, livre_id: 9, type: "sortie",     quantite: 8,   note: "Ventes semaines 07-16",               created_at: "2025-04-19T17:00:00", cree_par: "Système" },
  { id: 11, livre_id: 12, type: "inventaire", quantite: 2,   note: "Inventaire manuel — écart constaté",  created_at: "2025-04-01T10:00:00", cree_par: "Marie Dupont" },
];

/* ══════════════════════════════════════════════════════════════
   DILICOM — flux EDI
   ══════════════════════════════════════════════════════════════ */
export const dilicom_connexion = {
  gln: "3012345678901",
  statut: "connecte", /* connecte | erreur | non_configure */
  derniere_synchro: "2025-04-24T06:00:00",
  version_protocole: "FEL 3.0",
  nb_flux_aujourd_hui: 4,
};

export const dilicom_flux = [
  { id: 1,  type: "commande",           reference: "CMD-2025-0089", distributeur: { nom: "Hachette Livre" },       date: "2025-04-24", statut: "transmis", nb_lignes: 18, montant_ttc: 2840.00 },
  { id: 2,  type: "accusé_reception",   reference: "ACK-2025-0089", distributeur: { nom: "Hachette Livre" },       date: "2025-04-24", statut: "traite",   nb_lignes: 18, montant_ttc: 2840.00 },
  { id: 3,  type: "commande",           reference: "CMD-2025-0088", distributeur: { nom: "Gallimard Distribution" }, date: "2025-04-23", statut: "traite",   nb_lignes: 12, montant_ttc: 1540.00 },
  { id: 4,  type: "facture",            reference: "FAC-2025-0212", distributeur: { nom: "Hachette Livre" },       date: "2025-04-23", statut: "traite",   nb_lignes: 24, montant_ttc: 3420.50 },
  { id: 5,  type: "commande",           reference: "CMD-2025-0087", distributeur: { nom: "CDE / Sodis" },         date: "2025-04-22", statut: "erreur",   nb_lignes: 7,  montant_ttc: 980.00  },
  { id: 6,  type: "avoir",              reference: "AVO-2025-0031", distributeur: { nom: "Gallimard Distribution" }, date: "2025-04-22", statut: "traite",   nb_lignes: 3,  montant_ttc: 210.00  },
  { id: 7,  type: "facture",            reference: "FAC-2025-0211", distributeur: { nom: "CDE / Sodis" },         date: "2025-04-21", statut: "traite",   nb_lignes: 15, montant_ttc: 2100.00 },
  { id: 8,  type: "commande",           reference: "CMD-2025-0086", distributeur: { nom: "Volumen" },             date: "2025-04-20", statut: "traite",   nb_lignes: 9,  montant_ttc: 1260.00 },
  { id: 9,  type: "accusé_reception",   reference: "ACK-2025-0087", distributeur: { nom: "CDE / Sodis" },         date: "2025-04-22", statut: "en_attente", nb_lignes: 7, montant_ttc: 980.00  },
  { id: 10, type: "facture",            reference: "FAC-2025-0210", distributeur: { nom: "Hachette Livre" },       date: "2025-04-19", statut: "traite",   nb_lignes: 21, montant_ttc: 4100.00 },
];

/* ══════════════════════════════════════════════════════════════
   RAPPORTS PÉRIODIQUES
   ══════════════════════════════════════════════════════════════ */
export const rapports = [
  {
    id: 1,
    type: "mensuel",
    periode: "Mars 2025",
    date_debut: "2025-03-01",
    date_fin: "2025-03-31",
    statut: "genere",
    nb_titres_vendus: 182,
    total_ventes_ttc: 31420.00,
    evolution_percent: +12.5,
    top_ventes: [
      { titre: "Le Petit Prince",           auteur: "Saint-Exupéry",    quantite: 28, ca: 229.60 },
      { titre: "L'Étranger",                auteur: "Camus",             quantite: 24, ca: 180.00 },
      { titre: "Sérotonine",                auteur: "Houellebecq",       quantite: 18, ca: 376.20 },
      { titre: "Dune",                      auteur: "Herbert",           quantite: 14, ca: 208.60 },
      { titre: "1984",                      auteur: "Orwell",            quantite: 12, ca: 106.80 },
    ],
    chart_ventes: [
      { semaine: "S09", ventes: 6800 }, { semaine: "S10", ventes: 8200 },
      { semaine: "S11", ventes: 7400 }, { semaine: "S12", ventes: 9020 },
    ],
    created_at: "2025-04-01T06:00:00",
    cree_par: "Système (auto)",
  },
  {
    id: 2,
    type: "mensuel",
    periode: "Février 2025",
    date_debut: "2025-02-01",
    date_fin: "2025-02-28",
    statut: "genere",
    nb_titres_vendus: 162,
    total_ventes_ttc: 27940.00,
    evolution_percent: -4.2,
    top_ventes: [
      { titre: "Le Petit Prince",           auteur: "Saint-Exupéry",    quantite: 22, ca: 180.40 },
      { titre: "L'Étranger",                auteur: "Camus",             quantite: 20, ca: 150.00 },
      { titre: "La Nausée",                 auteur: "Sartre",            quantite: 15, ca: 133.50 },
      { titre: "Les Misérables",            auteur: "Hugo",              quantite: 11, ca: 141.90 },
      { titre: "Madame Bovary",             auteur: "Flaubert",          quantite: 9,  ca: 85.50  },
    ],
    chart_ventes: [
      { semaine: "S05", ventes: 6100 }, { semaine: "S06", ventes: 7800 },
      { semaine: "S07", ventes: 6400 }, { semaine: "S08", ventes: 7640 },
    ],
    created_at: "2025-03-01T06:00:00",
    cree_par: "Système (auto)",
  },
  {
    id: 3,
    type: "hebdomadaire",
    periode: "Semaine 16 — 14 au 20 avr. 2025",
    date_debut: "2025-04-14",
    date_fin: "2025-04-20",
    statut: "genere",
    nb_titres_vendus: 47,
    total_ventes_ttc: 7840.00,
    evolution_percent: +8.1,
    top_ventes: [
      { titre: "Le Petit Prince",           auteur: "Saint-Exupéry",    quantite: 8,  ca: 65.60 },
      { titre: "Sérotonine",                auteur: "Houellebecq",       quantite: 6,  ca: 125.40 },
      { titre: "L'Étranger",                auteur: "Camus",             quantite: 5,  ca: 37.50 },
      { titre: "Dune",                      auteur: "Herbert",           quantite: 4,  ca: 59.60 },
    ],
    chart_ventes: [
      { semaine: "Lun", ventes: 920 }, { semaine: "Mar", ventes: 1140 },
      { semaine: "Mer", ventes: 1680 }, { semaine: "Jeu", ventes: 1200 },
      { semaine: "Ven", ventes: 2140 }, { semaine: "Sam", ventes: 760 },
    ],
    created_at: "2025-04-21T06:00:00",
    cree_par: "Système (auto)",
  },
  {
    id: 4,
    type: "mensuel",
    periode: "Janvier 2025",
    date_debut: "2025-01-01",
    date_fin: "2025-01-31",
    statut: "genere",
    nb_titres_vendus: 198,
    total_ventes_ttc: 34810.00,
    evolution_percent: +21.0,
    top_ventes: [
      { titre: "Le Petit Prince",           auteur: "Saint-Exupéry",    quantite: 35, ca: 287.00 },
      { titre: "L'Étranger",                auteur: "Camus",             quantite: 28, ca: 210.00 },
      { titre: "Sérotonine",                auteur: "Houellebecq",       quantite: 22, ca: 459.80 },
    ],
    chart_ventes: [
      { semaine: "S01", ventes: 9200 }, { semaine: "S02", ventes: 8600 },
      { semaine: "S03", ventes: 8400 }, { semaine: "S04", ventes: 8610 },
    ],
    created_at: "2025-02-01T06:00:00",
    cree_par: "Système (auto)",
  },
];

/* ══════════════════════════════════════════════════════════════
   FICHES MISSIONS — recommandations cross-clients
   ══════════════════════════════════════════════════════════════ */
export const fiches_missions = [
  {
    id: 1,
    titre: "\"La Salle de bain\" cartonne dans le réseau — absent ici",
    isbn: "9782707310262",
    auteur: "Jean-Philippe Toussaint",
    editeur: "Minuit",
    prix_ttc: 12.00,
    categorie: "Roman",
    tendance: "hausse",
    score: 94,
    nb_librairies_reseau: 45,
    nb_librairies_vendant: 41,
    ventes_moy_reseau_mois: 18,
    ventes_librairie_mois: 0,
    ecart_percent: null,
    priorite: "haute",
    statut: "non_traite",
    reponse: null,
    contexte: "Ce titre est présent dans 91 % des librairies du réseau. Il performe particulièrement bien dans les villes universitaires et les librairies généralistes de taille similaire à la vôtre.",
    created_at: "2025-04-22T08:00:00",
  },
  {
    id: 2,
    titre: "\"Orbital\" de Harvey — forte demande SF non couverte",
    isbn: "9782072993572",
    auteur: "Samantha Harvey",
    editeur: "Gallimard",
    prix_ttc: 20.00,
    categorie: "SF",
    tendance: "hausse",
    score: 88,
    nb_librairies_reseau: 45,
    nb_librairies_vendant: 38,
    ventes_moy_reseau_mois: 14,
    ventes_librairie_mois: 2,
    ecart_percent: -86,
    priorite: "haute",
    statut: "en_cours",
    reponse: "En discussion avec Gallimard Distribution pour une commande groupée.",
    contexte: "Gagnant du Booker Prize 2024. Les librairies avec un rayon SF actif ont une moyenne de 14 ventes/mois. Votre stock actuel (2 unités) est insuffisant.",
    created_at: "2025-04-20T08:00:00",
  },
  {
    id: 3,
    titre: "Sur-stock \"Madame Bovary\" — réduire les commandes",
    isbn: "9782070360840",
    auteur: "Gustave Flaubert",
    editeur: "Gallimard",
    prix_ttc: 9.50,
    categorie: "Classique",
    tendance: "baisse",
    score: 72,
    nb_librairies_reseau: 45,
    nb_librairies_vendant: 28,
    ventes_moy_reseau_mois: 3,
    ventes_librairie_mois: 6,
    ecart_percent: +100,
    priorite: "normale",
    statut: "rejete",
    reponse: "Nous sommes proches d'un lycée, la demande scolaire justifie notre stock élevé.",
    contexte: "Votre stock dépasse de 100 % la moyenne réseau pour ce titre. Une réduction des prochaines commandes permettrait de libérer de la trésorerie.",
    created_at: "2025-04-18T08:00:00",
  },
  {
    id: 4,
    titre: "\"Percival Everett\" — auteur en forte progression",
    isbn: "9782742799508",
    auteur: "Percival Everett",
    editeur: "Actes Sud",
    prix_ttc: 22.50,
    categorie: "Roman",
    tendance: "hausse",
    score: 82,
    nb_librairies_reseau: 45,
    nb_librairies_vendant: 34,
    ventes_moy_reseau_mois: 9,
    ventes_librairie_mois: 1,
    ecart_percent: -89,
    priorite: "normale",
    statut: "non_traite",
    reponse: null,
    contexte: "Suite au Prix Pulitzer 2024, les ventes de cet auteur ont progressé de +340 % dans le réseau. Les librairies similaires à la vôtre vendent en moyenne 9 unités/mois.",
    created_at: "2025-04-20T08:00:00",
  },
  {
    id: 5,
    titre: "\"Harry Potter\" tomes 4-7 — rupture récurrente",
    isbn: "9782070584628",
    auteur: "J.K. Rowling",
    editeur: "Gallimard",
    prix_ttc: 14.90,
    categorie: "Jeunesse",
    tendance: "stable",
    score: 76,
    nb_librairies_reseau: 45,
    nb_librairies_vendant: 43,
    ventes_moy_reseau_mois: 11,
    ventes_librairie_mois: 8,
    ecart_percent: -27,
    priorite: "normale",
    statut: "commande",
    reponse: "Commande passée le 22/04.",
    contexte: "Les données de stock montrent des ruptures régulières (3 fois en 3 mois). Une commande de sécurité plus importante est recommandée pour éviter les pertes de ventes.",
    created_at: "2025-04-15T08:00:00",
  },
];

/* ══════════════════════════════════════════════════════════════
   ASSISTANT IA — historique conversation initiale
   ══════════════════════════════════════════════════════════════ */
export const messages_ia_initiaux = [
  {
    id: 1,
    role: "assistant",
    contenu: "Bonjour ! Je suis votre assistant Incunable. Je peux vous aider à analyser vos ventes, gérer votre stock, répondre à vos questions sur vos LCR et offices, ou vous conseiller sur votre catalogue.\n\nQue puis-je faire pour vous aujourd'hui ?",
    created_at: "2025-04-24T09:00:00",
  },
];
