/**
 * Dilicom — Recherche et enrichissement du catalogue.
 *
 * Deux sources disponibles :
 *   1. Google Books API (gratuit, par défaut) — recherche par ISBN, titre, auteur
 *   2. LibriWeb / Librisoft (optionnel) — si activé dans Configuration > Intégrations
 *
 * Fonctionnalités :
 *   - Recherche en temps réel avec debounce 400ms
 *   - Affichage des couvertures + métadonnées
 *   - Import direct vers le stock (crée une fiche produit à compléter)
 *   - Badge "Déjà en stock" pour éviter les doublons
 *   - Filtre de langue (français / tous)
 */

import { useState, useRef, useCallback } from 'react';
import { Head, router }                  from '@inertiajs/react';
import { AppLayout }                     from '../Components/Layout/AppLayout';

/* ── Icônes SVG inline ────────────────────────────────────────────────────── */
function Ico({ paths, size = 16 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="1.5"
             strokeLinecap="round" strokeLinejoin="round"
             dangerouslySetInnerHTML={{ __html: paths }}
        />
    );
}

const ICONS = {
    search:  '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus:    '<path d="M12 5v14M5 12h14"/>',
    check:   '<path d="M20 6 9 17l-5-5"/>',
    open:    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
    x:       '<path d="M18 6 6 18M6 6l12 12"/>',
    book:    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    spinner: '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>',
};

function IcoSearch()  { return <Ico paths={ICONS.search}  />; }
function IcoPlusBtn() { return <Ico paths={ICONS.plus}    />; }
function IcoCheckOk() { return <Ico paths={ICONS.check}   size={13} />; }
function IcoOpenExt() { return <Ico paths={ICONS.open}    />; }
function IcoClose()   { return <Ico paths={ICONS.x}       />; }
function IcoBook()    { return <Ico paths={ICONS.book}    size={32} />; }
function IcoSpin()    {
    return (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2"
             style={{ animation: 'dilicom-spin 1s linear infinite', display: 'inline-block' }}
             dangerouslySetInnerHTML={{ __html: ICONS.spinner }}
        />
    );
}

/* ── Carte livre ─────────────────────────────────────────────────────────── */
function CarteLibre({ livre, onImporter, importEnCours }) {
    const [imgErreur, setImgErreur] = useState(false);

    // Clé unique pour suivre quel livre est en cours d'import
    const cle = livre.ean || livre.google_id;

    return (
        <div style={{
            background: 'var(--card)', border: '1px solid var(--hairline)',
            borderRadius: 8, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            transition: 'box-shadow .15s',
        }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
            {/* Couverture */}
            <div style={{
                height: 180, background: 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderBottom: '1px solid var(--hairline)',
                position: 'relative', overflow: 'hidden',
            }}>
                {livre.couverture && !imgErreur ? (
                    <img
                        src={livre.couverture}
                        alt={`Couverture ${livre.titre}`}
                        onError={() => setImgErreur(true)}
                        style={{ height: '100%', width: '100%', objectFit: 'contain' }}
                    />
                ) : (
                    <div style={{ opacity: .2, color: 'var(--muted)' }}><IcoBook /></div>
                )}

                {/* Badge "Déjà en stock" */}
                {livre.deja_importe && (
                    <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: '#dcfce7', color: '#15803d',
                        fontSize: 10.5, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 12,
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <IcoCheckOk /> En stock
                    </div>
                )}
            </div>

            {/* Métadonnées */}
            <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35 }}
                     title={livre.titre}>
                    {livre.titre}
                    {livre.sous_titre && (
                        <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 12.5 }}>
                            {' — '}{livre.sous_titre}
                        </span>
                    )}
                </div>

                {livre.auteur && (
                    <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{livre.auteur}</div>
                )}

                <div style={{
                    fontSize: 12, color: 'var(--muted)', marginTop: 4,
                    display: 'flex', flexWrap: 'wrap', gap: 4,
                }}>
                    {livre.editeur && <span>{livre.editeur}</span>}
                    {livre.annee   && <span>· {livre.annee}</span>}
                    {livre.pages   && <span>· {livre.pages} p.</span>}
                </div>

                {livre.ean && (
                    <div style={{ fontSize: 11.5, fontFamily: 'monospace', color: 'var(--muted)', marginTop: 2 }}>
                        EAN {livre.ean}
                    </div>
                )}

                {livre.genre && (
                    <div style={{ marginTop: 6 }}>
                        <span style={{
                            fontSize: 11, background: 'var(--surface)', color: 'var(--muted)',
                            padding: '2px 8px', borderRadius: 10,
                            border: '1px solid var(--hairline)',
                        }}>
                            {livre.genre}
                        </span>
                    </div>
                )}

                {livre.description && (
                    <p style={{
                        fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginTop: 6,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                    }}>
                        {livre.description}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div style={{
                padding: '10px 14px',
                borderTop: '1px solid var(--hairline)',
                display: 'flex', gap: 8,
            }}>
                <button
                    className={`btn${livre.deja_importe ? '' : ' primary'}`}
                    style={{ flex: 1, fontSize: 12.5 }}
                    onClick={() => !livre.deja_importe && onImporter(livre)}
                    disabled={livre.deja_importe || importEnCours === cle}
                >
                    {importEnCours === cle ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <IcoSpin /> Import…
                        </span>
                    ) : livre.deja_importe ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            <IcoCheckOk /> Déjà en stock
                        </span>
                    ) : (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            <IcoPlusBtn /> Ajouter au stock
                        </span>
                    )}
                </button>

                {/* Lien Google Books */}
                {livre.google_id && (
                    <a
                        href={`https://books.google.fr/books?id=${livre.google_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ padding: '0 10px', display: 'flex', alignItems: 'center' }}
                        title="Voir sur Google Books"
                    >
                        <IcoOpenExt />
                    </a>
                )}
            </div>
        </div>
    );
}

/* ── Toast de notification ────────────────────────────────────────────────── */
function Toast({ msg, type = 'success', onClose }) {
    if (!msg) return null;
    const bg = type === 'success' ? '#dcfce7' : '#fee2e2';
    const cl = type === 'success' ? '#15803d' : '#b91c1c';
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: bg, color: cl,
            padding: '12px 16px', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5,
            boxShadow: '0 4px 16px rgba(0,0,0,.12)', maxWidth: 380,
        }}>
            <span style={{ flex: 1 }}>{msg}</span>
            <button onClick={onClose} style={{ color: cl, opacity: .6 }}><IcoClose /></button>
        </div>
    );
}

/* ── Page principale ──────────────────────────────────────────────────────── */
export default function Dilicom({ libriweb_actif = false }) {
    const [query,         setQuery]         = useState('');
    const [langue,        setLangue]        = useState('fr');
    const [livres,        setLivres]        = useState([]);
    const [loading,       setLoading]       = useState(false);
    const [erreur,        setErreur]        = useState(null);
    const [rechercheOk,   setRechercheOk]   = useState(false);
    const [importEnCours, setImportEnCours] = useState(null);
    const [toast,         setToast]         = useState(null);

    const timerRef = useRef(null);

    /* Appel AJAX vers /dilicom/rechercher */
    const rechercher = useCallback((q, lang) => {
        if (q.length < 2) {
            setLivres([]);
            setRechercheOk(false);
            setErreur(null);
            return;
        }

        setLoading(true);
        setErreur(null);

        fetch(`/dilicom/rechercher?q=${encodeURIComponent(q)}&lang=${lang}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(r => r.json())
            .then(data => {
                if (data.erreur) {
                    setErreur(data.erreur);
                    setLivres([]);
                } else {
                    setLivres(data.livres ?? []);
                }
                setRechercheOk(true);
            })
            .catch(() => {
                setErreur('Impossible de contacter le serveur.');
                setLivres([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const onQueryChange = (val) => {
        setQuery(val);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => rechercher(val, langue), 400);
    };

    const onLangueChange = (lang) => {
        setLangue(lang);
        if (query.length >= 2) rechercher(query, lang);
    };

    /* Import d'un livre vers le stock */
    const onImporter = (livre) => {
        const cle = livre.ean || livre.google_id;
        setImportEnCours(cle);

        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

        fetch('/dilicom/importer', {
            method: 'POST',
            headers: {
                'Content-Type':     'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN':     csrf,
            },
            body: JSON.stringify({
                titre:         livre.titre,
                auteur:        livre.auteur,
                editeur:       livre.editeur,
                ean:           livre.ean,
                date_parution: livre.date_parution,
                genre:         livre.genre,
            }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    // Marquer le livre comme importé dans la grille
                    setLivres(prev => prev.map(l =>
                        (livre.ean && l.ean === livre.ean) || l.google_id === livre.google_id
                            ? { ...l, deja_importe: true }
                            : l
                    ));
                    setToast({
                        msg: `"${livre.titre}" ajouté (réf. ${data.reference}). Redirection vers la fiche…`,
                        type: 'success',
                    });
                    // Redirection vers la fiche produit après 2 secondes
                    setTimeout(() => router.visit(`/stock/${data.produit_id}/modifier`), 2200);
                } else {
                    setToast({ msg: data.message, type: data.produit_id ? 'info' : 'error' });
                }
            })
            .catch(() => setToast({ msg: "Erreur lors de l'import.", type: 'error' }))
            .finally(() => setImportEnCours(null));
    };

    /* ── Render ── */
    return (
        <AppLayout title="Catalogue / Dilicom">
            <Head title="Catalogue Dilicom" />

            {/* ── En-tête ── */}
            <div className="page-head">
                <div>
                    <h1 className="page-title">Recherche catalogue</h1>
                    <p className="page-sub">
                        Recherchez par ISBN, titre ou auteur pour enrichir votre stock.{' '}
                        {libriweb_actif
                            ? <span style={{ color: 'var(--accent)', fontWeight: 500 }}>LibriWeb actif ✓</span>
                            : <span style={{ color: 'var(--muted)' }}>Source : Google Books (gratuit)</span>
                        }
                    </p>
                </div>
            </div>

            {/* ── Barre de recherche ── */}
            <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                    {/* Champ de recherche */}
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span style={{
                            position: 'absolute', left: 10, top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--muted)', pointerEvents: 'none',
                        }}>
                            <IcoSearch />
                        </span>
                        <input
                            className="input"
                            style={{ paddingLeft: 36, paddingRight: query ? 36 : 12 }}
                            placeholder="ISBN (9782…), titre, auteur…"
                            value={query}
                            onChange={e => onQueryChange(e.target.value)}
                            autoFocus
                        />
                        {query && (
                            <button
                                onClick={() => { setQuery(''); setLivres([]); setRechercheOk(false); setErreur(null); }}
                                style={{
                                    position: 'absolute', right: 8, top: '50%',
                                    transform: 'translateY(-50%)', color: 'var(--muted)',
                                }}
                                title="Effacer"
                            >
                                <IcoClose />
                            </button>
                        )}
                    </div>

                    {/* Filtre langue */}
                    <select
                        className="input"
                        style={{ width: 'auto', minWidth: 140 }}
                        value={langue}
                        onChange={e => onLangueChange(e.target.value)}
                    >
                        <option value="fr">Français</option>
                        <option value="all">Toutes langues</option>
                        <option value="en">Anglais</option>
                        <option value="es">Espagnol</option>
                        <option value="de">Allemand</option>
                        <option value="it">Italien</option>
                    </select>
                </div>

                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
                    Les données proviennent de <strong>Google Books API</strong> (gratuit, sans inscription).
                    Pour le FEL (Fichier Exhaustif du Livre Dilicom), activez l'intégration LibriWeb
                    dans <a href="/configuration" style={{ color: 'var(--accent)' }}>Configuration → Intégrations</a>.
                </p>
            </div>

            {/* ── Chargement ── */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <IcoSpin /> Recherche en cours…
                </div>
            )}

            {/* ── Erreur ── */}
            {erreur && !loading && (
                <div style={{
                    background: '#fee2e2', color: '#b91c1c',
                    padding: '12px 16px', borderRadius: 8,
                    marginBottom: 16, fontSize: 13.5,
                }}>
                    {erreur}
                </div>
            )}

            {/* ── Aucun résultat ── */}
            {!loading && rechercheOk && livres.length === 0 && !erreur && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12, opacity: .25 }}>📚</div>
                    <p style={{ fontWeight: 500, marginBottom: 6, color: 'var(--ink)' }}>Aucun résultat</p>
                    <p style={{ fontSize: 13 }}>
                        Essayez "Toutes langues" ou vérifiez l'ISBN saisi.
                    </p>
                </div>
            )}

            {/* ── Résultats ── */}
            {!loading && livres.length > 0 && (
                <>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                        {livres.length} résultat{livres.length > 1 ? 's' : ''}
                        {livres.filter(l => l.deja_importe).length > 0 && (
                            <span style={{ color: '#16a34a', marginLeft: 8 }}>
                                · {livres.filter(l => l.deja_importe).length} déjà en stock
                            </span>
                        )}
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: 16,
                    }}>
                        {livres.map(livre => (
                            <CarteLibre
                                key={livre.google_id || livre.ean}
                                livre={livre}
                                onImporter={onImporter}
                                importEnCours={importEnCours}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* ── État initial ── */}
            {!loading && !rechercheOk && (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: .2 }}>🔍</div>
                    <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 8, color: 'var(--ink)' }}>
                        Recherchez un livre
                    </p>
                    <p style={{ fontSize: 13, maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
                        Saisissez un ISBN-13, un titre ou le nom d'un auteur pour trouver
                        un livre et l'importer directement dans votre stock.
                    </p>
                </div>
            )}

            <Toast
                msg={toast?.msg}
                type={toast?.type}
                onClose={() => setToast(null)}
            />

            <style>{`@keyframes dilicom-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </AppLayout>
    );
}
