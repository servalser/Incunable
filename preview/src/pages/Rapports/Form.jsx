import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { Card, CardContent, CardFooter } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select.jsx';
import { Separator } from '../../components/ui/separator.jsx';
import { ChevronRight, FileText, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Constantes ───────────────────────────────────────────────────────── */

/* Mois disponibles pour un rapport mensuel */
const MOIS = [
  { value: '01', label: 'Janvier'   },
  { value: '02', label: 'Février'   },
  { value: '03', label: 'Mars'      },
  { value: '04', label: 'Avril'     },
  { value: '05', label: 'Mai'       },
  { value: '06', label: 'Juin'      },
  { value: '07', label: 'Juillet'   },
  { value: '08', label: 'Août'      },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre'   },
  { value: '11', label: 'Novembre'  },
  { value: '12', label: 'Décembre'  },
];

/* Années disponibles : année courante - 2 jusqu'à l'année courante */
const ANNEE_COURANTE = new Date().getFullYear();
const ANNEES = [ANNEE_COURANTE - 2, ANNEE_COURANTE - 1, ANNEE_COURANTE];

/* ── Formulaire de génération de rapport ───────────────────────────────
   Gère les champs :
   - type         : "mensuel" | "hebdomadaire"
   - mois / annee : pour un rapport mensuel
   - semaine      : pour un rapport hebdomadaire (input type="week")
   - format       : "pdf" | "excel" | "csv"
   - envoyerEmail : boolean */
export default function RapportsForm() {
  const navigate = useNavigate();

  /* ── État du formulaire ──────────────────────────────────────────── */
  const [type,         setType]         = useState('mensuel');
  const [mois,         setMois]         = useState('03');
  const [annee,        setAnnee]        = useState(String(ANNEE_COURANTE));
  const [semaine,      setSemaine]      = useState('');
  const [format,       setFormat]       = useState('pdf');
  const [envoyerEmail, setEnvoyerEmail] = useState(false);

  /* ── Soumission du formulaire ─────────────────────────────────────
     Simulation : toast de confirmation + redirection vers la liste. */
  const handleSubmit = (e) => {
    e.preventDefault();

    /* Validation minimale pour le rapport hebdomadaire */
    if (type === 'hebdomadaire' && !semaine) {
      window.__toast('Veuillez sélectionner une semaine.', 'error');
      return;
    }

    window.__toast('Rapport en cours de génération…', 'success');
    navigate('/rapports');
  };

  return (
    <AppLayout title="Générer un rapport">

      {/* ── Fil d'Ariane ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-sm mb-6 text-muted-foreground">
        <Link to="/rapports" className="hover:text-foreground transition-colors">Rapports</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Nouveau rapport</span>
      </div>

      {/* ── En-tête de page ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Générer un rapport</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configurez les paramètres du rapport à produire
          </p>
        </div>
      </div>

      {/* ── Formulaire centré et limité en largeur ────────────────── */}
      <div className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="pt-6 space-y-5">

              {/* ── Champ 1 : Type de rapport ────────────────────── */}
              <div className="space-y-1.5">
                <Label htmlFor="type">Type de rapport</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensuel">Mensuel</SelectItem>
                    <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {type === 'mensuel'
                    ? "Un rapport couvre l'intégralité du mois sélectionné."
                    : 'Un rapport couvre une semaine calendaire (lundi au dimanche).'}
                </p>
              </div>

              {/* ── Champ 2 : Période ─────────────────────────────
                  Affichage conditionnel selon le type :
                  - Mensuel    → sélecteur mois + année côte à côte
                  - Hebdomain → input type="week" (sélection de semaine ISO) */}
              {type === 'mensuel' ? (
                <div className="space-y-1.5">
                  <Label>Période</Label>
                  <div className="flex gap-2">
                    <Select value={mois} onValueChange={setMois}>
                      <SelectTrigger aria-label="Mois" className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MOIS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={annee} onValueChange={setAnnee}>
                      <SelectTrigger aria-label="Année" className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ANNEES.map((a) => (
                          <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="semaine">Semaine</Label>
                  {/* input type="week" → format "2025-W16" (ISO 8601) */}
                  <Input
                    id="semaine"
                    type="week"
                    value={semaine}
                    onChange={(e) => setSemaine(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez la semaine à analyser.
                  </p>
                </div>
              )}

              {/* ── Champ 3 : Format d'export ────────────────────── */}
              <div className="space-y-1.5">
                <Label htmlFor="format">Format d'export</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Le fichier sera disponible en téléchargement une fois généré.
                </p>
              </div>

              <Separator />

              {/* ── Champ 4 : Envoi par e-mail ───────────────────── */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={envoyerEmail}
                  onChange={(e) => setEnvoyerEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium leading-none">
                    Envoyer par e-mail après génération
                  </span>
                </div>
              </label>
              {/* Avertissement si SMTP non configuré */}
              {envoyerEmail && (
                <p className="text-xs text-muted-foreground pl-7">
                  L'e-mail sera envoyé à l'adresse configurée dans les paramètres SMTP.
                </p>
              )}

            </CardContent>

            {/* ── Boutons d'action ──────────────────────────────────── */}
            <CardFooter className="flex gap-2 justify-end border-t pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/rapports')}>
                Annuler
              </Button>
              <Button type="submit">
                <FileText className="h-4 w-4 mr-2" />
                Générer le rapport
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>

    </AppLayout>
  );
}
