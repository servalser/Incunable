import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { livres, distributeurs } from '../../data/mock.js';

/* Composants shadcn */
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Card, CardContent, CardFooter } from '../../components/ui/card.jsx';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '../../components/ui/select.jsx';
import { Separator } from '../../components/ui/separator.jsx';

/* Icônes Lucide */
import { ChevronRight, Search } from 'lucide-react';

/* ─── Helpers de formatage ─────────────────────────────────── */
const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ─── Formulaire création / modification d'un livre ─────────
   Mode édition   : l'URL contient un :id → on pré-remplit les champs
   Mode création  : l'URL est /stock/creer → tous les champs sont vides
──────────────────────────────────────────────────────────── */
export default function StockForm() {
  const { id }   = useParams();
  const navigate = useNavigate();

  /* Si un id est présent → mode édition */
  const isEdit = Boolean(id);
  const livre  = isEdit ? livres.find((l) => l.id === Number(id)) : null;

  /* ── État du formulaire ─────────────────────────────────────
     Chaque clé correspond à un champ HTML (attribut `name`).
     En mode édition, on initialise avec les données existantes.
     En mode création, tout est vide / valeur par défaut.
  ────────────────────────────────────────────────────────── */
  const [form, setForm] = useState({
    isbn:            livre ? livre.isbn              : '',
    titre:           livre ? livre.titre             : '',
    auteur:          livre ? livre.auteur            : '',
    editeur:         livre ? livre.editeur           : '',
    categorie:       livre ? livre.categorie         : 'none',   // 'none' = non sélectionné
    distributeur_id: livre ? String(livre.distributeur.id) : 'none', // 'none' = non sélectionné
    prix_ttc:        livre ? String(livre.prix_ttc)  : '',
    seuil_alerte:    livre ? String(livre.seuil_alerte) : '',
    notes:           '',  /* champ non stocké dans le mock, toujours vide */
  });

  /* ── Gestion générique des changements pour les <input> et <textarea> ──
     Toutes les mises à jour passent par ce handler unique.
     L'attribut `name` de l'input est utilisé comme clé du state.
  ────────────────────────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ── Gestion des <Select> shadcn ────────────────────────────
     Les composants Select shadcn appellent onValueChange(value)
     plutôt que onChange(event), on a donc un handler dédié.
  ────────────────────────────────────────────────────────── */
  const handleSelectChange = (name) => (value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ── Soumission simulée ────────────────────────────────────
     Dans la preview il n'y a pas de backend, on affiche juste
     un toast et on redirige vers la liste.
  ────────────────────────────────────────────────────────── */
  const handleSubmit = (e) => {
    e.preventDefault(); /* empêche le rechargement de page par défaut */
    const msg = isEdit
      ? `"${form.titre}" mis à jour.`
      : `"${form.titre}" ajouté au catalogue.`;
    window.__toast(msg, 'success');
    navigate('/stock');
  };

  /* ── Titre de page dynamique ── */
  const pageTitle = isEdit
    ? `Modifier — ${livre?.titre ?? `#${id}`}`
    : 'Ajouter un livre';

  /* ── Livre introuvable en mode édition ─────────────────── */
  if (isEdit && !livre) {
    return (
      <AppLayout title="Livre introuvable">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Livre introuvable</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              Impossible de modifier le livre{' '}
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-sm">#{id}</code> : introuvable.
            </p>
            <Button variant="outline" asChild>
              <Link to="/stock">← Retour au catalogue</Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={pageTitle}>

      {/* ── Fil d'Ariane ── */}
      <div className="flex items-center gap-1.5 text-sm mb-6">
        <Link className="text-muted-foreground hover:text-foreground transition-colors" to="/stock">
          Stock
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        {isEdit ? (
          <>
            <Link
              className="text-muted-foreground hover:text-foreground transition-colors"
              to={`/stock/${id}`}
            >
              {livre.titre}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-foreground">Modifier</span>
          </>
        ) : (
          <span className="text-foreground">Ajouter un livre</span>
        )}
      </div>

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
          {isEdit && (
            <p className="text-sm text-muted-foreground mt-1">
              Référencé le {dateFr(livre.created_at)}
            </p>
          )}
        </div>
      </div>

      {/* ── Formulaire (largeur limitée à 680px pour la lisibilité) ── */}
      <div className="max-w-[680px]">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="pt-6 space-y-6">

              {/* ─── ISBN + bouton recherche Google Books ─────────────
                  Le bouton "Rechercher" est prévu pour une future intégration
                  de l'API Google Books (auto-remplissage des champs).
              ──────────────────────────────────────────────────────── */}
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                {/* Ligne horizontale : input ISBN + bouton recherche côte à côte */}
                <div className="flex gap-2 items-center">
                  <Input
                    id="isbn"
                    name="isbn"
                    type="text"
                    placeholder="9782070360024"
                    maxLength={13}
                    value={form.isbn}
                    onChange={handleChange}
                    className="flex-1 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      window.__toast(
                        'Recherche Google Books — disponible après configuration API',
                        'info'
                      )
                    }
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Entrez l'ISBN-13 pour rechercher automatiquement les informations du livre.
                </p>
              </div>

              <Separator />

              {/* ─── Ligne titre / auteur (deux champs côte à côte) ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label htmlFor="titre">
                    Titre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="titre"
                    name="titre"
                    type="text"
                    placeholder="Titre du livre"
                    value={form.titre}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auteur">
                    Auteur <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="auteur"
                    name="auteur"
                    type="text"
                    placeholder="Prénom NOM"
                    value={form.auteur}
                    onChange={handleChange}
                    required
                  />
                </div>

              </div>

              {/* ─── Éditeur ── */}
              <div className="space-y-2">
                <Label htmlFor="editeur">Éditeur</Label>
                <Input
                  id="editeur"
                  name="editeur"
                  type="text"
                  placeholder="Maison d'édition"
                  value={form.editeur}
                  onChange={handleChange}
                />
              </div>

              <Separator />

              {/* ─── Ligne catégorie / fournisseur ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie</Label>
                  <Select
                    value={form.categorie}
                    onValueChange={handleSelectChange('categorie')}
                  >
                    <SelectTrigger id="categorie">
                      <SelectValue placeholder="— Sélectionner —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Sélectionner —</SelectItem>
                      <SelectItem value="Roman">Roman</SelectItem>
                      <SelectItem value="Classique">Classique</SelectItem>
                      <SelectItem value="SF">SF</SelectItem>
                      <SelectItem value="Jeunesse">Jeunesse</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distributeur_id">
                    Fournisseur <span className="text-destructive">*</span>
                  </Label>
                  {/* On propose uniquement les distributeurs actifs (actif: true) */}
                  <Select
                    value={form.distributeur_id}
                    onValueChange={handleSelectChange('distributeur_id')}
                    required
                  >
                    <SelectTrigger id="distributeur_id">
                      <SelectValue placeholder="— Sélectionner un fournisseur —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Sélectionner un fournisseur —</SelectItem>
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

              </div>

              <Separator />

              {/* ─── Ligne prix TTC / seuil d'alerte ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label htmlFor="prix_ttc">
                    Prix TTC (€) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="prix_ttc"
                    name="prix_ttc"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={form.prix_ttc}
                    onChange={handleChange}
                    className="font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seuil_alerte">Seuil d'alerte (ex.)</Label>
                  <Input
                    id="seuil_alerte"
                    name="seuil_alerte"
                    type="number"
                    placeholder="3"
                    min="0"
                    step="1"
                    value={form.seuil_alerte}
                    onChange={handleChange}
                    className="font-mono"
                  />
                  {/* Explication du seuil pour guider l'utilisateur */}
                  <p className="text-xs text-muted-foreground">
                    En dessous de ce seuil, le stock passe en alerte orange.
                  </p>
                </div>

              </div>

              <Separator />

              {/* ─── Notes libres ── */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Informations complémentaires, observations… (facultatif)"
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>

            </CardContent>

            {/* ── Pied de carte : boutons Annuler / Enregistrer ── */}
            <CardFooter className="flex justify-end gap-3 border-t pt-4">
              {/* "Annuler" retourne à la fiche détail en mode édition, sinon à la liste */}
              <Button variant="outline" asChild>
                <Link to={isEdit ? `/stock/${id}` : '/stock'}>
                  Annuler
                </Link>
              </Button>

              <Button type="submit">
                {isEdit ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}
              </Button>
            </CardFooter>

          </Card>
        </form>
      </div>

    </AppLayout>
  );
}
