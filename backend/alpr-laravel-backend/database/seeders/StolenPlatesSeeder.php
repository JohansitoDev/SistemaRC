<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class StolenPlatesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        \App\Models\StolenPlate::updateOrCreate(
            ['plate_number' => 'A123456'],
            ['notes' => 'Vehículo reportado como robado en zona central']
        );

        \App\Models\StolenPlate::updateOrCreate(
            ['plate_number' => 'B654321'],
            ['notes' => 'Alerta activa por la Policía Nacional']
        );
    }
}