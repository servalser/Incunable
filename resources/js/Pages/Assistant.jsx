/**
 * Assistant — conseiller financier IA propulsé par Ollama (modèle local) ou Groq (cloud).
 *
 * Props reçues via Inertia :
 *   - aiProvider  : 'ollama' | 'groq'
 *   - aiModel     : string
 *   - contexte    : { lcr_en_retard, lcr_en_attente, offices_alerte, total_impaye }
 */

import { Head } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '../Components/Layout/AppLayout';
import { Send, Bot, User, AlertCircle, TrendingUp, BookOpen, AlertTriangle } from 'lucide-react';

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const euro = (n) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

/* ── Bulle de message ──────────────────────────────────────────────────────── */
function MessageBubble({ role, content }) {
    const isUser = role === 'user';
    return (
        <div style={{ display: 'flex', gap: 10, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isUser ? 'var(--accent)' : 'var(--surface-2)',
                color: isUser ? 'var(--on-accent)' : 'var(--muted)',
            }}>
                {isUser ? <User size={14} /> : <Bot size={14} />}
            </div>

            {/* Contenu */}
            <div style={{
                maxWidth: '75%', borderRadius: 14,
                padding: '10px 14px', fontSize: 13.5, lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                background: isUser ? 'var(--accent)' : 'var(--surface-2)',
                color: isUser ? 'var(--on-accent)' : 'var(--ink)',
                borderTopRightRadius: isUser ? 4 : 14,
                borderTopLeftRadius:  isUser ? 14 : 4,
            }}>
                {content}
            </div>
        </div>
    );
}

/* ── Indicateur de frappe ──────────────────────────────────────────────────── */
function TypingIndicator() {
    return (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--surface-2)', color: 'var(--muted)',
            }}>
                <Bot size={14} />
            </div>
            <div style={{
                background: 'var(--surface-2)', borderRadius: 14, borderTopLeftRadius: 4,
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 4,
            }}>
                {[0, 1, 2].map(i => (
                    <span key={i} className="typing-dot" style={{ animationDelay: `${i * 160}ms` }} />
                ))}
            </div>
        </div>
    );
}

/* ── Carte contexte financier ──────────────────────────────────────────────── */
function ContextCard({ contexte }) {
    const items = [
        { icon: AlertTriangle, label: 'LCR en retard',    value: euro(contexte.lcr_en_retard),     color: 'var(--status-overdue)' },
        { icon: AlertCircle,   label: 'LCR en attente',   value: euro(contexte.lcr_en_attente),    color: 'var(--status-pending)' },
        { icon: BookOpen,      label: 'Offices en alerte', value: `${contexte.offices_alerte} office(s)`, color: 'var(--accent)' },
        { icon: TrendingUp,    label: 'Total impayé',      value: euro(contexte.total_impaye),      color: 'var(--muted)' },
    ];

    return (
        <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head" style={{ paddingBottom: 8 }}>
                <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <TrendingUp size={14} aria-hidden="true" />
                    Contexte financier injecté
                </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, padding: '12px 20px 16px' }}>
                {items.map(({ icon: Icon, label, value, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={15} style={{ color, flexShrink: 0 }} aria-hidden="true" />
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color }}>{value}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Suggestions rapides ── */
const SUGGESTIONS = [
    'Quelles LCR dois-je prioriser pour paiement ?',
    "Comment négocier un délai avec un distributeur ?",
    "Que faire si un office n'est pas retourné à temps ?",
    'Comment optimiser ma trésorerie ce mois-ci ?',
];

/* ── Page principale ────────────────────────────────────────────────────────── */
export default function Assistant({ aiProvider, aiModel, contexte }) {
    const [messages, setMessages] = useState([]);
    const [input,    setInput]    = useState('');
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);
    const bottomRef  = useRef(null);
    const inputRef   = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const sendMessage = async (text) => {
        const content = (text ?? input).trim();
        if (!content || loading) return;

        const userMsg = { role: 'user', content };
        const newMsgs = [...messages, userMsg];
        setMessages(newMsgs);
        setInput('');
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/assistant/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({ messages: newMsgs }),
            });

            if (res.status === 401) { setError('Session expirée. Rechargez la page.'); return; }
            if (res.status === 419) { setError('Jeton expiré. Rechargez la page (F5).'); return; }

            const data = await res.json();
            if (!res.ok || data.error) {
                setError(data.error ?? data.message ?? 'Erreur serveur.');
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
            }
        } catch {
            setError('Impossible de joindre le serveur. Vérifiez que php artisan serve tourne.');
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    return (
        <AppLayout title="Conseiller">
            <Head title="Conseiller" />

            {/* ── En-tête ── */}
            <div className="page-head">
                <div>
                    <h1 className="page-title">Conseiller</h1>
                    <p className="page-sub">
                        Assistant financier{aiModel ? ` — ${aiModel}` : ''}
                    </p>
                </div>
            </div>

            {/* ── Info provider IA ── */}
            <div style={{
                marginBottom: 16,
                display: 'flex', alignItems: 'flex-start', gap: 12,
                background: 'var(--surface-2)', borderRadius: 10, padding: '12px 16px',
                border: '1px solid var(--hairline)', fontSize: 13,
            }}>
                <Bot size={16} style={{ color: 'var(--muted)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <div>
                    <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                        {aiProvider === 'groq' ? 'Propulsé par Groq (cloud)' : 'Modèle local (Ollama)'}
                    </p>
                    <p style={{ color: 'var(--muted)' }}>
                        Modèle actif :{' '}
                        <code style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--surface)', padding: '1px 5px', borderRadius: 4 }}>
                            {aiModel}
                        </code>.{' '}
                        {aiProvider === 'groq'
                            ? "Aucune installation requise. Assurez-vous que GROQ_API_KEY est renseigné dans le .env."
                            : <>Installez <a href="https://ollama.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Ollama</a>, puis lancez <code style={{ fontFamily: 'JetBrains Mono, monospace', background: 'var(--surface)', padding: '1px 5px', borderRadius: 4 }}>ollama serve</code>.</>
                        }
                    </p>
                </div>
            </div>

            {/* ── Contexte financier ── */}
            <ContextCard contexte={contexte} />

            {/* ── Zone de chat ── */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 480 }}>
                {/* Messages scrollables */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {messages.length === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, textAlign: 'center' }}>
                            <Bot size={44} style={{ color: 'var(--muted-2)' }} aria-hidden="true" />
                            <div>
                                <p style={{ fontWeight: 600, color: 'var(--ink)' }}>Bonjour ! Je suis votre conseiller financier.</p>
                                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                                    Posez-moi une question sur la gestion de vos LCR, offices ou trésorerie.
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                                {SUGGESTIONS.map((s, i) => (
                                    <button key={i} onClick={() => sendMessage(s)} disabled={loading}
                                        style={{
                                            fontSize: 12, border: '1px solid var(--hairline)', borderRadius: 9999,
                                            padding: '5px 12px', color: 'var(--muted)', background: 'none', cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                        onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--hairline)'; e.currentTarget.style.color = 'var(--muted)'; }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <MessageBubble key={i} role={m.role} content={m.content} />
                    ))}

                    {loading && <TypingIndicator />}

                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                            color: 'var(--status-overdue)', background: 'var(--status-overdue-bg)',
                            borderRadius: 8, padding: '10px 14px',
                        }}>
                            <AlertCircle size={14} style={{ flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Zone de saisie */}
                <div style={{ borderTop: '1px solid var(--hairline)', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            disabled={loading}
                            placeholder="Posez votre question… (Entrée pour envoyer)"
                            rows={1}
                            className="textarea"
                            style={{ flex: 1, resize: 'none', minHeight: 40, maxHeight: 120, marginBottom: 0 }}
                        />
                        <button
                            className="btn primary"
                            style={{ width: 38, height: 38, padding: 0, display: 'grid', placeItems: 'center', flexShrink: 0 }}
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                            aria-label="Envoyer"
                        >
                            <Send size={15} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
