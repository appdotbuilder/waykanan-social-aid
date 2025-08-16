<?php

namespace Database\Seeders;

use App\Models\AssistanceApplication;
use App\Models\AssistanceProgram;
use App\Models\Complaint;
use App\Models\Distribution;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'name' => 'Admin Dinas Sosial',
            'email' => 'admin@dinsos-waykanan.go.id',
            'password' => bcrypt('password'),
            'role' => 'admin_dinas',
            'phone' => '0721-123456',
            'nik' => '1807010101800001',
            'address' => 'Jl. Raya Blambangan Umpu, Way Kanan',
            'status' => 'active',
        ]);

        // Create operator
        $operator = User::create([
            'name' => 'Operator Sistem',
            'email' => 'operator@dinsos-waykanan.go.id',
            'password' => bcrypt('password'),
            'role' => 'operator',
            'phone' => '0721-123457',
            'nik' => '1807010101800002',
            'address' => 'Jl. Raya Blambangan Umpu, Way Kanan',
            'status' => 'active',
        ]);

        // Create field officer
        $fieldOfficer = User::create([
            'name' => 'Petugas Lapangan 1',
            'email' => 'petugas@dinsos-waykanan.go.id',
            'password' => bcrypt('password'),
            'role' => 'petugas_lapangan',
            'phone' => '0721-123458',
            'nik' => '1807010101800003',
            'address' => 'Jl. Sukamaju, Way Kanan',
            'status' => 'active',
        ]);

        // Create public user
        $publicUser = User::create([
            'name' => 'Masyarakat Demo',
            'email' => 'masyarakat@example.com',
            'password' => bcrypt('password'),
            'role' => 'masyarakat',
            'phone' => '0812-3456-7890',
            'nik' => '1807010101800004',
            'address' => 'Desa Sukamaju, Kec. Blambangan Umpu, Way Kanan',
            'status' => 'active',
        ]);

        // Create more public users
        User::factory(20)->create([
            'role' => 'masyarakat',
        ]);

        // Create assistance programs
        $programs = AssistanceProgram::factory(5)->active()->create();

        // Create some draft and closed programs too
        AssistanceProgram::factory(2)->create(['status' => 'draft']);
        AssistanceProgram::factory(3)->create(['status' => 'closed']);

        // Create assistance applications
        foreach ($programs as $program) {
            // Create applications for this program
            AssistanceApplication::factory(random_int(5, 15))
                ->create([
                    'assistance_program_id' => $program->id,
                    'user_id' => User::where('role', 'masyarakat')->inRandomOrder()->first()->id,
                ]);
        }

        // Create some applications with specific statuses
        $approvedApplications = AssistanceApplication::factory(5)
            ->approved()
            ->create([
                'reviewed_by' => $operator->id,
            ]);

        // Create distributions for approved applications
        foreach ($approvedApplications as $application) {
            Distribution::factory()->received()->create([
                'assistance_application_id' => $application->id,
                'distributed_by' => $fieldOfficer->id,
            ]);
        }

        // Create complaints
        Complaint::factory(15)->create([
            'user_id' => User::where('role', 'masyarakat')->inRandomOrder()->first()->id,
        ]);

        // Create some resolved complaints
        Complaint::factory(8)->resolved()->create([
            'user_id' => User::where('role', 'masyarakat')->inRandomOrder()->first()->id,
            'assigned_to' => collect([$operator, $fieldOfficer])->random()->id,
        ]);

        echo "Demo users created:\n";
        echo "Admin: admin@dinsos-waykanan.go.id / password\n";
        echo "Operator: operator@dinsos-waykanan.go.id / password\n";
        echo "Petugas: petugas@dinsos-waykanan.go.id / password\n";
        echo "Masyarakat: masyarakat@example.com / password\n";
    }
}