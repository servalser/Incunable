/**
 * Configuration — paramètres globaux de l'application (réservé à l'administrateur).
 *
 * Props reçues depuis le contrôleur Laravel (via Inertia) :
 *   - config : objet complet de configuration
 *       { nom_librairie, siret, email, telephone, adresse,
 *         delai_commandes_mois, delai_offices_mois,
 *         alerte_7j, alerte_1j, alerte_retard, alerte_retour_expiration, alerte_recap_hebdo,
 *         smtp_host, smtp_port, smtp_username, smtp_password,
 *         smtp_from_email, smtp_from_name, smtp_tls,
 *         theme_hue, theme_sat, theme_dark }
 *
 * Structure : 5 onglets natifs
 *   1. Librairie     — infos générales + délais
 *   2. Alertes       — toggles e-mail
 *   3. SMTP          — paramètres serveur mail
 *   4. Intégrations  — LibriWeb (Librisoft), Google Books
 *   5. Apparence     — thème dynamique (hue/sat/dark)
 */

import { useEffect, useState } from 'react';
import { Head, useForm }       from '@inertiajs/react';
import { AppLayout }           from '../Components/Layout/AppLayout';

/* ──────────────────────────────────────────────────────────────────────────────
 * Toggle — interrupteur on/off accessible
 * ────────────────────────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange, id }) {
    return (
        <label className="toggle-switch" htmlFor={id}>
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className="toggle-slider" />
        </label>
    );
}

/* ──────────────────────────────────────────────────────────────────────────────
 * ToggleRow — ligne avec label + description + toggle à droite
 * ────────────────────────────────────────────────────────────────────────────── */
function ToggleRow({ id, label, sub, checked, onChange }) {
    return (
        <div className="toggle-row">
            <div className="toggle-label">
                <label htmlFor={id} style={{ fontWeight: 500, fontSize: 13.5, color: 'var(--ink)' }}>
                    {label}
                </label>
                {sub && (
                    <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{sub}</p>
                )}
            </div>
            <Toggle id={id} checked={checked} onChange={onChange} />
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Séparateur léger
 * ────────────────────────────────────────────────────────────────────────────── */
function Sep() {
    return <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid var(--hairline)' }} />;
}

/* ──────────────────────────────────────────────────────────────────────────────
 * FErr — message d'erreur de formulaire
 * ────────────────────────────────────────────────────────────────────────────── */
function FErr({ msg }) {
    if (!msg) return null;
    return <p style={{ fontSize: 12, color: 'var(--status-overdue)', marginTop: 4 }}>{msg}</p>;
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Page principale
 * ────────────────────────────────────────────────────────────────────────────── */
export default function Configuration({ config }) {
    /* Onglet actif — géré localement */
    const [tab, setTab] = useState('librairie');

    /**
     * useForm initialise tous les champs avec les valeurs de la base.
     * L'opérateur ?? fournit une valeur par défaut si la valeur est null/undefined.
     */
    const { data, setData, put, processing, errors } = useForm({
        /* Onglet 1 — Librairie */
        nom_librairie:        config.nom_librairie        ?? '',
        siret:                config.siret                ?? '',
        email:                config.email                ?? '',
        telephone:            config.telephone            ?? '',
        adresse:              config.adresse              ?? '',
        delai_commandes_mois: config.delai_commandes_mois ?? 3,
        delai_offices_mois:   config.delai_offices_mois   ?? 2,

        /* Onglet 2 — Alertes */
        alerte_7j:                config.alerte_7j                ?? false,
        alerte_1j:                config.alerte_1j                ?? false,
        alerte_retard:            config.alerte_retard            ?? true,
        alerte_retour_expiration: config.alerte_retour_expiration  ?? true,
        alerte_recap_hebdo:       config.alerte_recap_hebdo        ?? false,

        /* Onglet 3 — SMTP */
        smtp_host:       config.smtp_host       ?? '',
        smtp_port:       config.smtp_port       ?? 587,
        smtp_username:   config.smtp_username   ?? '',
        smtp_password:   config.smtp_password   ?? '',
        smtp_from_email: config.smtp_from_email ?? '',
        smtp_from_name:  config.smtp_from_name  ?? '',
        smtp_tls:        config.smtp_tls        ?? true,

        /* Onglet 4 — Intégrations */
        libriweb_actif:     config.libriweb_actif     ?? false,
        libriweb_url:       config.libriweb_url        ?? '',
        libriweb_client_id: config.libriweb_client_id ?? '',
        libriweb_api_key:   config.libriweb_api_key    ?? '',

        /* Onglet 5 — Apparence */
        theme_hue:  config.theme_hue  ?? 220,
        theme_sat:  config.theme_sat  ?? 60,
        theme_dark: config.theme_dark ?? false,
    });

    /* Soumission → PUT /configuration */
    const submit = (e) => {
        e.preventDefault();
        put('/configuration');
    };

    /**
     * Mise à jour des variables CSS en temps réel.
     * À chaque changement de hue/sat/dark dans le formulaire,
     * l'interface se met à jour sans attendre la sauvegarde.
     */
    useEffect(() => {
        document.documentElement.style.setProperty('--hue', data.theme_hue);
        document.documentElement.style.setProperty('--sat', `${data.theme_sat}%`);
        document.body.classList.toggle('dark', data.theme_dark);
    }, [data.theme_hue, data.theme_sat, data.theme_dark]);

    /* Définition des onglets */
    const TABS = [
        { key: 'librairie',    label: 'Librairie'    },
        { key: 'alertes',      label: 'Alertes'       },
        { key: 'smtp',         label: 'SMTP'          },
        { key: 'integrations', label: 'Intégrations'  },
        { key: 'apparence',    label: 'Apparence'     },
    ];

    /* Bouton de sauvegarde commun */
    const SaveBtn = () => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
            <button type="submit" className="btn primary" disabled={processing}>
                {processing ? 'Enregistrement…' : 'Enregistrer'}
            </button>
        </div>
    );

    return (
        <AppLayout title="Configuration">
            <Head title="Configuration" />

            {/* ── En-tête de page ── */}
            <div className="page-head">
                <div>
                    <h1 className="page-title">Configuration</h1>
                    <p className="page-sub">Paramètres généraux de votre librairie.</p>
                </div>
            </div>

            <form onSubmit={submit}>

                {/* ── Onglets natifs ── */}
                <div className="tabs" style={{ marginBottom: 20 }}>
                    {TABS.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            className={`tab${tab === key ? ' active' : ''}`}
                            onClick={() => setTab(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════════
                    ONGLET 1 — Librairie
                ══════════════════════════════════════════════════ */}
                {tab === 'librairie' && (
                    <div className="card">
                        <div className="card-head">
                            <h2 className="section-title" style={{ margin: 0 }}>
                                Informations de la librairie
                            </h2>
                        </div>
                        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Nom + SIRET */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label htmlFor="nom_librairie" className="label">
                                        Nom de la librairie{' '}
                                        <span style={{ color: 'var(--status-overdue)' }}>*</span>
                                    </label>
                                    <input
                                        id="nom_librairie"
                                        className="input"
                                        value={data.nom_librairie}
                                        onChange={(e) => setData('nom_librairie', e.target.value)}
                                        style={errors.nom_librairie ? { borderColor: 'var(--status-overdue)' } : {}}
                                        required
                                    />
                                    <FErr msg={errors.nom_librairie} />
                                </div>
                                <div>
                                    <label htmlFor="siret" className="label">SIRET</label>
                                    <input
                                        id="siret"
                                        className="input mono"
                                        value={data.siret}
                                        onChange={(e) => setData('siret', e.target.value)}
                                        placeholder="123 456 789 00012"
                                        style={errors.siret ? { borderColor: 'var(--status-overdue)' } : {}}
                                    />
                                    <FErr msg={errors.siret} />
                                </div>
                            </div>

                            {/* Email + Téléphone */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label htmlFor="cfg_email" className="label">Email</label>
                                    <input
                                        id="cfg_email"
                                        type="email"
                                        className="input"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        style={errors.email ? { borderColor: 'var(--status-overdue)' } : {}}
                                    />
                                    <FErr msg={errors.email} />
                                </div>
                                <div>
                                    <label htmlFor="cfg_telephone" className="label">Téléphone</label>
                                    <input
                                        id="cfg_telephone"
                                        type="tel"
                                        className="input"
                                        value={data.telephone}
                                        onChange={(e) => setData('telephone', e.target.value)}
                                        style={errors.telephone ? { borderColor: 'var(--status-overdue)' } : {}}
                                    />
                                    <FErr msg={errors.telephone} />
                                </div>
                            </div>

                            {/* Adresse */}
                            <div>
                                <label htmlFor="adresse" className="label">Adresse</label>
                                <textarea
                                    id="adresse"
                                    className="textarea"
                                    rows={3}
                                    value={data.adresse}
                                    onChange={(e) => setData('adresse', e.target.value)}
                                    placeholder="Numéro, rue, code postal, ville…"
                                    style={errors.adresse ? { borderColor: 'var(--status-overdue)' } : {}}
                                />
                                <FErr msg={errors.adresse} />
                            </div>

                            <Sep />

                            {/* Délais par défaut */}
                            <div>
                                <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                                    Délais par défaut
                                </p>
                                <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
                                    Appliqués si aucun délai n'est défini sur le fournisseur.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label htmlFor="delai_commandes" className="label">
                                            Délai LCR (mois)
                                        </label>
                                        <input
                                            id="delai_commandes"
                                            type="number"
                                            min="1"
                                            max="24"
                                            className="input mono"
                                            value={data.delai_commandes_mois}
                                            onChange={(e) =>
                                                setData('delai_commandes_mois', parseInt(e.target.value, 10))
                                            }
                                            style={errors.delai_commandes_mois ? { borderColor: 'var(--status-overdue)' } : {}}
                                        />
                                        <FErr msg={errors.delai_commandes_mois} />
                                    </div>
                                    <div>
                                        <label htmlFor="delai_offices" className="label">
                                            Délai offices (mois)
                                        </label>
                                        <input
                                            id="delai_offices"
                                            type="number"
                                            min="1"
                                            max="24"
                                            className="input mono"
                                            value={data.delai_offices_mois}
                                            onChange={(e) =>
                                                setData('delai_offices_mois', parseInt(e.target.value, 10))
                                            }
                                            style={errors.delai_offices_mois ? { borderColor: 'var(--status-overdue)' } : {}}
                                        />
                                        <FErr msg={errors.delai_offices_mois} />
                                    </div>
                                </div>
                            </div>

                            <SaveBtn />
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════
                    ONGLET 2 — Alertes e-mail
                ══════════════════════════════════════════════════ */}
                {tab === 'alertes' && (
                    <div className="card">
                        <div className="card-head">
                            <h2 className="section-title" style={{ margin: 0 }}>Alertes e-mail</h2>
                        </div>
                        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>

                            <ToggleRow
                                id="alerte_7j"
                                label="7 jours avant échéance"
                                sub="Rappel envoyé une semaine avant la date d'échéance d'une LCR."
                                checked={data.alerte_7j}
                                onChange={(v) => setData('alerte_7j', v)}
                            />
                            <Sep />
                            <ToggleRow
                                id="alerte_1j"
                                label="1 jour avant échéance"
                                sub="Rappel la veille de la date d'échéance."
                                checked={data.alerte_1j}
                                onChange={(v) => setData('alerte_1j', v)}
                            />
                            <Sep />
                            <ToggleRow
                                id="alerte_retard"
                                label="Dès qu'une LCR est en retard"
                                sub="Alerte immédiate lorsque la date d'échéance est dépassée."
                                checked={data.alerte_retard}
                                onChange={(v) => setData('alerte_retard', v)}
                            />
                            <Sep />
                            <ToggleRow
                                id="alerte_retour_expiration"
                                label="Retour office proche"
                                sub="Notification lorsque la date limite de retour d'un office approche."
                                checked={data.alerte_retour_expiration}
                                onChange={(v) => setData('alerte_retour_expiration', v)}
                            />
                            <Sep />
                            <ToggleRow
                                id="alerte_recap_hebdo"
                                label="Récapitulatif hebdomadaire"
                                sub="Résumé envoyé chaque semaine : LCR en attente, offices, retards."
                                checked={data.alerte_recap_hebdo}
                                onChange={(v) => setData('alerte_recap_hebdo', v)}
                            />

                            <div style={{ paddingTop: 12 }}>
                                <SaveBtn />
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════
                    ONGLET 3 — Serveur SMTP
                ══════════════════════════════════════════════════ */}
                {tab === 'smtp' && (
                    <div className="card">
                        <div className="card-head">
                            <h2 className="section-title" style={{ margin: 0 }}>Serveur d'envoi SMTP</h2>
                        </div>
                        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Hôte + Port */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label htmlFor="smtp_host" className="label">Serveur SMTP</label>
                                    <input
                                        id="smtp_host"
                                        className="input"
                                        value={data.smtp_host}
                                        onChange={(e) => setData('smtp_host', e.target.value)}
                                        placeholder="smtp.example.com"
                                        style={errors.smtp_host ? { borderColor: 'var(--status-overdue)' } : {}}
                                    />
                                    <FErr msg={errors.smtp_host} />
                                </div>
                                <div>
                                    <label htmlFor="smtp_port" className="label">Port</label>
                                    <input
                                        id="smtp_port"
                                        type="number"
                                        className="input mono"
                                        value={data.smtp_port}
                                        onChange={(e) => setData('smtp_port', parseInt(e.target.value, 10))}
                                        placeholder="587"
                                        style={errors.smtp_port ? { borderColor: 'var(--status-overdue)' } : {}}
                                    />
                                    <FErr msg={errors.smtp_port} />
                                </div>
                            </div>

                            {/* Identifiant + Mot de passe */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label htmlFor="smtp_username" className="label">Identifiant</label>
                                    <input
                                        id="smtp_username"
                                        className="input"
                                        autoComplete="off"
                                        value={data.smtp_username}
                                        onChange={(e) => setData('smtp_username', e.target.value)}
                                        style={errors.smtp_username ? { borderColor: 'var(--status-overdue)' } : {}}
                                    />
                                    <FErr msg={errors.smtp_username} />
                                </div>
                                <div>
                                    <label htmlFor="smtp_password" className="label">Mot de passe</label>
                                    <input
                                        id="smtp_password"
                                        type="password"
                                        className="input"
                                        autoComplete="new-password"
                                        value={data.smtp_password}
                                        onChange={(e) => setData('smtp_password', e.target.value)}
                                        style={errors.smtp_password ? { borderColor: 'var(--status-overdue)' } : {}}
                                    />
                                    <FErr msg={errors.smtp_password} />
                                </div>
                            </div>

                            {/* Email + Nom expéditeur */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label htmlFor="smtp_from_email" className="label">Email expéditeur</label>
                                    <input
                                        id="smtp_from_email"
                                        type="email"
                                        className="input"
                                        value={data.smtp_from_email}
                                        onChange={(e) => setData('smtp_from_email', e.target.value)}
                                        placeholder="noreply@librairie.fr"
                                        style={errors.smtp_from_email ? { borderColor: 'var(--status-overdue)' } : {}}
                                    />
                                    <FErr msg={errors.smtp_from_email} />
                                </div>
                                <div>
                                    <label htmlFor="smtp_from_name" className="label">Nom expéditeur</label>
                                    <input
                                        id="smtp_from_name"
                                        className="input"
                                        value={data.smtp_from_name}
                                        onChange={(e) => setData('smtp_from_name', e.target.value)}
                                        placeholder="Ma Librairie"
                                        style={errors.smtp_from_name ? { borderColor: 'var(--status-overdue)' } : {}}
                                    />
                                    <FErr msg={errors.smtp_from_name} />
                                </div>
                            </div>

                            <Sep />

                            <ToggleRow
                                id="smtp_tls"
                                label="Chiffrement TLS activé"
                                sub="Recommandé pour sécuriser les échanges avec le serveur mail."
                                checked={data.smtp_tls}
                                onChange={(v) => setData('smtp_tls', v)}
                            />

                            <div style={{ paddingTop: 8 }}>
                                <SaveBtn />
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════
                    ONGLET 4 — Intégrations tierces
                ══════════════════════════════════════════════════ */}
                {tab === 'integrations' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* ── Google Books ──────────────────────────── */}
                        <div className="card">
                            <div className="card-head">
                                <h2 className="section-title" style={{ margin: 0 }}>
                                    Google Books
                                </h2>
                            </div>
                            <div style={{ padding: 20 }}>
                                <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>
                                    <strong style={{ color: 'var(--ink)' }}>Actif par défaut — aucune configuration requise.</strong><br />
                                    La page <a href="/dilicom" style={{ color: 'var(--accent)' }}>Catalogue / Dilicom</a> utilise
                                    Google Books API pour rechercher des livres par ISBN, titre ou auteur
                                    et les importer directement dans votre stock.
                                    Cette API est gratuite jusqu'à 1 000 requêtes par jour.
                                </p>
                                <div style={{
                                    marginTop: 12, background: 'var(--surface)',
                                    borderRadius: 6, padding: '10px 14px',
                                    fontSize: 12.5, color: 'var(--muted)',
                                    border: '1px solid var(--hairline)',
                                }}>
                                    Pour augmenter cette limite, créez une clé API dans Google Cloud Console
                                    et ajoutez <code style={{ fontFamily: 'monospace' }}>GOOGLE_BOOKS_API_KEY=...</code> dans
                                    votre fichier <code style={{ fontFamily: 'monospace' }}>.env</code>.
                                </div>
                            </div>
                        </div>

                        {/* ── LibriWeb / Librisoft ──────────────────── */}
                        <div className="card">
                            <div className="card-head">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <h2 className="section-title" style={{ margin: 0 }}>
                                        LibriWeb / Librisoft
                                    </h2>
                                    <Toggle
                                        id="libriweb_actif"
                                        checked={data.libriweb_actif}
                                        onChange={v => setData('libriweb_actif', v)}
                                    />
                                </div>
                            </div>
                            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>
                                    Activez cette intégration si votre librairie utilise <strong>Librisoft</strong> comme
                                    logiciel de caisse. Une fois activée, Incunable peut synchroniser
                                    automatiquement votre catalogue, vos niveaux de stock et vos ventes.
                                </p>

                                {/* Instructions */}
                                <div style={{
                                    background: '#eff6ff', border: '1px solid #bfdbfe',
                                    borderRadius: 6, padding: '12px 16px',
                                    fontSize: 12.5, color: '#1e40af', lineHeight: 1.7,
                                }}>
                                    <strong>Comment configurer :</strong>
                                    <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                                        <li>Contactez Librisoft pour obtenir vos identifiants API LibriWeb.</li>
                                        <li>Renseignez l'URL, le Client ID et la Clé API ci-dessous.</li>
                                        <li>Configurez le secret Webhook dans votre fichier <code>.env</code> (<code>WEBHOOK_SECRET_LIBRISOFT</code>).</li>
                                        <li>Communiquez l'URL de webhook à ETL4hub : <code style={{ wordBreak: 'break-all' }}>
                                            {window.location.origin}/webhooks/librisoft
                                        </code></li>
                                    </ol>
                                </div>

                                {/* Champs de configuration — affichés même si désactivé */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label htmlFor="libriweb_url" className="label">
                                            URL de l'API LibriWeb
                                        </label>
                                        <input
                                            id="libriweb_url"
                                            type="url"
                                            className="input"
                                            value={data.libriweb_url}
                                            onChange={e => setData('libriweb_url', e.target.value)}
                                            placeholder="https://api.libriweb.fr/v1"
                                            style={errors.libriweb_url ? { borderColor: 'var(--status-overdue)' } : {}}
                                        />
                                        <FErr msg={errors.libriweb_url} />
                                        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                                            Fournie par Librisoft lors de l'activation de votre accès API.
                                        </p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <label htmlFor="libriweb_client_id" className="label">Client ID</label>
                                            <input
                                                id="libriweb_client_id"
                                                className="input mono"
                                                value={data.libriweb_client_id}
                                                onChange={e => setData('libriweb_client_id', e.target.value)}
                                                placeholder="LIB-XXXX"
                                                autoComplete="off"
                                                style={errors.libriweb_client_id ? { borderColor: 'var(--status-overdue)' } : {}}
                                            />
                                            <FErr msg={errors.libriweb_client_id} />
                                        </div>
                                        <div>
                                            <label htmlFor="libriweb_api_key" className="label">Clé API</label>
                                            <input
                                                id="libriweb_api_key"
                                                type="password"
                                                className="input mono"
                                                value={data.libriweb_api_key}
                                                onChange={e => setData('libriweb_api_key', e.target.value)}
                                                placeholder="••••••••••••••••"
                                                autoComplete="new-password"
                                                style={errors.libriweb_api_key ? { borderColor: 'var(--status-overdue)' } : {}}
                                            />
                                            <FErr msg={errors.libriweb_api_key} />
                                        </div>
                                    </div>
                                </div>

                                <SaveBtn />
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════
                    ONGLET 5 — Apparence (thème dynamique)
                ══════════════════════════════════════════════════ */}
                {tab === 'apparence' && (
                    <div className="card">
                        <div className="card-head">
                            <h2 className="section-title" style={{ margin: 0 }}>Apparence</h2>
                        </div>
                        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Aperçu couleur d'accentuation — mis à jour en direct */}
                            <div className="theme-accent-preview" aria-hidden="true" />

                            {/* Slider teinte */}
                            <div>
                                <label htmlFor="theme_hue" className="label">
                                    Teinte{' '}
                                    <span className="mono" style={{ color: 'var(--muted)', fontSize: 12 }}>
                                        {data.theme_hue}°
                                    </span>
                                </label>
                                <input
                                    id="theme_hue"
                                    type="range"
                                    min="0"
                                    max="360"
                                    className="hue-slider"
                                    style={{ width: '100%', marginTop: 6 }}
                                    value={data.theme_hue}
                                    onChange={(e) => setData('theme_hue', parseInt(e.target.value, 10))}
                                />
                                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                                    0 = rouge · 120 = vert · 220 = bleu · 280 = violet
                                </p>
                            </div>

                            {/* Slider saturation */}
                            <div>
                                <label htmlFor="theme_sat" className="label">
                                    Saturation{' '}
                                    <span className="mono" style={{ color: 'var(--muted)', fontSize: 12 }}>
                                        {data.theme_sat}%
                                    </span>
                                </label>
                                <input
                                    id="theme_sat"
                                    type="range"
                                    min="0"
                                    max="100"
                                    className="sat-slider"
                                    style={{ width: '100%', marginTop: 6 }}
                                    value={data.theme_sat}
                                    onChange={(e) => setData('theme_sat', parseInt(e.target.value, 10))}
                                />
                                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                                    0 % = tons neutres/grisés · 100 % = couleurs très vives.
                                </p>
                            </div>

                            <Sep />

                            <ToggleRow
                                id="theme_dark"
                                label="Mode sombre"
                                sub="Applique un fond sombre à toute l'interface."
                                checked={data.theme_dark}
                                onChange={(v) => setData('theme_dark', v)}
                            />

                            <SaveBtn />
                        </div>
                    </div>
                )}

            </form>
        </AppLayout>
    );
}
