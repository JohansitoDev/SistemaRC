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
     * Guardar la placa escaneada, verificar duplicados y alertar si es robada.
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

       
        $plateNumber = strtoupper(trim($request->input('plate_number')));
        $capturedAt  = $request->input('captured_at') ? Carbon::parse($request->input('captured_at')) : Carbon::now();

        
        $existsRecently = Plate::where('plate_number', $plateNumber)
            ->where('captured_at', '>=', $capturedAt->copy()->subMinutes(15))
            ->exists();

        if ($existsRecently) {
            return response()->json([
                'success' => false,
                'status'  => 'DUPLICATE',
                'message' => "La placa {$plateNumber} ya fue escaneada recientemente. No se guardará de nuevo."
            ], 409);
        }

      
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