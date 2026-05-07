import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';

import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Avatar, AvatarFallback } from '../../components/ui/avatar.jsx';
import { Modal, ModalBody, ModalFooter } from '../../components/ui/Modal.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { Card, CardContent } from '../../components/ui/card.jsx';

import { distributeurs as mockDistributeurs } from '../../data/mock.js';

/* ─── Formulaire vide (pour la création) ──────────────────── */
const EMPTY_FORM = {
  nom:                  '',
  email:                '',
  telephone:            '',
  delai_commandes_mois: '',
  delai_offices_mois:   '',
  iban:                 '',
};

export default function DistributeursIndex() {

  /* ── Copie locale de la liste (pour simuler ajout / modif / toggle) */
  const [items, setItems] = useState(() =>
    mockDistributeurs.map((d) => ({ ...d }))
  );

  /* ── Modal création / édition ── */
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState(null); /* null = création */
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  /* ── Confirmation désactiver / réactiver ── */
  const [toggleTarget, setToggleTarget] = useState(null);

  /* ── Ouvre le modal en mode création ── */
  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  /* ── Ouvre le modal en mode édition ── */
  const openEdit = (distrib) => {
    setEditTarget(distrib);
    setForm({
      nom:                  distrib.nom                  ?? '',
      email:                distrib.email                ?? '',
      telephone:            distrib.telephone            ?? '',
      delai_commandes_mois: distrib.delai_commandes_mois ?? '',
      delai_offices_mois:   distrib.delai_offices_mois   ?? '',
      iban:                 distrib.iban                 ?? '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  /* ── Met à jour un champ du formulaire ── */
  const setField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  /* ── Validation basique ── */
  const validate = () => {
    const errs = {};
    if (!form.nom.trim()) errs.nom = 'Le nom est requis.';
    if (form.delai_commandes_mois && (Number(form.delai_commandes_mois) < 1 || Number(form.delai_commandes_mois) > 24))
      errs.delai_commandes_mois = 'Délai entre 1 et 24 mois.';
    if (form.delai_offices_mois && (Number(form.delai_offices_mois) < 1 || Number(form.delai_offices_mois) > 24))
      errs.delai_offices_mois = 'Délai entre 1 et 24 mois.';
    return errs;
  };

  /* ── Soumission du formulaire ── */
  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    if (editTarget) {
      /* Mise à jour */
      setItems((prev) => prev.map((d) =>
        d.id === editTarget.id
          ? {
              ...d,
              nom:                  form.nom.trim(),
              email:                form.email.trim(),
              telephone:            form.telephone.trim(),
              delai_commandes_mois: form.delai_commandes_mois ? Number(form.delai_commandes_mois) : null,
              delai_offices_mois:   form.delai_offices_mois   ? Number(form.delai_offices_mois)   : null,
              iban:                 form.iban.trim(),
            }
          : d
      ));
    } else {
      /* Création — génère un id temporaire */
      const newId = Math.max(...items.map((d) => d.id)) + 1;
      setItems((prev) => [...prev, {
        id:                   newId,
        nom:                  form.nom.trim(),
        email:                form.email.trim(),
        telephone:            form.telephone.trim(),
        delai_commandes_mois: form.delai_commandes_mois ? Number(form.delai_commandes_mois) : null,
        delai_offices_mois:   form.delai_offices_mois   ? Number(form.delai_offices_mois)   : null,
        iban:                 form.iban.trim(),
        actif:                true,
        nb_lettres_actives:   0,
        nb_offices_actifs:    0,
      }]);
    }

    window.__toast('Fournisseur enregistré.', 'success');
    setModalOpen(false);
  };

  /* ── Toggle actif / inactif ── */
  const handleToggleConfirm = () => {
    setItems((prev) => prev.map((d) =>
      d.id === toggleTarget.id ? { ...d, actif: !d.actif } : d
    ));
    const verb = toggleTarget.actif ? 'désactivé' : 'réactivé';
    window.__toast(`Fournisseur ${verb}.`, 'success');
    setToggleTarget(null);
  };

  return (
    <AppLayout title="Fournisseurs">

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fournisseurs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} fournisseur{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* ── Grille de cartes distributeurs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((d) => (
          <Card
            key={d.id}
            className={d.actif ? '' : 'opacity-60'}
          >
            <CardContent className="pt-5 flex flex-col gap-4">

              {/* Top : avatar + nom + email */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar avec la première lettre du nom */}
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {d.nom.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{d.nom}</span>
                    {/* Badge "Inactif" affiché si le fournisseur n'est pas actif */}
                    {!d.actif && (
                      <Badge variant="neutral">Inactif</Badge>
                    )}
                  </div>
                  {d.email && (
                    <p className="text-xs text-muted-foreground truncate">{d.email}</p>
                  )}
                </div>
              </div>

              {/* Chips : délais LCR et Offices */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                  LCR&nbsp;: {d.delai_commandes_mois ? `${d.delai_commandes_mois} mois` : 'défaut'}
                </span>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                  OFF&nbsp;: {d.delai_offices_mois ? `${d.delai_offices_mois} mois` : 'défaut'}
                </span>
              </div>

              {/* Compteurs LCR / Offices actives */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">{d.nb_lettres_actives}</strong> LCR actives
                </span>
                <span>
                  <strong className="text-foreground">{d.nb_offices_actifs}</strong> offices actives
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEdit(d)}
                >
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setToggleTarget(d)}
                >
                  {d.actif ? 'Désactiver' : 'Réactiver'}
                </Button>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Modal : Créer / Modifier un fournisseur ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? `Modifier ${editTarget.nom}` : 'Ajouter un fournisseur'}
      >
        <ModalBody>
          <div className="space-y-4">

            {/* Nom */}
            <div className="space-y-1.5">
              <Label htmlFor="d-nom">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="d-nom"
                type="text"
                placeholder="Ex. Hachette Livre"
                value={form.nom}
                onChange={(e) => setField('nom', e.target.value)}
              />
              {formErrors.nom && (
                <p className="text-xs text-destructive">{formErrors.nom}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="d-email">E-mail</Label>
              <Input
                id="d-email"
                type="email"
                placeholder="commandes@fournisseur.fr"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-1.5">
              <Label htmlFor="d-tel">Téléphone</Label>
              <Input
                id="d-tel"
                type="tel"
                placeholder="01 23 45 67 89"
                value={form.telephone}
                onChange={(e) => setField('telephone', e.target.value)}
              />
            </div>

            {/* Délais sur deux colonnes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="d-delai-commandes">Délai LCR (mois)</Label>
                <Input
                  id="d-delai-commandes"
                  type="number"
                  min="1"
                  max="24"
                  placeholder="Défaut"
                  value={form.delai_commandes_mois}
                  onChange={(e) => setField('delai_commandes_mois', e.target.value)}
                />
                {formErrors.delai_commandes_mois && (
                  <p className="text-xs text-destructive">{formErrors.delai_commandes_mois}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-delai-offices">Délai offices (mois)</Label>
                <Input
                  id="d-delai-offices"
                  type="number"
                  min="1"
                  max="24"
                  placeholder="Défaut"
                  value={form.delai_offices_mois}
                  onChange={(e) => setField('delai_offices_mois', e.target.value)}
                />
                {formErrors.delai_offices_mois && (
                  <p className="text-xs text-destructive">{formErrors.delai_offices_mois}</p>
                )}
              </div>
            </div>

            {/* IBAN */}
            <div className="space-y-1.5">
              <Label htmlFor="d-iban">IBAN</Label>
              <Input
                id="d-iban"
                type="text"
                className="font-mono"
                placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                value={form.iban}
                onChange={(e) => setField('iban', e.target.value)}
              />
            </div>

          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleSave}>
            {editTarget ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Confirmation désactiver / réactiver ── */}
      <ConfirmDialog
        open={!!toggleTarget}
        message={
          toggleTarget?.actif
            ? `Désactiver ${toggleTarget?.nom} ? Il n'apparaîtra plus dans les listes de sélection.`
            : `Réactiver ${toggleTarget?.nom} ?`
        }
        confirmLabel={toggleTarget?.actif ? 'Désactiver' : 'Réactiver'}
        danger={toggleTarget?.actif}
        onConfirm={handleToggleConfirm}
        onCancel={() => setToggleTarget(null)}
      />

    </AppLayout>
  );
}
