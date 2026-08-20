<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plate extends Model
{
    protected $fillable = [
        'plate_number',
        'captured_at',
        'is_stolen',
        'status',
        'message'
    ];
}