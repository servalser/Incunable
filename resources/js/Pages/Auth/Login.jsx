import { Head, useForm }   from '@inertiajs/react';
import { useState }        from 'react';
import { motion }          from 'framer-motion';
import { BookLogo }        from '../../Components/BookLogo';

/* ── Icônes œil ──────────────────────────────────────────────────────────── */
const EyeIcon = ({ off }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {off ? (
            <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A10 10 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                <path d="M1 1l22 22"/>
            </>
        ) : (
            <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
                <circle cx="12" cy="12" r="3"/>
            </>
        )}
    </svg>
);

/* ── Flèche droite ───────────────────────────────────────────────────────── */
const ArrowRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
);

/* ── Page de connexion ────────────────────────────────────────────────────── */
export default function Login({ errors: serverErrors }) {
    const [showPwd, setShowPwd] = useState(false);
    const [remember, setRemember] = useState(true);

    const { data, setData, post, processing, errors } = useForm({
        email:    '',
        password: '',
        remember: true,
    });

    const allErrors = { ...serverErrors, ...errors };

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Connexion — Incunable" />

            <div className="login-page">

                {/* ── Panneau gauche — éditorial ────────────────────────── */}
                <aside className="login-aside">
                    {/* Fond papier réglé */}
                    <svg className="login-bg" viewBox="0 0 600 900"
                        preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                        <defs>
                            <pattern id="ruled" x="0" y="0" width="600" height="32"
                                patternUnits="userSpaceOnUse">
                                <line x1="0" y1="31" x2="600" y2="31"
                                    stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
                            </pattern>
                        </defs>
                        <rect width="600" height="900" fill="url(#ruled)"
                            color="var(--accent)" opacity="0.3"/>
                        <line x1="22" y1="0" x2="22" y2="900"
                            stroke="var(--accent)" strokeWidth="1" opacity="0.45"/>
                        <line x1="26" y1="0" x2="26" y2="900"
                            stroke="var(--accent)" strokeWidth="0.5" opacity="0.25"/>
                    </svg>

                    {/* Marque */}
                    <div className="login-mark">
                        <div className="login-mark-row">
                            <BookLogo state="closed" size={32} color="var(--accent)" />
                            <div className="login-wordmark">
                                <div className="name">Incunable</div>
                            </div>
                        </div>
                    </div>

                    {/* Titre héros */}
                    <div className="login-hero">
                        <h1 className="hero-title">
                            Le&nbsp;livre<br />des&nbsp;comptes,
                            <br />
                            <span>pour&nbsp;ceux<br />qui&nbsp;en&nbsp;vendent.</span>
                        </h1>
                        <div className="hero-rule" />
                    </div>
                </aside>

                {/* ── Panneau droit — formulaire ────────────────────────── */}
                <div className="login-form-wrap">
                    {/* Animation d'entrée : glisse depuis la droite avec léger fondu */}
                    <motion.div
                        className="login-form-inner"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.45, delay: 0.15, ease: [0.2, 0.7, 0.2, 1] }}
                    >

                        {/* Tampon livre */}
                        <div className="login-stamp">
                            <BookLogo state="closed" size={72} color="var(--accent)" />
                        </div>

                        <form onSubmit={submit} noValidate>
                            <div className="form-eyebrow" style={{
                                fontSize: 10.5, letterSpacing: '0.18em',
                                fontWeight: 500, color: 'var(--accent)',
                                textTransform: 'uppercase', marginBottom: 8,
                            }}>
                                CONNEXION
                            </div>
                            <h2 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 30, letterSpacing: '-0.02em',
                                fontWeight: 400, margin: '0 0 4px',
                                color: 'var(--ink)',
                            }}>
                                Bonjour.
                            </h2>
                            <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 28 }}>
                                Ouvrez le livre des comptes.
                            </div>

                            {/* Erreur globale */}
                            {allErrors.email && !data.email && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: 6, marginBottom: 16,
                                    background: 'var(--status-overdue-bg)',
                                    border: '1px solid var(--status-overdue)',
                                    color: 'var(--status-overdue)', fontSize: 13,
                                }}>
                                    {allErrors.email}
                                </div>
                            )}

                            {/* Adresse e-mail */}
                            <div className="field" style={{ marginBottom: 14 }}>
                                <div className="label">Adresse email</div>
                                <input
                                    className="input"
                                    type="email"
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="admin@librairie.fr"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    style={allErrors.email ? { borderColor: 'var(--status-overdue)' } : {}}
                                />
                                {allErrors.email && data.email && (
                                    <div style={{ fontSize: 12, color: 'var(--status-overdue)', marginTop: 4 }}>
                                        {allErrors.email}
                                    </div>
                                )}
                            </div>

                            {/* Mot de passe */}
                            <div className="field" style={{ marginBottom: 14 }}>
                                <div className="label">Mot de passe</div>
                                <div className="password-wrap" style={{ position: 'relative' }}>
                                    <input
                                        className="input"
                                        type={showPwd ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        style={{
                                            paddingRight: 40,
                                            ...(allErrors.password ? { borderColor: 'var(--status-overdue)' } : {}),
                                        }}
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPwd(v => !v)}
                                        title={showPwd ? 'Masquer' : 'Afficher'}
                                        style={{
                                            position: 'absolute', right: 10,
                                            top: '50%', transform: 'translateY(-50%)',
                                            color: 'var(--muted)', display: 'flex',
                                        }}
                                    >
                                        <EyeIcon off={showPwd} />
                                    </button>
                                </div>
                                {allErrors.password && (
                                    <div style={{ fontSize: 12, color: 'var(--status-overdue)', marginTop: 4 }}>
                                        {allErrors.password}
                                    </div>
                                )}
                            </div>

                            {/* Se souvenir + mot de passe oublié */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', marginBottom: 20,
                            }}>
                                <label className="checkbox">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={e => setData('remember', e.target.checked)}
                                    />
                                    <span className="box" />
                                    <span>Se souvenir de moi</span>
                                </label>
                                <a href="#" style={{ fontSize: 12.5, color: 'var(--accent)' }}>
                                    Mot de passe oublié ?
                                </a>
                            </div>

                            {/* Bouton connexion */}
                            <button
                                type="submit"
                                className="btn primary"
                                disabled={processing}
                                style={{ width: '100%', justifyContent: 'center', padding: '11px 14px', fontSize: 14 }}
                            >
                                {processing ? (
                                    /* Points de chargement animés pendant la connexion */
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        Connexion
                                        <span style={{ display: 'flex', gap: 3 }}>
                                            <span className="typing-dot" style={{ background: 'var(--on-accent)', opacity: 0.8 }} />
                                            <span className="typing-dot" style={{ background: 'var(--on-accent)', opacity: 0.8 }} />
                                            <span className="typing-dot" style={{ background: 'var(--on-accent)', opacity: 0.8 }} />
                                        </span>
                                    </span>
                                ) : (
                                    <>
                                        Ouvrir la session
                                        <ArrowRight />
                                    </>
                                )}
                            </button>

                            <div style={{
                                marginTop: 20, textAlign: 'center',
                                fontSize: 12.5, color: 'var(--muted)',
                            }}>
                                Gestion financière pour librairie indépendante
                            </div>
                        </form>

                    </motion.div>
                </div>

            </div>
        </>
    );
}
