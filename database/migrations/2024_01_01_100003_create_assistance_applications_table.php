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
        Schema::create('assistance_applications', function (Blueprint $table) {
            $table->id();
            $table->string('application_number')->unique()->comment('Unique application identifier');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('assistance_program_id')->constrained()->onDelete('cascade');
            $table->json('personal_data')->comment('Personal information of applicant');
            $table->json('family_data')->comment('Family members information');
            $table->json('economic_data')->comment('Economic status information');
            $table->json('documents')->comment('Uploaded document paths');
            $table->enum('status', ['pending', 'under_review', 'field_verification', 'approved', 'rejected', 'distributed'])->default('pending');
            $table->text('notes')->nullable()->comment('Admin notes');
            $table->text('rejection_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('field_officer_id')->nullable()->constrained('users');
            $table->timestamp('field_verification_at')->nullable();
            $table->text('field_verification_notes')->nullable();
            $table->timestamp('distributed_at')->nullable();
            $table->timestamps();
            
            $table->index('application_number');
            $table->index('status');
            $table->index(['user_id', 'status']);
            $table->index('assistance_program_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assistance_applications');
    }
};