/**
 * Lettres/Form — formulaire de création et de modification d'une LCR.
 *
 * Props reçues depuis le contrôleur Laravel (via Inertia) :
 *   - lettre       : null | { id, reference, distributeur_id, montant_ttc, date_emission, notes }
 *   - distributeurs: tableau [{ id, nom }]
 */

import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft }           from 'lucide-react';
import { AppLayout }           from '../../Components/Layout/AppLayout';

export default function LettreForm({ lettre, distributeurs }) {
    const isEdit = !!lettre;

    const { data, setData, post, put, processing, errors } = useForm({
        distributeur_id: lettre?.distributeur_id ? String(lettre.distributeur_id) : '',
        montant_ttc:     lettre?.montant_ttc     ?? '',
        date_emission:   lettre?.date_emission   ?? '',
        notes:           lettre?.notes           ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        isEdit ? put(`/lettres/${lettre.id}`) : post('/lettres');
    };

    return (
        <AppLayout title={isEdit ? `Modifier ${lettre.reference}` : 'Nouvelle LCR'}>
            <Head title={isEdit ? `Modifier ${lettre.reference}` : 'Nouvelle LCR'} />

            {/* ── Bouton retour ── */}
            <Link
                href={isEdit ? `/lettres/${lettre.id}` : '/lettres'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', marginBottom: 20, textDecoration: 'none' }}
            >
                <ArrowLeft size={14} />
                {isEdit ? lettre.reference : 'Lettres de change'}
            </Link>

            {/* ── En-tête ── */}
            <div className="page-head" style={{ marginBottom: 24 }}>
                <div>
                    <h1 className="page-title">
                        {isEdit ? `Modifier ${lettre.reference}` : 'Nouvelle lettre de change'}
                    </h1>
                </div>
            </div>

            {/* ── Formulaire ── */}
            <div className="card" style={{ maxWidth: 560 }}>
                <div className="card-head">
                    <h2 className="section-title" style={{ margin: 0 }}>
                        {isEdit ? 'Modifier les informations' : 'Informations de la LCR'}
                    </h2>
                </div>

                <form onSubmit={submit} noValidate style={{ padding: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Fournisseur + Montant TTC */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label htmlFor="distributeur_id" className="label">
                                    Fournisseur <span style={{ color: 'var(--status-overdue)' }}>*</span>
                                </label>
                                <select
                                    id="distributeur_id"
                                    className="select"
                                    value={data.distributeur_id}
                                    onChange={(e) => setData('distributeur_id', e.target.value)}
                                    style={errors.distributeur_id ? { borderColor: 'var(--status-overdue)' } : {}}
                                    required
                                >
                                    <option value="">— Sélectionner —</option>
                                    {distributeurs.map((d) => (
                                        <option key={d.id} value={String(d.id)}>{d.nom}</option>
                                    ))}
                                </select>
                                {errors.distributeur_id && (
                                    <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                        {errors.distributeur_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="montant_ttc" className="label">
                                    Montant TTC <span style={{ color: 'var(--status-overdue)' }}>*</span>
                                </label>
                                <input
                                    id="montant_ttc"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="input mono"
                                    placeholder="0.00"
                                    value={data.montant_ttc}
                                    onChange={(e) => setData('montant_ttc', e.target.value)}
                                    style={errors.montant_ttc ? { borderColor: 'var(--status-overdue)' } : {}}
                                    required
                                />
                                {errors.montant_ttc && (
                                    <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                        {errors.montant_ttc}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Date d'émission */}
                        <div>
                            <label htmlFor="date_emission" className="label">
                                Date d'émission <span style={{ color: 'var(--status-overdue)' }}>*</span>
                            </label>
                            <input
                                id="date_emission"
                                type="date"
                                className="input"
                                value={data.date_emission}
                                onChange={(e) => setData('date_emission', e.target.value)}
                                style={errors.date_emission ? { borderColor: 'var(--status-overdue)' } : {}}
                                required
                            />
                            {errors.date_emission && (
                                <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                    {errors.date_emission}
                                </p>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <label htmlFor="notes" className="label">
                                Notes{' '}
                                <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span>
                            </label>
                            <textarea
                                id="notes"
                                className="textarea"
                                rows={4}
                                maxLength={2000}
                                placeholder="Informations complémentaires…"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                style={errors.notes ? { borderColor: 'var(--status-overdue)' } : {}}
                            />
                        </div>

                        {/* Note informative */}
                        <p style={{ fontSize: 12.5, color: 'var(--muted)', borderTop: '1px solid var(--hairline)', paddingTop: 16 }}>
                            La référence et la date d'échéance sont calculées automatiquement
                            selon le délai configuré pour le fournisseur.
                        </p>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                            <Link
                                href={isEdit ? `/lettres/${lettre.id}` : '/lettres'}
                                className="btn"
                            >
                                Annuler
                            </Link>
                            <button type="submit" className="btn primary" disabled={processing}>
                                {processing ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
