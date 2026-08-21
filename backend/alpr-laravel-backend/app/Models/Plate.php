<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plate extends Model
{
    protected $casts = [
        'captured_at' => 'datetime',
        'is_stolen' => 'boolean',
    ];

    protected $fillable = [
        'plate_number',
        'captured_at',
        'is_stolen',
        'status',
        'message'
    ];
}