/**
 * Budget/Index — visualisation et gestion des budgets mensuels.
 *
 * Props reçues depuis le contrôleur Laravel (via Inertia) :
 *   - budgets_par_mois   : { "1": [...lignes], "2": [...lignes], ... }
 *   - annee_selectionnee : number
 *   - annees_disponibles : number[]
 *   - totaux_par_mois    : { "1": { prevu, reel, ecart }, ... }
 *   - peut_modifier      : boolean
 */

import { Head, router }  from '@inertiajs/react';
import { useState }      from 'react';

import { AppLayout }     from '../../Components/Layout/AppLayout';
import { Modal, ModalBody, ModalFooter } from '../../Components/UI/Modal';
import { ConfirmDialog } from '../../Components/UI/ConfirmDialog';
import { PlusCircle, TrendingUp, TrendingDown } from 'lucide-react';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const euro = (n) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const MOIS_NOMS = [
    '',
    'Janvier', 'Février', 'Mars',      'Avril',   'Mai',      'Juin',
    'Juillet', 'Août',    'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const getCsrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.content ?? '';

const FORM_VIDE = { mois: '', categorie: '', prevu: '', reel: '', notes: '' };

/* ── Icônes SVG ───────────────────────────────────────────────────────────── */
const IcoEdit = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="14" height="14" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const IcoTrash = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="14" height="14" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
    </svg>
);

/* ── Composant principal ──────────────────────────────────────────────────── */

export default function BudgetIndex({
    budgets_par_mois,
    annee_selectionnee,
    annees_disponibles,
    totaux_par_mois,
    peut_modifier,
}) {
    const [modalOuverte, setModalOuverte] = useState(false);
    const [ligneEnCours, setLigneEnCours] = useState(null);
    const [formData, setFormData]         = useState(FORM_VIDE);
    const [formErrors, setFormErrors]     = useState({});
    const [formLoading, setFormLoading]   = useState(false);
    const [confirmSuppr, setConfirmSuppr] = useState(null);

    const setField = (field, value) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const ouvrirAjout = () => {
        setLigneEnCours(null);
        setFormData(FORM_VIDE);
        setFormErrors({});
        setModalOuverte(true);
    };

    const ouvrirEdition = (ligne) => {
        setLigneEnCours(ligne);
        setFormData({
            mois:      String(ligne.mois),
            categorie: ligne.categorie ?? '',
            prevu:     ligne.prevu     ?? '',
            reel:      ligne.reel      ?? '',
            notes:     ligne.notes     ?? '',
        });
        setFormErrors({});
        setModalOuverte(true);
    };

    const fermerModal = () => {
        setModalOuverte(false);
        setLigneEnCours(null);
        setFormErrors({});
    };

    const soumettre = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormErrors({});

        const url    = ligneEnCours ? `/budget/${ligneEnCours.id}` : '/budget';
        const method = ligneEnCours ? 'PUT' : 'POST';

        try {
            const res  = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept':       'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ ...formData, annee: annee_selectionnee }),
            });
            const json = await res.json();

            if (res.ok) {
                fermerModal();
                router.reload();
            } else if (res.status === 422) {
                setFormErrors(json.errors ?? {});
            } else {
                setFormErrors({ _global: json.message ?? 'Une erreur est survenue.' });
            }
        } catch {
            setFormErrors({ _global: 'Impossible de contacter le serveur.' });
        } finally {
            setFormLoading(false);
        }
    };

    const supprimerLigne = async () => {
        if (!confirmSuppr) return;
        try {
            await fetch(`/budget/${confirmSuppr.id}`, {
                method:  'DELETE',
                headers: { 'X-CSRF-TOKEN': getCsrf() },
            });
            router.reload();
        } finally {
            setConfirmSuppr(null);
        }
    };

    const totalAnnuel = Object.values(totaux_par_mois).reduce(
        (acc, t) => ({
            prevu: acc.prevu + (t.prevu ?? 0),
            reel:  acc.reel  + (t.reel  ?? 0),
            ecart: acc.ecart + (t.ecart ?? 0),
        }),
        { prevu: 0, reel: 0, ecart: 0 },
    );

    const colCount = peut_modifier ? 7 : 6;

    return (
        <AppLayout title="Budget">
            <Head title="Budget" />

            {/* ── En-tête ── */}
            <div className="page-head">
                <div>
                    <h1 className="page-title">Budget</h1>
                    <p className="page-sub">Prévisions et dépenses mensuelles</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <select
                        aria-label="Sélectionner une année"
                        className="select"
                        style={{ width: 'auto' }}
                        value={annee_selectionnee}
                        onChange={(e) =>
                            router.get('/budget', { annee: e.target.value }, { preserveState: false })
                        }
                    >
                        {annees_disponibles.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>

                    {peut_modifier && (
                        <button className="btn primary" onClick={ouvrirAjout}>
                            <PlusCircle size={15} aria-hidden="true" />
                            Ajouter une ligne
                        </button>
                    )}
                </div>
            </div>

            {/* ── Tableau principal ── */}
            <div className="card">
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: 140 }}>Mois</th>
                                <th>Catégorie</th>
                                <th className="right">Prévu</th>
                                <th className="right">Réel</th>
                                <th className="right">Écart</th>
                                <th className="right">Écart %</th>
                                {peut_modifier && <th style={{ width: 80 }} />}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((mois) => {
                                const lignes = budgets_par_mois[String(mois)] ?? [];
                                const totaux = totaux_par_mois[String(mois)];
                                if (!lignes.length && !totaux) return null;

                                const ecartTotal = totaux?.ecart ?? 0;
                                const prevuTotal = totaux?.prevu ?? 0;
                                const ecartPct   = prevuTotal !== 0
                                    ? ((ecartTotal / prevuTotal) * 100).toFixed(1)
                                    : null;

                                return (
                                    <BlocMois
                                        key={mois}
                                        mois={mois}
                                        nomMois={MOIS_NOMS[mois]}
                                        lignes={lignes}
                                        totaux={totaux}
                                        ecartPct={ecartPct}
                                        peutModifier={peut_modifier}
                                        onEditer={ouvrirEdition}
                                        onSupprimer={setConfirmSuppr}
                                    />
                                );
                            })}

                            {/* État vide */}
                            {Object.keys(budgets_par_mois).length === 0 && (
                                <tr>
                                    <td colSpan={colCount} className="empty-state">
                                        Aucune ligne budgétaire pour {annee_selectionnee}.
                                        {peut_modifier && (
                                            <> <button
                                                type="button"
                                                onClick={ouvrirAjout}
                                                style={{ color: 'var(--accent)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
                                            >
                                                Ajouter la première ligne
                                            </button></>
                                        )}
                                    </td>
                                </tr>
                            )}

                            {/* Total annuel */}
                            {Object.keys(budgets_par_mois).length > 0 && (
                                <tr style={{ borderTop: '2px solid var(--hairline)', background: 'var(--surface-2)', fontWeight: 600 }}>
                                    <td colSpan={2} style={{ color: 'var(--ink)' }}>
                                        Total {annee_selectionnee}
                                    </td>
                                    <td className="right num">{euro(totalAnnuel.prevu)}</td>
                                    <td className="right num">{euro(totalAnnuel.reel)}</td>
                                    <CelluleEcart ecart={totalAnnuel.ecart} />
                                    <td className="right num" style={{ color: 'var(--muted)' }}>
                                        {totalAnnuel.prevu !== 0
                                            ? `${((totalAnnuel.ecart / totalAnnuel.prevu) * 100).toFixed(1)} %`
                                            : '—'}
                                    </td>
                                    {peut_modifier && <td />}
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal ajout / édition ── */}
            <Modal
                open={modalOuverte}
                onClose={fermerModal}
                title={ligneEnCours ? 'Modifier la ligne' : 'Ajouter une ligne budgétaire'}
            >
                <form onSubmit={soumettre} noValidate>
                    <ModalBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Erreur globale */}
                            {formErrors._global && (
                                <p style={{
                                    color: 'var(--status-overdue)',
                                    background: 'var(--status-overdue-bg)',
                                    borderRadius: 6, padding: '8px 12px', fontSize: 13,
                                }}>
                                    {formErrors._global}
                                </p>
                            )}

                            {/* Mois */}
                            <div>
                                <label htmlFor="modal_mois" className="label">
                                    Mois <span style={{ color: 'var(--status-overdue)' }}>*</span>
                                </label>
                                <select
                                    id="modal_mois"
                                    className="select"
                                    value={formData.mois}
                                    onChange={(e) => setField('mois', e.target.value)}
                                    style={formErrors.mois ? { borderColor: 'var(--status-overdue)' } : {}}
                                    required
                                >
                                    <option value="">— Sélectionner un mois —</option>
                                    {MOIS_NOMS.slice(1).map((nom, idx) => (
                                        <option key={idx + 1} value={idx + 1}>{nom}</option>
                                    ))}
                                </select>
                                {formErrors.mois && (
                                    <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                        {formErrors.mois}
                                    </p>
                                )}
                            </div>

                            {/* Catégorie */}
                            <div>
                                <label htmlFor="modal_categorie" className="label">
                                    Catégorie <span style={{ color: 'var(--status-overdue)' }}>*</span>
                                </label>
                                <input
                                    id="modal_categorie"
                                    type="text"
                                    className="input"
                                    placeholder="Ex : Achats livres, Loyer, Marketing…"
                                    value={formData.categorie}
                                    onChange={(e) => setField('categorie', e.target.value)}
                                    style={formErrors.categorie ? { borderColor: 'var(--status-overdue)' } : {}}
                                    required
                                />
                                {formErrors.categorie && (
                                    <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                        {formErrors.categorie}
                                    </p>
                                )}
                            </div>

                            {/* Prévu / Réel */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label htmlFor="modal_prevu" className="label">
                                        Montant prévu (€) <span style={{ color: 'var(--status-overdue)' }}>*</span>
                                    </label>
                                    <input
                                        id="modal_prevu"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="input mono"
                                        placeholder="0.00"
                                        value={formData.prevu}
                                        onChange={(e) => setField('prevu', e.target.value)}
                                        style={formErrors.prevu ? { borderColor: 'var(--status-overdue)' } : {}}
                                        required
                                    />
                                    {formErrors.prevu && (
                                        <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                            {formErrors.prevu}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="modal_reel" className="label">
                                        Montant réel (€){' '}
                                        <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span>
                                    </label>
                                    <input
                                        id="modal_reel"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="input mono"
                                        placeholder="0.00"
                                        value={formData.reel}
                                        onChange={(e) => setField('reel', e.target.value)}
                                        style={formErrors.reel ? { borderColor: 'var(--status-overdue)' } : {}}
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label htmlFor="modal_notes" className="label">
                                    Notes{' '}
                                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span>
                                </label>
                                <textarea
                                    id="modal_notes"
                                    className="textarea"
                                    rows={3}
                                    maxLength={500}
                                    placeholder="Remarques…"
                                    value={formData.notes}
                                    onChange={(e) => setField('notes', e.target.value)}
                                />
                            </div>
                        </div>
                    </ModalBody>

                    <ModalFooter>
                        <button type="button" className="btn" onClick={fermerModal}>
                            Annuler
                        </button>
                        <button type="submit" className="btn primary" disabled={formLoading}>
                            {formLoading ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                    </ModalFooter>
                </form>
            </Modal>

            {/* ── Dialog de confirmation ── */}
            <ConfirmDialog
                open={!!confirmSuppr}
                message={`Supprimer la ligne "${confirmSuppr?.categorie}" ? Cette action est irréversible.`}
                confirmLabel="Supprimer"
                danger
                onConfirm={supprimerLigne}
                onCancel={() => setConfirmSuppr(null)}
            />
        </AppLayout>
    );
}

/* ── BlocMois ────────────────────────────────────────────────────────────── */

function BlocMois({ mois, nomMois, lignes, totaux, ecartPct, peutModifier, onEditer, onSupprimer }) {
    return (
        <>
            {/* Séparateur de mois */}
            <tr style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--hairline)' }}>
                <td colSpan={peutModifier ? 7 : 6}
                    style={{ padding: '6px 16px', fontWeight: 600, fontSize: 12.5, color: 'var(--ink)', letterSpacing: '0.02em' }}>
                    {nomMois}
                </td>
            </tr>

            {/* Lignes du mois */}
            {lignes.map((ligne) => {
                const ecart    = (ligne.reel ?? 0) - (ligne.prevu ?? 0);
                const prevuLig = ligne.prevu ?? 0;
                const pctLig   = prevuLig !== 0
                    ? `${((ecart / prevuLig) * 100).toFixed(1)} %`
                    : '—';

                return (
                    <tr key={ligne.id}>
                        <td style={{ color: 'var(--muted)', fontSize: 12 }} />
                        <td>{ligne.categorie}</td>
                        <td className="right num">{euro(ligne.prevu)}</td>
                        <td className="right num">
                            {ligne.reel != null ? euro(ligne.reel) : <span style={{ color: 'var(--muted)' }}>—</span>}
                        </td>
                        <CelluleEcart ecart={ecart} masquerSiZero={ligne.reel == null} />
                        <td className="right num" style={{ color: 'var(--muted)' }}>
                            {ligne.reel != null ? pctLig : '—'}
                        </td>
                        {peutModifier && (
                            <td>
                                <div className="actions" style={{ opacity: 1 }}>
                                    <button
                                        type="button"
                                        className="action-btn"
                                        title="Modifier"
                                        aria-label={`Modifier ${ligne.categorie}`}
                                        onClick={() => onEditer(ligne)}
                                    >
                                        <IcoEdit />
                                    </button>
                                    <button
                                        type="button"
                                        className="action-btn danger"
                                        title="Supprimer"
                                        aria-label={`Supprimer ${ligne.categorie}`}
                                        onClick={() => onSupprimer(ligne)}
                                    >
                                        <IcoTrash />
                                    </button>
                                </div>
                            </td>
                        )}
                    </tr>
                );
            })}

            {/* Ligne de total mensuel */}
            {totaux && (
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--hairline)', fontWeight: 500 }}>
                    <td colSpan={2} style={{ color: 'var(--muted)', fontSize: 12, padding: '7px 16px' }}>
                        Sous-total {nomMois}
                    </td>
                    <td className="right num">{euro(totaux.prevu)}</td>
                    <td className="right num">{euro(totaux.reel)}</td>
                    <CelluleEcart ecart={totaux.ecart} />
                    <td className="right num" style={{ color: 'var(--muted)' }}>
                        {ecartPct != null ? `${ecartPct} %` : '—'}
                    </td>
                    {peutModifier && <td />}
                </tr>
            )}
        </>
    );
}

/* ── CelluleEcart ────────────────────────────────────────────────────────── */

function CelluleEcart({ ecart, masquerSiZero = false }) {
    if (masquerSiZero && ecart === 0) {
        return <td className="right num" style={{ color: 'var(--muted)' }}>—</td>;
    }

    const estPositif = ecart > 0;
    const estNegatif = ecart < 0;

    const couleur = estPositif
        ? 'var(--status-overdue)'
        : estNegatif
            ? 'var(--status-paid)'
            : 'var(--ink)';

    return (
        <td className="right num" style={{ color: couleur }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                {estPositif && <TrendingUp  size={12} aria-hidden="true" />}
                {estNegatif && <TrendingDown size={12} aria-hidden="true" />}
                {ecart > 0 ? '+' : ''}{euro(ecart)}
            </span>
        </td>
    );
}
