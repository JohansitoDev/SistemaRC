<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddMissingColumnsToPlatesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('plates', function (Blueprint $table) {
            $table->boolean('is_stolen')->default(false);
            $table->string('status')->nullable();
            $table->text('message')->nullable();
        });
    }

    public function down()
    {
        Schema::table('plates', function (Blueprint $table) {
            $table->dropColumn(['is_stolen', 'status', 'message']);
        });
    }
}