<?php

namespace Database\Factories;

use App\Models\AssistanceApplication;
use App\Models\AssistanceProgram;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AssistanceApplication>
 */
class AssistanceApplicationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'application_number' => AssistanceApplication::generateApplicationNumber(),
            'user_id' => User::factory(),
            'assistance_program_id' => AssistanceProgram::factory(),
            'personal_data' => [
                'full_name' => $this->faker->name(),
                'nik' => $this->faker->numerify('##############'),
                'birth_place' => $this->faker->city(),
                'birth_date' => $this->faker->date(),
                'gender' => $this->faker->randomElement(['L', 'P']),
                'religion' => $this->faker->randomElement(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha']),
                'education' => $this->faker->randomElement(['SD', 'SMP', 'SMA', 'D3', 'S1', 'S2']),
                'occupation' => $this->faker->jobTitle(),
                'phone' => $this->faker->phoneNumber(),
                'address' => $this->faker->address(),
            ],
            'family_data' => [
                'family_size' => $this->faker->numberBetween(1, 8),
                'dependents' => $this->faker->numberBetween(0, 5),
                'family_members' => [],
            ],
            'economic_data' => [
                'monthly_income' => $this->faker->numberBetween(500000, 3000000),
                'income_source' => $this->faker->randomElement(['Wiraswasta', 'Buruh', 'Petani', 'Pedagang', 'Lainnya']),
                'house_ownership' => $this->faker->randomElement(['milik_sendiri', 'sewa', 'kontrak', 'menumpang']),
                'asset_ownership' => [],
            ],
            'documents' => [
                'ktp' => 'documents/ktp_' . $this->faker->uuid() . '.jpg',
                'kk' => 'documents/kk_' . $this->faker->uuid() . '.jpg',
                'sktm' => 'documents/sktm_' . $this->faker->uuid() . '.pdf',
            ],
            'status' => $this->faker->randomElement(['pending', 'under_review', 'field_verification', 'approved', 'rejected']),
        ];
    }

    /**
     * Indicate that the application is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    /**
     * Indicate that the application is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'reviewed_by' => User::factory(),
            'reviewed_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ]);
    }
}