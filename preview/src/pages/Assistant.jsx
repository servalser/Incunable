import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '../components/Layout/AppLayout.jsx';
import {
  messages_ia_initiaux,
  livres,
  lettres,
  fiches_missions,
} from '../data/mock.js';
import { Button } from '../components/ui/button.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Avatar, AvatarFallback } from '../components/ui/avatar.jsx';
import { ScrollArea } from '../components/ui/scroll-area.jsx';
import { Separator } from '../components/ui/separator.jsx';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Helpers de formatage ─────────────────────────────────────────────── */

/* Formate une date ISO complète (date + heure) */
const dateHeureFr = (str) =>
  str
    ? new Date(str).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

/* ── Génération des réponses simulées ─────────────────────────────────────
   Simule des réponses pertinentes selon les mots-clés du message.
   En production, on ferait un appel API vers un vrai LLM. */
function genererReponse(messageUtilisateur) {
  const msg = messageUtilisateur.toLowerCase();

  /* ── Cas 1 : ruptures de stock ── */
  if (msg.includes('rupture') || msg.includes('stock') || msg.includes('manque')) {
    const enRupture = livres.filter((l) => l.quantite === 0);
    if (enRupture.length === 0) {
      return "Bonne nouvelle ! Aucun titre n'est actuellement en rupture de stock dans votre catalogue.";
    }
    const liste = enRupture
      .map((l) => `• **${l.titre}** (${l.auteur}) — ${l.quantite_commandee > 0 ? `${l.quantite_commandee} ex. en commande` : 'aucune commande en cours'}`)
      .join('\n');
    return `J'ai trouvé ${enRupture.length} titre${enRupture.length > 1 ? 's' : ''} en rupture de stock :\n\n${liste}\n\nJe vous recommande de passer commande rapidement pour les titres sans réassort en cours.`;
  }

  /* ── Cas 2 : lettres de change ── */
  if (msg.includes('lcr') || msg.includes('lettre') || msg.includes('retard') || msg.includes('paiement')) {
    const enRetard = lettres.filter((l) => l.statut === 'en_retard');
    const proches  = lettres.filter((l) => l.jours_restants >= 0 && l.jours_restants <= 7);
    let reponse = '';
    if (enRetard.length > 0) {
      const euro = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
      const totalRetard = enRetard.reduce((sum, l) => sum + l.montant_ttc, 0);
      const liste = enRetard
        .map((l) => `• **${l.reference}** — ${l.distributeur.nom} — ${euro(l.montant_ttc)} (${Math.abs(l.jours_restants)} jours de retard)`)
        .join('\n');
      reponse += `**${enRetard.length} lettre${enRetard.length > 1 ? 's' : ''} de change en retard** pour un total de ${euro(totalRetard)} :\n\n${liste}\n\n`;
    } else {
      reponse += "Aucune lettre de change n'est actuellement en retard. ";
    }
    if (proches.length > 0) {
      reponse += `**Attention :** ${proches.length} lettre${proches.length > 1 ? 's arrivent' : ' arrive'} à échéance dans moins de 7 jours.`;
    }
    return reponse || 'Toutes vos lettres de change sont à jour. Excellent suivi !';
  }

  /* ── Cas 3 : ventes ou rapports ── */
  if (msg.includes('vente') || msg.includes('mars') || msg.includes('rapport') || msg.includes('chiffre')) {
    return `Voici un résumé de vos ventes sur mars 2025 :

**Chiffre d'affaires LCR** : 3 100 € (−38 % vs février)
**Offices actifs** : 4 400 € de montant net

**Titres les plus vendus ce mois** :
• Harry Potter à l'école des sorciers — 24 exemplaires
• Dune — 15 exemplaires
• Le Petit Prince — 12 exemplaires

**Tendance globale** : légère baisse saisonnière classique pour mars. Les ventes devraient reprendre en avril avec les vacances scolaires.`;
  }

  /* ── Cas 4 : recommandations ── */
  if (msg.includes('recommand') || msg.includes('conseil') || msg.includes('fiche') || msg.includes('réassort')) {
    const hautePriorite = fiches_missions.filter((f) => f.statut === 'non_traite' && f.priorite === 'haute');
    const nonTraitees   = fiches_missions.filter((f) => f.statut === 'non_traite');
    return `J'ai analysé les données du réseau de librairies partenaires. Voici mes recommandations prioritaires :

${hautePriorite.map((f) => `• **${f.titre}** — score ${f.score}/100 — ${f.ventes_moy_reseau_mois} ventes/mois dans le réseau vs ${f.ventes_librairie_mois} chez vous`).join('\n')}

${nonTraitees.length > 0 ? `Au total, vous avez **${nonTraitees.length} fiche${nonTraitees.length > 1 ? 's' : ''} mission non traitée${nonTraitees.length > 1 ? 's' : ''}** en attente de votre décision.` : ''}

Rendez-vous dans la section **Fiches Missions** pour consulter l'analyse complète et prendre vos décisions de commande.`;
  }

  /* ── Cas 5 : réponse générique ── */
  return `Je suis là pour vous aider à gérer votre librairie au mieux.

Voici ce que je peux analyser pour vous :
• L'état de vos **lettres de change** et paiements en retard
• Vos **ruptures de stock** et titres à réassortir
• Les **recommandations cross-réseau** dans les Fiches Missions
• Un résumé de vos **ventes** par période

N'hésitez pas à me poser une question plus précise ou à utiliser les suggestions rapides.`;
}

/* ── Indicateur "en train d'écrire" (trois points animés) ────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
          style={{ animation: `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite` }}
        />
      ))}
      {/* Keyframes injectées via un style tag inline — méthode simple sans CSS-in-JS */}
      <style>{`
        @keyframes typing-dot {
          0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
          40%            { opacity: 1;   transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

/* ── Bulle de message ─────────────────────────────────────────────────────
   role="user"      → alignée à droite, fond primary
   role="assistant" → alignée à gauche, fond muted */
function BulleMessage({ message }) {
  const estUser = message.role === 'user';

  return (
    <div className={cn('flex items-end gap-2.5 mb-4', estUser && 'flex-row-reverse')}>

      {/* Avatar de l'assistant uniquement */}
      {!estUser && (
        <Avatar className="h-8 w-8 shrink-0 mb-5">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            C
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn('max-w-[72%] min-w-[80px] space-y-1', estUser && 'items-end flex flex-col')}>
        {/* Bulle de texte */}
        <div className={cn(
          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm',
          estUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
        )}>
          {message.contenu}
        </div>
        {/* Horodatage discret */}
        <p className={cn('text-[0.68rem] text-muted-foreground', estUser && 'text-right')}>
          {dateHeureFr(message.created_at)}
        </p>
      </div>
    </div>
  );
}

/* ── Composant principal : interface de chat ─────────────────────────── */
export default function Assistant() {

  /* Historique des messages — initialisé depuis les données mock */
  const [messages, setMessages] = useState(() => [...messages_ia_initiaux]);

  /* Valeur courante de la textarea de saisie */
  const [saisie, setSaisie] = useState('');

  /* true pendant les 800ms de "réponse en cours" */
  const [isTyping, setIsTyping] = useState(false);

  /* Référence vers le bas de la liste (pour auto-scroll) */
  const finMessagesRef = useRef(null);

  /* Référence vers la textarea (pour redonner le focus après réponse) */
  const textareaRef = useRef(null);

  /* ── Suggestions rapides ─────────────────────────────────────────────
     Affichées uniquement tant qu'aucun message utilisateur n'a été envoyé. */
  const SUGGESTIONS = [
    'Quels livres sont en rupture de stock ?',
    'Analyse mes ventes de mars',
    'Quels titres recommandez-vous ?',
    'Mes LCR en retard',
  ];

  const aDejaEcrit = messages.some((m) => m.role === 'user');

  /* ── Auto-scroll vers le bas à chaque nouveau message ─────────────── */
  useEffect(() => {
    if (finMessagesRef.current) {
      finMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  /* ── Envoi d'un message ──────────────────────────────────────────────
     1. Ajoute le message utilisateur
     2. Active le typing indicator (800ms)
     3. Génère et ajoute la réponse simulée */
  const envoyerMessage = (texte) => {
    const contenu = texte.trim();
    if (!contenu) return;

    const maintenant = new Date().toISOString();

    setMessages((prev) => [...prev, {
      id: Date.now(),
      role: 'user',
      contenu,
      created_at: maintenant,
    }]);
    setSaisie('');
    setIsTyping(true);

    /* Simulation du délai de réponse (800ms) */
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        contenu: genererReponse(contenu),
        created_at: new Date().toISOString(),
      }]);
      if (textareaRef.current) textareaRef.current.focus();
    }, 800);
  };

  /* ── Gestion du clavier ─────────────────────────────────────────────
     Enter seul → envoie | Shift+Enter → saut de ligne */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      envoyerMessage(saisie);
    }
  };

  return (
    <AppLayout title="Conseiller">

      {/* ── Conteneur principal : flex colonne pleine hauteur ─────────── */}
      <div className="flex flex-col h-[calc(100vh-140px)] min-h-[400px]">

        {/* ── En-tête compact du chat ───────────────────────────────── */}
        <div className="flex items-center gap-3 pb-3 border-b mb-0">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-base leading-none">Conseiller</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Analyse croisée · Recommandations · Alertes
            </p>
          </div>
        </div>

        {/* ── Zone des messages (scrollable) ───────────────────────────
            flex: 1 = occupe tout l'espace restant
            overflow-y: auto = barre de scroll si contenu dépasse */}
        <div className="flex-1 overflow-y-auto py-4 px-1">

          {messages.map((msg) => (
            <BulleMessage key={msg.id} message={msg} />
          ))}

          {/* Indicateur "en train d'écrire" pendant les 800ms */}
          {isTyping && (
            <div className="flex items-end gap-2.5 mb-4">
              <Avatar className="h-8 w-8 shrink-0 mb-5">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  C
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-bl-sm shadow-sm">
                <TypingIndicator />
              </div>
            </div>
          )}

          {/* Élément invisible servant de cible pour l'auto-scroll */}
          <div ref={finMessagesRef} />
        </div>

        {/* ── Suggestions rapides ───────────────────────────────────────
            Visibles uniquement avant le premier message utilisateur.
            Disparaissent dès que la conversation commence. */}
        {!aDejaEcrit && (
          <div className="py-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Suggestions rapides</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => envoyerMessage(suggestion)}
                  disabled={isTyping}
                  className={cn(
                    'px-3 py-1.5 rounded-full border border-border bg-card text-sm',
                    'hover:border-primary hover:text-primary transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Zone de saisie ────────────────────────────────────────────
            Textarea + bouton Envoyer côte à côte.
            Enter → envoie | Shift+Enter → saut de ligne */}
        <div className="pt-3 border-t flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            placeholder="Posez votre question… (Entrée pour envoyer, Shift+Entrée pour sauter une ligne)"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            rows={1}
            className="flex-1 resize-none min-h-[44px] max-h-36 rounded-xl py-2.5"
          />
          <Button
            onClick={() => envoyerMessage(saisie)}
            disabled={!saisie.trim() || isTyping}
            className="h-11 px-4 rounded-xl shrink-0"
            title="Envoyer (Entrée)"
          >
            <Send className="h-4 w-4 mr-2" />
            Envoyer
          </Button>
        </div>

      </div>
    </AppLayout>
  );
}
