import { useState, useEffect } from 'react';
import { AppLayout }            from '../components/Layout/AppLayout.jsx';
import { config as mockConfig } from '../data/mock.js';
import { Button }   from '../components/ui/button.jsx';
import { Input }    from '../components/ui/input.jsx';
import { Label }    from '../components/ui/label.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Separator } from '../components/ui/separator.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card.jsx';
import { Building2, Bell, Server, Palette, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ══════════════════════════════════════════════════
   Sous-composant : ligne toggle (on/off)
   Props :
     label   — libellé principal
     sub     — sous-texte (optionnel)
     name    — clé dans formData
     checked — valeur booléenne courante
     onChange — callback (name, newBoolValue)
══════════════════════════════════════════════════ */
function ToggleRow({ label, sub, name, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="space-y-0.5">
        <p className="text-sm font-medium leading-none">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>

      {/* Interrupteur HTML natif — stylisé avec Tailwind peer */}
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(name, e.target.checked)}
          className="sr-only peer"
        />
        {/* Fond du toggle : gris → primary selon l'état */}
        <div className={cn(
          'h-6 w-11 rounded-full bg-muted-foreground/30 transition-colors',
          'peer-checked:bg-primary',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
          "after:content-[''] after:absolute after:top-0.5 after:left-0.5",
          'after:h-5 after:w-5 after:rounded-full after:bg-white',
          'after:shadow-sm after:transition-transform',
          'peer-checked:after:translate-x-5',
        )} />
      </label>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Page principale
══════════════════════════════════════════════════ */
export default function Configuration() {
  /* Copie locale de la config — on modifie cet état */
  const [formData, setFormData] = useState({ ...mockConfig });

  /* ── Réactivité du thème en temps réel ─────────────────────────────
     À chaque changement de hue, sat ou dark, on met à jour les variables
     CSS et la classe `dark` du body. */
  useEffect(() => {
    document.documentElement.style.setProperty('--hue', formData.theme_hue);
    document.documentElement.style.setProperty('--sat', formData.theme_sat + '%');
    document.body.classList.toggle('dark', formData.theme_dark);
  }, [formData.theme_hue, formData.theme_sat, formData.theme_dark]);

  /* ── Helpers de mise à jour ────────────────────────────────────── */

  /* Champ texte / email / tel / password / number */
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  /* Slider (range) → valeur numérique */
  const handleRange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  /* Toggle (checkbox) → valeur booléenne */
  const handleToggle = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /* Soumission — démo uniquement : toast de confirmation */
  const handleSubmit = (e) => {
    e.preventDefault();
    window.__toast('Configuration enregistrée.', 'success');
  };

  return (
    <AppLayout title="Configuration">

      {/* En-tête */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">Paramètres de la librairie</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Tabs de navigation ──────────────────────────────────── */}
        <Tabs defaultValue="librairie" className="space-y-6">

          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="librairie" className="gap-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5" />
              Librairie
            </TabsTrigger>
            <TabsTrigger value="alertes" className="gap-1.5 text-xs">
              <Bell className="h-3.5 w-3.5" />
              Alertes
            </TabsTrigger>
            <TabsTrigger value="smtp" className="gap-1.5 text-xs">
              <Server className="h-3.5 w-3.5" />
              SMTP
            </TabsTrigger>
            <TabsTrigger value="apparence" className="gap-1.5 text-xs">
              <Palette className="h-3.5 w-3.5" />
              Apparence
            </TabsTrigger>
          </TabsList>

          {/* ══ Onglet 1 — Informations de la librairie ══ */}
          <TabsContent value="librairie" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations de la librairie</CardTitle>
                <CardDescription>Coordonnées et identifiants légaux</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nom */}
                  <div className="space-y-1.5">
                    <Label htmlFor="nom_librairie">
                      Nom de la librairie <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nom_librairie"
                      name="nom_librairie"
                      required
                      value={formData.nom_librairie}
                      onChange={handleChange}
                    />
                  </div>
                  {/* SIRET */}
                  <div className="space-y-1.5">
                    <Label htmlFor="siret">SIRET</Label>
                    <Input
                      id="siret"
                      name="siret"
                      className="font-mono"
                      placeholder="14 chiffres"
                      value={formData.siret}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* E-mail */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cfg-email">Adresse e-mail</Label>
                    <Input
                      id="cfg-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  {/* Téléphone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      name="telephone"
                      type="tel"
                      value={formData.telephone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Adresse */}
                <div className="space-y-1.5">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Textarea
                    id="adresse"
                    name="adresse"
                    rows={3}
                    value={formData.adresse}
                    onChange={handleChange}
                  />
                </div>

              </CardContent>
            </Card>

            {/* Délais par défaut */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Délais par défaut</CardTitle>
                <CardDescription>
                  Appliqués si aucun délai n'est défini sur le fournisseur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="delai_commandes_mois">Délai LCR (mois)</Label>
                    <Input
                      id="delai_commandes_mois"
                      name="delai_commandes_mois"
                      type="number"
                      min="1"
                      value={formData.delai_commandes_mois}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="delai_offices_mois">Délai offices (mois)</Label>
                    <Input
                      id="delai_offices_mois"
                      name="delai_offices_mois"
                      type="number"
                      min="1"
                      value={formData.delai_offices_mois}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ Onglet 2 — Alertes e-mail ══ */}
          <TabsContent value="alertes">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alertes e-mail</CardTitle>
                <CardDescription>
                  Notifications automatiques envoyées à votre adresse configurée
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ToggleRow
                  name="alerte_7j"
                  label="7 jours avant une échéance"
                  checked={formData.alerte_7j}
                  onChange={handleToggle}
                />
                <ToggleRow
                  name="alerte_1j"
                  label="1 jour avant une échéance"
                  checked={formData.alerte_1j}
                  onChange={handleToggle}
                />
                <ToggleRow
                  name="alerte_retard"
                  label="Dès qu'une LCR passe en retard"
                  checked={formData.alerte_retard}
                  onChange={handleToggle}
                />
                <ToggleRow
                  name="alerte_retour_expiration"
                  label="Limite de retour d'un office proche"
                  checked={formData.alerte_retour_expiration}
                  onChange={handleToggle}
                />
                <ToggleRow
                  name="alerte_recap_hebdo"
                  label="Récapitulatif hebdomadaire"
                  checked={formData.alerte_recap_hebdo}
                  onChange={handleToggle}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ Onglet 3 — Serveur SMTP ══ */}
          <TabsContent value="smtp">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Serveur d'envoi SMTP</CardTitle>
                <CardDescription>Configuration requise pour l'envoi des alertes e-mail</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="smtp_host">Hôte SMTP</Label>
                    <Input
                      id="smtp_host"
                      name="smtp_host"
                      className="font-mono"
                      placeholder="smtp.exemple.fr"
                      value={formData.smtp_host}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="smtp_port">Port</Label>
                    <Input
                      id="smtp_port"
                      name="smtp_port"
                      type="number"
                      className="font-mono"
                      value={formData.smtp_port}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="smtp_username">Identifiant</Label>
                    <Input
                      id="smtp_username"
                      name="smtp_username"
                      value={formData.smtp_username}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="smtp_password">Mot de passe</Label>
                    <Input
                      id="smtp_password"
                      name="smtp_password"
                      type="password"
                      value={formData.smtp_password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="smtp_from_email">E-mail expéditeur</Label>
                    <Input
                      id="smtp_from_email"
                      name="smtp_from_email"
                      type="email"
                      value={formData.smtp_from_email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="smtp_from_name">Nom expéditeur</Label>
                    <Input
                      id="smtp_from_name"
                      name="smtp_from_name"
                      value={formData.smtp_from_name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <Separator />

                <ToggleRow
                  name="smtp_tls"
                  label="Chiffrement TLS activé"
                  sub="Recommandé pour sécuriser les échanges"
                  checked={formData.smtp_tls}
                  onChange={handleToggle}
                />

              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ Onglet 4 — Apparence ══ */}
          <TabsContent value="apparence">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Apparence</CardTitle>
                <CardDescription>Thème de couleur et mode d'affichage — appliqués en temps réel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Teinte (Hue) */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="theme_hue">Teinte</Label>
                    <span className="text-sm text-muted-foreground font-mono">{formData.theme_hue}°</span>
                  </div>
                  {/* Slider arc-en-ciel pour la teinte */}
                  <input
                    id="theme_hue"
                    type="range"
                    min="0"
                    max="360"
                    value={formData.theme_hue}
                    onChange={(e) => handleRange('theme_hue', e.target.value)}
                    className="w-full h-3 rounded-full cursor-pointer appearance-none"
                    style={{
                      background: 'linear-gradient(to right, hsl(0,80%,50%), hsl(60,80%,50%), hsl(120,80%,50%), hsl(180,80%,50%), hsl(240,80%,50%), hsl(300,80%,50%), hsl(360,80%,50%))',
                    }}
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="theme_sat">Saturation</Label>
                    <span className="text-sm text-muted-foreground font-mono">{formData.theme_sat}%</span>
                  </div>
                  {/* Dégradé du gris vers la couleur saturée */}
                  <input
                    id="theme_sat"
                    type="range"
                    min="0"
                    max="100"
                    value={formData.theme_sat}
                    onChange={(e) => handleRange('theme_sat', e.target.value)}
                    className="w-full h-3 rounded-full cursor-pointer appearance-none"
                    style={{
                      background: `linear-gradient(to right, hsl(${formData.theme_hue}, 0%, 50%), hsl(${formData.theme_hue}, 100%, 40%))`,
                    }}
                  />
                </div>

                <Separator />

                {/* Mode sombre */}
                <ToggleRow
                  name="theme_dark"
                  label="Mode sombre"
                  sub="Thème sombre pour réduire la fatigue oculaire"
                  checked={formData.theme_dark}
                  onChange={handleToggle}
                />

                <Separator />

                {/* Aperçu de la couleur d'accent */}
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg border-2 border-border shrink-0"
                    style={{ background: 'var(--accent)' }}
                  />
                  <p className="text-sm text-muted-foreground">
                    La couleur d'accent s'applique en temps réel sur toute l'interface.
                  </p>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* ── Bouton de sauvegarde ─────────────────────────────────── */}
        <div className="flex justify-end mt-6">
          <Button type="submit" size="lg">
            <Save className="h-4 w-4 mr-2" />
            Enregistrer les modifications
          </Button>
        </div>

      </form>
    </AppLayout>
  );
}
