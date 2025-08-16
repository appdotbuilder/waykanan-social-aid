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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin_dinas', 'operator', 'petugas_lapangan', 'masyarakat'])->default('masyarakat')->after('email');
            $table->string('phone')->nullable()->after('name');
            $table->string('nik', 16)->nullable()->after('phone');
            $table->text('address')->nullable()->after('nik');
            $table->enum('status', ['active', 'inactive'])->default('active')->after('address');
            
            $table->index('role');
            $table->index('status');
            $table->index('nik');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['status']);
            $table->dropIndex(['nik']);
            $table->dropColumn(['role', 'phone', 'nik', 'address', 'status']);
        });
    }
};