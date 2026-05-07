/**
 * Stock/Form — formulaire de création et de modification d'un produit (livre ou goodie).
 *
 * Props reçues depuis le contrôleur Laravel (via Inertia) :
 *   - produit : null | objet produit existant
 *   - mode    : 'create' | 'edit'
 */

import { Head, Link, router } from '@inertiajs/react';
import { useState }           from 'react';
import { ArrowLeft, Search, BookOpen, Package, CheckCircle, XCircle } from 'lucide-react';

import { AppLayout } from '../../Components/Layout/AppLayout';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const getCsrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.content ?? '';

/* ── Composant principal ──────────────────────────────────────────────────── */
export default function StockForm({ produit, mode }) {
    const isEdit = mode === 'edit';

    const [data, setData] = useState({
        type:          produit?.type          ?? 'livre',
        ean:           produit?.ean           ?? '',
        titre:         produit?.titre         ?? '',
        auteur:        produit?.auteur        ?? '',
        editeur:       produit?.editeur       ?? '',
        genre:         produit?.genre         ?? '',
        prix_ttc:      produit?.prix_ttc      ?? '',
        date_parution: produit?.date_parution ?? '',
        stock_initial: produit?.stock_initial ?? '',
        seuil_alerte:  produit?.seuil_alerte  ?? '',
        notes:         produit?.notes         ?? '',
    });

    const [errors,        setErrors]        = useState({});
    const [lookupStatus,  setLookupStatus]  = useState(null); // null | 'found' | 'not_found'
    const [lookupLoading, setLookupLoading] = useState(false);
    const [eanLocked,     setEanLocked]     = useState(false);
    const [processing,    setProcessing]    = useState(false);

    const setField = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

    /* ── Lookup ISBN ── */
    const lookupIsbn = async (isbn) => {
        if (!isbn || isbn.length < 10) return;
        setLookupLoading(true);
        setLookupStatus(null);
        try {
            const res      = await fetch(`/stock/lookup-isbn?isbn=${encodeURIComponent(isbn)}`, {
                headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
            });
            const dataJson = await res.json();
            if (dataJson.found) {
                setData((prev) => ({
                    ...prev,
                    titre:         dataJson.titre         ?? prev.titre,
                    auteur:        dataJson.auteur        ?? prev.auteur,
                    editeur:       dataJson.editeur       ?? prev.editeur,
                    date_parution: dataJson.date_parution ?? prev.date_parution,
                    genre:         dataJson.genre         ?? prev.genre,
                }));
                setLookupStatus('found');
                setEanLocked(true);
            } else {
                setLookupStatus('not_found');
            }
        } catch {
            setLookupStatus('not_found');
        } finally {
            setLookupLoading(false);
        }
    };

    const resetEan = () => { setEanLocked(false); setLookupStatus(null); setField('ean', ''); };

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        const options = {
            onError:  (errs) => { setErrors(errs); setProcessing(false); },
            onFinish: ()     => setProcessing(false),
        };
        if (isEdit) {
            router.put(`/stock/${produit.id}`, data, options);
        } else {
            router.post('/stock', data, options);
        }
    };

    const pageTitle = isEdit ? `Modifier ${produit?.titre ?? 'le produit'}` : 'Ajouter un produit';

    /* ── Composant d'erreur de champ ── */
    const FErr = ({ field }) => errors[field]
        ? <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>{errors[field]}</p>
        : null;

    return (
        <AppLayout title={pageTitle}>
            <Head title={pageTitle} />

            {/* ── Bouton retour ── */}
            <Link
                href="/stock"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', marginBottom: 20, textDecoration: 'none' }}
            >
                <ArrowLeft size={14} />
                Stock
            </Link>

            {/* ── En-tête ── */}
            <div className="page-head" style={{ marginBottom: 24 }}>
                <div>
                    <h1 className="page-title">{pageTitle}</h1>
                </div>
            </div>

            <form onSubmit={submit} noValidate style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── Type de produit ── */}
                <div className="card">
                    <div className="card-head">
                        <h2 className="section-title" style={{ margin: 0 }}>Type de produit</h2>
                    </div>
                    <div style={{ padding: '16px 20px', display: 'flex', gap: 12 }} role="radiogroup" aria-label="Type de produit">
                        {[
                            { value: 'livre',  label: 'Livre',  Icon: BookOpen },
                            { value: 'goodie', label: 'Goodie', Icon: Package },
                        ].map(({ value, label, Icon }) => {
                            const active = data.type === value;
                            return (
                                <label key={value} style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    cursor: 'pointer', borderRadius: 8,
                                    border: `1px solid ${active ? 'var(--accent)' : 'var(--hairline)'}`,
                                    background: active ? 'var(--accent-soft)' : 'var(--surface)',
                                    color: active ? 'var(--accent-ink)' : 'var(--muted)',
                                    padding: '10px 16px', fontSize: 13.5, fontWeight: 500,
                                    transition: 'all 0.15s',
                                }}>
                                    <input type="radio" name="type" value={value}
                                        checked={active}
                                        onChange={() => setField('type', value)}
                                        className="sr-only" />
                                    <Icon size={15} aria-hidden="true" />
                                    {label}
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* ── Recherche ISBN (livres seulement) ── */}
                {data.type === 'livre' && (
                    <div className="card">
                        <div className="card-head">
                            <h2 className="section-title" style={{ margin: 0 }}>Recherche par ISBN / EAN</h2>
                        </div>
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                                Entrez le code-barres EAN-13 du livre pour remplir automatiquement les métadonnées.
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    id="ean"
                                    type="text"
                                    className="input mono"
                                    placeholder="Ex : 9782070360024"
                                    value={data.ean}
                                    readOnly={eanLocked}
                                    onChange={(e) => setField('ean', e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') { e.preventDefault(); lookupIsbn(data.ean); }
                                    }}
                                    style={{ flex: 1, ...(eanLocked ? { background: 'var(--surface-2)', cursor: 'not-allowed' } : {}) }}
                                    aria-label="Code EAN / ISBN"
                                />
                                {eanLocked ? (
                                    <button type="button" className="btn" onClick={resetEan}>Changer</button>
                                ) : (
                                    <button type="button" className="btn" onClick={() => lookupIsbn(data.ean)}
                                        disabled={lookupLoading || !data.ean}>
                                        {lookupLoading
                                            ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                            : <Search size={14} aria-hidden="true" />
                                        }
                                        Rechercher
                                    </button>
                                )}
                            </div>
                            {lookupStatus === 'found' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--status-paid)', fontWeight: 500 }}>
                                    <CheckCircle size={14} aria-hidden="true" />
                                    Données trouvées — champs pré-remplis
                                </div>
                            )}
                            {lookupStatus === 'not_found' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
                                    <XCircle size={14} aria-hidden="true" />
                                    Aucun résultat — remplissez les champs manuellement
                                </div>
                            )}
                            <FErr field="ean" />
                        </div>
                    </div>
                )}

                {/* ── Informations principales ── */}
                <div className="card">
                    <div className="card-head">
                        <h2 className="section-title" style={{ margin: 0 }}>Informations principales</h2>
                    </div>
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* EAN Goodie */}
                        {data.type === 'goodie' && (
                            <div>
                                <label htmlFor="ean_goodie" className="label">
                                    EAN / Code produit{' '}
                                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span>
                                </label>
                                <input id="ean_goodie" type="text" className="input mono"
                                    placeholder="Ex : 0123456789012"
                                    value={data.ean}
                                    onChange={(e) => setField('ean', e.target.value)} />
                                <FErr field="ean" />
                            </div>
                        )}

                        {/* Titre */}
                        <div>
                            <label htmlFor="titre" className="label">
                                Titre <span style={{ color: 'var(--status-overdue)' }}>*</span>
                            </label>
                            <input id="titre" type="text" className="input"
                                placeholder="Titre du produit"
                                value={data.titre}
                                onChange={(e) => setField('titre', e.target.value)}
                                style={errors.titre ? { borderColor: 'var(--status-overdue)' } : {}}
                                required />
                            <FErr field="titre" />
                        </div>

                        {/* Auteur (livres) */}
                        {data.type === 'livre' && (
                            <div>
                                <label htmlFor="auteur" className="label">
                                    Auteur{' '}
                                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span>
                                </label>
                                <input id="auteur" type="text" className="input"
                                    placeholder="Prénom Nom"
                                    value={data.auteur}
                                    onChange={(e) => setField('auteur', e.target.value)}
                                    style={errors.auteur ? { borderColor: 'var(--status-overdue)' } : {}} />
                                <FErr field="auteur" />
                            </div>
                        )}

                        {/* Éditeur (livres) */}
                        {data.type === 'livre' && (
                            <div>
                                <label htmlFor="editeur" className="label">
                                    Éditeur{' '}
                                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span>
                                </label>
                                <input id="editeur" type="text" className="input"
                                    placeholder="Nom de la maison d'édition"
                                    value={data.editeur}
                                    onChange={(e) => setField('editeur', e.target.value)}
                                    style={errors.editeur ? { borderColor: 'var(--status-overdue)' } : {}} />
                                <FErr field="editeur" />
                            </div>
                        )}

                        {/* Genre + Prix TTC */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label htmlFor="genre" className="label">
                                    Genre / Catégorie{' '}
                                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span>
                                </label>
                                <input id="genre" type="text" className="input"
                                    placeholder="Roman, BD, Papeterie…"
                                    value={data.genre}
                                    onChange={(e) => setField('genre', e.target.value)}
                                    style={errors.genre ? { borderColor: 'var(--status-overdue)' } : {}} />
                                <FErr field="genre" />
                            </div>
                            <div>
                                <label htmlFor="prix_ttc" className="label">
                                    Prix TTC (€){' '}
                                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span>
                                </label>
                                <input id="prix_ttc" type="number" step="0.01" min="0"
                                    className="input mono"
                                    placeholder="0.00"
                                    value={data.prix_ttc}
                                    onChange={(e) => setField('prix_ttc', e.target.value)}
                                    style={errors.prix_ttc ? { borderColor: 'var(--status-overdue)' } : {}} />
                                <FErr field="prix_ttc" />
                            </div>
                        </div>

                        {/* Date de parution (livres) */}
                        {data.type === 'livre' && (
                            <div>
                                <label htmlFor="date_parution" className="label">
                                    Date de parution{' '}
                                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span>
                                </label>
                                <input id="date_parution" type="date" className="input"
                                    value={data.date_parution}
                                    onChange={(e) => setField('date_parution', e.target.value)}
                                    style={errors.date_parution ? { borderColor: 'var(--status-overdue)' } : {}} />
                                <FErr field="date_parution" />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Stock et alertes ── */}
                <div className="card">
                    <div className="card-head">
                        <h2 className="section-title" style={{ margin: 0 }}>Stock et alertes</h2>
                    </div>
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {!isEdit ? (
                            <div>
                                <label htmlFor="stock_initial" className="label">
                                    Stock initial{' '}
                                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span>
                                </label>
                                <input id="stock_initial" type="number" min="0" step="1"
                                    className="input mono"
                                    placeholder="0"
                                    value={data.stock_initial}
                                    onChange={(e) => setField('stock_initial', e.target.value)}
                                    style={errors.stock_initial ? { borderColor: 'var(--status-overdue)' } : {}} />
                                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                                    Quantité disponible au moment de l'enregistrement.
                                </p>
                                <FErr field="stock_initial" />
                            </div>
                        ) : (
                            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--muted)' }}>
                                Pour modifier la quantité en stock, utilisez les{' '}
                                <strong style={{ color: 'var(--ink)' }}>mouvements de stock</strong>{' '}
                                afin de conserver un historique complet des entrées et sorties.
                            </div>
                        )}

                        <div>
                            <label htmlFor="seuil_alerte" className="label">
                                Seuil d'alerte personnalisé{' '}
                                <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span>
                            </label>
                            <input id="seuil_alerte" type="number" min="0" step="1"
                                className="input mono"
                                placeholder="Défaut global"
                                value={data.seuil_alerte}
                                onChange={(e) => setField('seuil_alerte', e.target.value)}
                                style={errors.seuil_alerte ? { borderColor: 'var(--status-overdue)' } : {}} />
                            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                                Laissez vide pour utiliser le seuil configuré globalement.
                            </p>
                            <FErr field="seuil_alerte" />
                        </div>
                    </div>
                </div>

                {/* ── Notes internes ── */}
                <div className="card">
                    <div className="card-head">
                        <h2 className="section-title" style={{ margin: 0 }}>Notes internes</h2>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                        <textarea id="notes" className="textarea" rows={4} maxLength={2000}
                            placeholder="Informations complémentaires, remarques…"
                            value={data.notes}
                            onChange={(e) => setField('notes', e.target.value)}
                            style={errors.notes ? { borderColor: 'var(--status-overdue)' } : {}} />
                        <FErr field="notes" />
                    </div>
                </div>

                {/* ── Boutons d'action ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                    <Link href="/stock" className="btn">Annuler</Link>
                    <button type="submit" className="btn primary" disabled={processing}>
                        {processing ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
