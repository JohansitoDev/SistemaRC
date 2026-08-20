<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PlateController; 


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});


Route::post('/plates', [PlateController::class, 'store']);
Route::get('/plates', [PlateController::class, 'index']);
Route::get('/plates/stats', [PlateController::class, 'stats']);
