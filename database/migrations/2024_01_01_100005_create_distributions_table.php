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
        Schema::create('distributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assistance_application_id')->constrained()->onDelete('cascade');
            $table->foreignId('distributed_by')->constrained('users');
            $table->date('distribution_date');
            $table->string('location');
            $table->text('notes')->nullable();
            $table->json('recipient_signature')->nullable()->comment('Digital signature or photo');
            $table->boolean('is_received')->default(false);
            $table->timestamp('received_at')->nullable();
            $table->timestamps();
            
            $table->index('distribution_date');
            $table->index('is_received');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('distributions');
    }
};