<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ticket extends Model
{
    protected $fillable = [
        'cree_par', 'sujet', 'description', 'priorite', 'statut',
    ];

    public function createurUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cree_par');
    }
}
