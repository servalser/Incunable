import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select.jsx';
import { Card, CardContent, CardFooter } from '../../components/ui/card.jsx';

import { lettres, distributeurs } from '../../data/mock.js';

/* ── Helpers de formatage ─────────────────────────────────────── */
const dateFr = (str) =>
  str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ── Formatage d'une date ISO en valeur d'input[type=date] ────── */
/* Les inputs date attendent le format "YYYY-MM-DD" */
const toInputDate = (isoStr) => {
  if (!isoStr) return '';
  return isoStr.substring(0, 10); /* garde uniquement "YYYY-MM-DD" */
};

/* ── Formulaire création / modification de lettre de change ───── */
export default function LettreForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* Si un id est présent dans l'URL → mode édition */
  const isEdit  = Boolean(id);
  const lettre  = isEdit ? lettres.find((l) => l.id === Number(id)) : null;

  /* ── État du formulaire ──────────────────────────────────── */
  /* Initialisé avec les données existantes si édition, sinon valeurs vides */
  const [form, setForm] = useState({
    distributeur_id: lettre ? String(lettre.distributeur.id) : '',
    montant_ttc:     lettre ? String(lettre.montant_ttc)     : '',
    date_emission:   lettre ? toInputDate(lettre.date_emission) : '',
    notes:           lettre ? (lettre.notes ?? '')            : '',
  });

  /* ── Gestion générique des changements de champs ────────── */
  /* Une seule fonction pour tous les champs grâce au nom du champ */
  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ── Soumission (simulée pour la prévisualisation) ──────── */
  const handleSubmit = (e) => {
    e.preventDefault(); /* Empêche le rechargement de page */
    window.__toast('Lettre enregistrée', 'success');
    navigate('/lettres');
  };

  /* ── Titre dynamique selon le mode ─────────────────────── */
  const pageTitle = isEdit
    ? `Modifier ${lettre?.reference ?? `#${id}`}`
    : 'Nouvelle LCR';

  /* ── Lettre introuvable en mode édition ─────────────────── */
  if (isEdit && !lettre) {
    return (
      <AppLayout title="Lettre introuvable">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Lettre introuvable</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Impossible de modifier la lettre{' '}
              <span className="font-mono">#{id}</span> : introuvable.
            </p>
            <Button variant="outline" asChild>
              <Link to="/lettres">← Retour à la liste</Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={pageTitle}>

      {/* ── Fil d'Ariane ────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-sm mb-6">
        <Link className="text-muted-foreground hover:text-foreground transition-colors" to="/lettres">
          Lettres de change
        </Link>
        {isEdit && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Link
              className="text-muted-foreground hover:text-foreground transition-colors"
              to={`/lettres/${id}`}
            >
              {lettre.reference}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-foreground">{isEdit ? 'Modifier' : 'Nouvelle LCR'}</span>
      </div>

      {/* ── En-tête de page ─────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
        {isEdit && (
          <p className="text-sm text-muted-foreground mt-1">
            Dernière modification — {dateFr(lettre.created_at)}
          </p>
        )}
      </div>

      {/* ── Carte formulaire (largeur limitée pour la lisibilité) ── */}
      <div className="max-w-xl">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="pt-6 space-y-5">

              {/* ── Fournisseur ─────────────────────────────── */}
              <div className="space-y-1.5">
                <Label htmlFor="distributeur_id">
                  Fournisseur <span className="text-destructive">*</span>
                </Label>
                {/* Select shadcn — onValueChange reçoit la valeur directement */}
                <Select
                  value={form.distributeur_id}
                  onValueChange={(val) => setField('distributeur_id', val)}
                  required
                >
                  <SelectTrigger id="distributeur_id">
                    <SelectValue placeholder="— Sélectionner un fournisseur —" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Seuls les fournisseurs actifs sont proposés */}
                    {distributeurs
                      .filter((d) => d.actif)
                      .map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.nom}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ── Montant TTC ─────────────────────────────── */}
              <div className="space-y-1.5">
                <Label htmlFor="montant_ttc">
                  Montant TTC (€) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="montant_ttc"
                  type="number"
                  className="font-mono"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={form.montant_ttc}
                  onChange={(e) => setField('montant_ttc', e.target.value)}
                  required
                />
              </div>

              {/* ── Date d'émission ─────────────────────────── */}
              <div className="space-y-1.5">
                <Label htmlFor="date_emission">
                  Date d'émission <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date_emission"
                  type="date"
                  value={form.date_emission}
                  onChange={(e) => setField('date_emission', e.target.value)}
                  required
                />
                {/* Indice explicatif sur le calcul automatique de l'échéance */}
                <p className="text-xs text-muted-foreground">
                  La référence et la date d'échéance sont calculées automatiquement
                  selon le délai du fournisseur.
                </p>
              </div>

              {/* ── Notes ───────────────────────────────────── */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Informations complémentaires (facultatif)…"
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                />
              </div>

            </CardContent>

            {/* ── Pied de carte : boutons Annuler / Enregistrer ── */}
            <CardFooter className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" asChild>
                <Link to={isEdit ? `/lettres/${id}` : '/lettres'}>Annuler</Link>
              </Button>
              <Button type="submit">Enregistrer</Button>
            </CardFooter>

          </Card>
        </form>
      </div>

    </AppLayout>
  );
}
