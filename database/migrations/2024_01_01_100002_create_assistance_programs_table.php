<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('assistance_programs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->enum('type', ['bantuan_tunai', 'bantuan_barang', 'bantuan_jasa'])->comment('Type of assistance');
            $table->decimal('amount', 15, 2)->nullable()->comment('Amount for cash assistance');
            $table->text('requirements')->comment('Requirements to apply');
            $table->date('registration_start');
            $table->date('registration_end');
            $table->integer('quota')->default(0)->comment('Maximum number of recipients');
            $table->enum('status', ['draft', 'active', 'closed', 'completed'])->default('draft');
            $table->timestamps();
            
            $table->index('type');
            $table->index('status');
            $table->index(['registration_start', 'registration_end']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assistance_programs');
    }
};