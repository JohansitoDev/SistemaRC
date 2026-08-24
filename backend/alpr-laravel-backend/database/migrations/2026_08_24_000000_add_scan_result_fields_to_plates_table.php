<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plates', function (Blueprint $table) {
            $table->boolean('is_stolen')->default(false)->after('captured_at');
            $table->string('status')->nullable()->after('is_stolen');
            $table->text('message')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('plates', function (Blueprint $table) {
            $table->dropColumn(['is_stolen', 'status', 'message']);
        });
    }
};
