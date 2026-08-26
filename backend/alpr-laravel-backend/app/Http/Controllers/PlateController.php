<?php

namespace App\Http\Controllers;

use App\Models\Plate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Exception;

class PlateController extends Controller
{
    public function index()
    {
        try {
            $plates = Plate::latest()->get();
            return response()->json($plates, 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function stats()
    {
        try {
            $total = Plate::count();
            $stolen = Plate::where('is_stolen', true)->count();
            $normal = Plate::where('is_stolen', false)->count();

            return response()->json([
                'total' => $total,
                'stolen' => $stolen,
                'normal' => $normal
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
     {
        try {
            $validated = $request->validate([
                'plate_number' => 'required|string|max:20',
                'captured_at' => 'required|date',
            ]);

            $plateNumberClean = preg_replace(
                '/[^A-Z0-9]/',
                '',
                strtoupper(trim($validated['plate_number']))
            );

            if (strlen($plateNumberClean) < 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'La placa debe contener al menos 3 caracteres alfanuméricos.'
                ], 422);
            }

            // Verificar automáticamente en la tabla stolen_plates con limpieza estricta
            $stolenRecord = Schema::hasTable('stolen_plates')
                ? DB::table('stolen_plates')->whereRaw('UPPER(TRIM(plate_number)) = ?', [$plateNumberClean])->first()
                : null;

            $isStolen = $stolenRecord !== null;
            $status = $isStolen ? 'ROBADA' : 'REGISTRADA';
            $message = $isStolen 
                ? ('Alerta: ' . ($stolenRecord->notes ?? 'Vehículo reportado como robado')) 
                : 'Matrícula procesada correctamente';

            // Guardar el registro en la tabla plates de MySQL
            $plateData = [
                'plate_number' => $plateNumberClean,
                'captured_at' => $validated['captured_at'],
            ];
            if (Schema::hasColumn('plates', 'is_stolen')) $plateData['is_stolen'] = (bool) $isStolen;
            if (Schema::hasColumn('plates', 'status')) $plateData['status'] = $status;
            if (Schema::hasColumn('plates', 'message')) $plateData['message'] = $message;

            $plate = Plate::create($plateData);

            return response()->json([
                'success' => true,
                'status' => $status,
                'plate_number' => $plate->plate_number,
                'is_stolen' => (bool) ($plate->is_stolen ?? $isStolen),
                'captured_at' => $plate->captured_at->toDateTimeString(),
                'message' => $message,
                'plate' => $plate,
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}