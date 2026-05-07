/**
 * Offices/Form — formulaire de création et de modification d'un office.
 *
 * Props :
 *   office        — null (création) ou { id, reference, distributeur_id, type,
 *                   montant_ttc, date_reception, notes }
 *   distributeurs — tableau { id, nom }
 */

import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft }           from 'lucide-react';
import { AppLayout }           from '../../Components/Layout/AppLayout';

export default function OfficeForm({ office, distributeurs }) {
    const isEdit = !!office;

    const { data, setData, post, put, processing, errors } = useForm({
        distributeur_id: office?.distributeur_id ? String(office.distributeur_id) : '',
        type:            office?.type            ?? '',
        montant_ttc:     office?.montant_ttc     ?? '',
        date_reception:  office?.date_reception  ?? '',
        notes:           office?.notes           ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        isEdit ? put(`/offices/${office.id}`) : post('/offices');
    };

    return (
        <AppLayout title={isEdit ? `Modifier ${office.reference}` : 'Nouvel office'}>
            <Head title={isEdit ? `Modifier ${office.reference}` : 'Nouvel office'} />

            {/* ── Bouton retour ── */}
            <Link
                href={isEdit ? `/offices/${office.id}` : '/offices'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', marginBottom: 20, textDecoration: 'none' }}
            >
                <ArrowLeft size={14} />
                {isEdit ? office.reference : 'Offices'}
            </Link>

            {/* ── En-tête ── */}
            <div className="page-head" style={{ marginBottom: 24 }}>
                <div>
                    <h1 className="page-title">
                        {isEdit ? `Modifier ${office.reference}` : 'Nouvelle office'}
                    </h1>
                </div>
            </div>

            {/* ── Formulaire ── */}
            <div className="card" style={{ maxWidth: 560 }}>
                <div className="card-head">
                    <h2 className="section-title" style={{ margin: 0 }}>
                        {isEdit ? 'Modifier les informations' : "Informations de l'office"}
                    </h2>
                </div>

                <form onSubmit={submit} noValidate style={{ padding: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Fournisseur + Type */}
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
                                <label htmlFor="type" className="label">
                                    Type <span style={{ color: 'var(--status-overdue)' }}>*</span>
                                </label>
                                <select
                                    id="type"
                                    className="select"
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    style={errors.type ? { borderColor: 'var(--status-overdue)' } : {}}
                                    required
                                >
                                    <option value="">— Sélectionner —</option>
                                    <option value="facon">À façon</option>
                                    <option value="grille">Sur grille</option>
                                    <option value="exceptionnel">Exceptionnel</option>
                                </select>
                                {errors.type && (
                                    <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                        {errors.type}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Montant TTC + Date de réception */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                                    value={data.montant_ttc}
                                    onChange={(e) => setData('montant_ttc', e.target.value)}
                                    placeholder="0.00"
                                    style={errors.montant_ttc ? { borderColor: 'var(--status-overdue)' } : {}}
                                    required
                                />
                                {errors.montant_ttc && (
                                    <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                        {errors.montant_ttc}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="date_reception" className="label">
                                    Date de réception <span style={{ color: 'var(--status-overdue)' }}>*</span>
                                </label>
                                <input
                                    id="date_reception"
                                    type="date"
                                    className="input"
                                    value={data.date_reception}
                                    onChange={(e) => setData('date_reception', e.target.value)}
                                    style={errors.date_reception ? { borderColor: 'var(--status-overdue)' } : {}}
                                    required
                                />
                                {errors.date_reception && (
                                    <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                        {errors.date_reception}
                                    </p>
                                )}
                            </div>
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
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Informations complémentaires sur cet office…"
                                style={errors.notes ? { borderColor: 'var(--status-overdue)' } : {}}
                            />
                        </div>

                        {/* Note informative */}
                        <p style={{ fontSize: 12.5, color: 'var(--muted)', borderTop: '1px solid var(--hairline)', paddingTop: 16 }}>
                            La référence et la date limite de retour sont calculées automatiquement
                            selon le délai configuré pour le fournisseur.
                        </p>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                            <Link
                                href={isEdit ? `/offices/${office.id}` : '/offices'}
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
