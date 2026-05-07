<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(): Response
    {
        $tickets = Ticket::orderByDesc('created_at')->get();

        return Inertia::render('Tickets', [
            'tickets' => $tickets,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'sujet'       => ['required', 'string', 'max:200'],
            'description' => ['required', 'string', 'max:5000'],
            'priorite'    => ['required', 'in:faible,normale,haute,urgente'],
        ]);

        Ticket::create([
            ...$data,
            'statut'   => 'ouvert',
            'cree_par' => auth()->id(),
        ]);

        return redirect()->route('tickets.index')
            ->with('success', 'Ticket créé.');
    }

    public function update(Request $request, Ticket $ticket)
    {
        $data = $request->validate([
            'statut'   => ['required', 'in:ouvert,en_cours,ferme'],
            'priorite' => ['required', 'in:faible,normale,haute,urgente'],
        ]);

        $ticket->update($data);

        return redirect()->route('tickets.index')
            ->with('success', 'Ticket mis à jour.');
    }

    public function destroy(Ticket $ticket)
    {
        $ticket->delete();

        return redirect()->route('tickets.index')
            ->with('success', 'Ticket supprimé.');
    }
}
