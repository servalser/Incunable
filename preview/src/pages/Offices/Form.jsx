import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select.jsx';
import { Card, CardContent, CardFooter } from '../../components/ui/card.jsx';

import { offices, distributeurs } from '../../data/mock.js';

export default function OfficesForm() {
  const { id }   = useParams();
  const navigate = useNavigate();

  /* isEdit = true si un id est présent dans l'URL */
  const isEdit = Boolean(id);

  /* Cherche l'office existante si on est en mode édition */
  const existing = isEdit ? offices.find((o) => String(o.id) === id) : null;

  /* ── État du formulaire ── */
  const [form, setForm] = useState({
    distributeur_id: existing?.distributeur?.id  ? String(existing.distributeur.id) : '',
    type:            existing?.type              ?? 'facon',
    montant_ttc:     existing?.montant_ttc       ?? '',
    date_reception:  existing?.date_reception    ?? '',
    notes:           existing?.notes             ?? '',
  });

  /* ── Erreurs de validation locale ── */
  const [errors, setErrors] = useState({});

  /* Met à jour un champ du formulaire et efface son erreur */
  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    /* Efface l'erreur du champ modifié */
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    if (!form.distributeur_id) errs.distributeur_id = 'Veuillez sélectionner un fournisseur.';
    if (!form.type)            errs.type            = 'Veuillez choisir un type.';
    if (!form.montant_ttc || parseFloat(form.montant_ttc) <= 0)
      errs.montant_ttc = 'Le montant doit être supérieur à 0.';
    if (!form.date_reception)  errs.date_reception  = 'La date de réception est requise.';
    return errs;
  };

  /* ── Soumission ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    /* Simulation : toast + retour à la liste */
    window.__toast(
      isEdit ? 'Office mise à jour.' : 'Office créée avec succès.',
      'success'
    );
    navigate('/offices');
  };

  return (
    <AppLayout title={isEdit ? `Modifier ${existing?.reference ?? 'office'}` : 'Nouvelle office'}>

      {/* ── Fil d'Ariane ── */}
      <div className="flex items-center gap-1.5 text-sm mb-6">
        <Link className="text-muted-foreground hover:text-foreground transition-colors" to="/offices">
          Offices
        </Link>
        {isEdit && existing && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Link
              className="text-muted-foreground hover:text-foreground transition-colors"
              to={`/offices/${id}`}
            >
              {existing.reference}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-foreground">{isEdit ? 'Modifier' : 'Nouvelle office'}</span>
      </div>

      {/* ── En-tête ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? `Modifier ${existing?.reference ?? "l'office"}` : 'Nouvelle office'}
        </h1>
      </div>

      {/* ── Formulaire dans une carte centrée ── */}
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} noValidate>
          <Card>
            <CardContent className="pt-6 space-y-5">

              {/* Fournisseur */}
              <div className="space-y-1.5">
                <Label htmlFor="distributeur_id">
                  Fournisseur <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.distributeur_id}
                  onValueChange={(val) => setField('distributeur_id', val)}
                >
                  <SelectTrigger id="distributeur_id">
                    <SelectValue placeholder="— Sélectionner un fournisseur —" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* On n'affiche que les fournisseurs actifs */}
                    {distributeurs
                      .filter((d) => d.actif)
                      .map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.nom}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.distributeur_id && (
                  <p className="text-xs text-destructive">{errors.distributeur_id}</p>
                )}
              </div>

              {/* Type d'office */}
              <div className="space-y-1.5">
                <Label htmlFor="type">
                  Type d'office <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => setField('type', val)}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facon">À façon</SelectItem>
                    <SelectItem value="grille">Sur grille</SelectItem>
                    <SelectItem value="exceptionnel">Exceptionnel</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-xs text-destructive">{errors.type}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  «&nbsp;À façon&nbsp;» = retour intégral possible ·
                  «&nbsp;Sur grille&nbsp;» = taux de retour plafonné ·
                  «&nbsp;Exceptionnel&nbsp;» = office ponctuelle hors contrat
                </p>
              </div>

              {/* Montant TTC */}
              <div className="space-y-1.5">
                <Label htmlFor="montant_ttc">
                  Montant TTC (€) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="montant_ttc"
                  type="number"
                  min="0"
                  step="0.01"
                  className="font-mono"
                  placeholder="0,00"
                  value={form.montant_ttc}
                  onChange={(e) => setField('montant_ttc', e.target.value)}
                />
                {errors.montant_ttc && (
                  <p className="text-xs text-destructive">{errors.montant_ttc}</p>
                )}
              </div>

              {/* Date de réception */}
              <div className="space-y-1.5">
                <Label htmlFor="date_reception">
                  Date de réception <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date_reception"
                  type="date"
                  value={form.date_reception}
                  onChange={(e) => setField('date_reception', e.target.value)}
                />
                {errors.date_reception && (
                  <p className="text-xs text-destructive">{errors.date_reception}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  La date limite de retour sera calculée automatiquement selon le délai du fournisseur.
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Informations complémentaires, contexte de la commande…"
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                />
              </div>

            </CardContent>

            {/* ── Actions ── */}
            <CardFooter className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" asChild>
                <Link to={isEdit && id ? `/offices/${id}` : '/offices'}>Annuler</Link>
              </Button>
              <Button type="submit">
                {isEdit ? 'Enregistrer les modifications' : "Créer l'office"}
              </Button>
            </CardFooter>

          </Card>
        </form>
      </div>

    </AppLayout>
  );
}
