<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plate;
use App\Models\StolenPlate;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PlateApiController extends Controller
{
    /**
    * Guardar cada captura, verificar si es robada y devolver el resultado.
     */
    public function store(Request $request)
    {
       
        $validator = Validator::make($request->all(), [
            'plate_number' => 'required|string|min:3|max:10',
            'captured_at'  => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de placa inválidos',
                'errors'  => $validator->errors()
            ], 400);
        }

        $plateNumber = preg_replace(
            '/[^A-Z0-9]/',
            '',
            strtoupper(trim($request->input('plate_number')))
        );
        $capturedAt  = $request->input('captured_at') ? Carbon::parse($request->input('captured_at')) : Carbon::now();

        $isStolen = StolenPlate::where('plate_number', $plateNumber)->exists();

     
        $plate = Plate::create([
            'plate_number' => $plateNumber,
            'captured_at'  => $capturedAt,
        ]);

       
        return response()->json([
            'success'      => true,
            'status'       => $isStolen ? 'ALERT_STOLEN' : 'SAVED',
            'plate_number' => $plateNumber,
            'is_stolen'    => $isStolen,
            'captured_at'  => $plate->captured_at->toDateTimeString(),
            'message'      => $isStolen ? " ALERTA: VEHÍCULO ROBADO" : "Placa registrada exitosamente"
        ], 201);
    }
}