import { Head }       from '@inertiajs/react';
import { AppLayout } from '../Components/Layout/AppLayout';
import { Package }   from 'lucide-react';

export default function Stock() {
    return (
        <AppLayout title="Stock">
            <Head title="Stock" />

            <div className="page-head">
                <div>
                    <h1 className="page-title">Stock</h1>
                    <p className="page-sub">Gestion des titres en stock</p>
                </div>
            </div>

            <div className="card">
                <div className="empty-state" style={{ padding: '80px 20px' }}>
                    <Package size={40} style={{ color: 'var(--muted-2)' }} aria-hidden="true" />
                    <p style={{ fontWeight: 600, color: 'var(--ink)' }}>Module en cours de développement</p>
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                        La gestion du stock sera disponible prochainement.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
