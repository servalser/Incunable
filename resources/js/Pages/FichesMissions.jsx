import { Head }       from '@inertiajs/react';
import { AppLayout } from '../Components/Layout/AppLayout';
import { Target }    from 'lucide-react';

export default function FichesMissions() {
    return (
        <AppLayout title="Fiches missions">
            <Head title="Fiches missions" />

            <div className="page-head">
                <div>
                    <h1 className="page-title">Fiches missions</h1>
                    <p className="page-sub">Suivi des missions et objectifs</p>
                </div>
            </div>

            <div className="card">
                <div className="empty-state" style={{ padding: '80px 20px' }}>
                    <Target size={40} style={{ color: 'var(--muted-2)' }} aria-hidden="true" />
                    <p style={{ fontWeight: 600, color: 'var(--ink)' }}>Module en cours de développement</p>
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                        Les fiches missions seront disponibles prochainement.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
