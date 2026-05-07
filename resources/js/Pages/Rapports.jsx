import { Head }       from '@inertiajs/react';
import { AppLayout } from '../Components/Layout/AppLayout';
import { BarChart2 } from 'lucide-react';

export default function Rapports() {
    return (
        <AppLayout title="Rapports">
            <Head title="Rapports" />

            <div className="page-head">
                <div>
                    <h1 className="page-title">Rapports</h1>
                    <p className="page-sub">Analyses et exports financiers</p>
                </div>
            </div>

            <div className="card">
                <div className="empty-state" style={{ padding: '80px 20px' }}>
                    <BarChart2 size={40} style={{ color: 'var(--muted-2)' }} aria-hidden="true" />
                    <p style={{ fontWeight: 600, color: 'var(--ink)' }}>Module en cours de développement</p>
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                        Les rapports et exports seront disponibles prochainement.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
