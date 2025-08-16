<?php

namespace Database\Factories;

use App\Models\AssistanceApplication;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Distribution>
 */
class DistributionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'assistance_application_id' => AssistanceApplication::factory(),
            'distributed_by' => User::factory(),
            'distribution_date' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'location' => $this->faker->randomElement([
                'Kantor Dinas Sosial Kabupaten Way Kanan',
                'Balai Desa Sukamaju',
                'Kantor Camat Way Tuba',
                'Puskesmas Blambangan Umpu',
                'Balai Desa Muara Jaya',
            ]),
            'notes' => $this->faker->optional()->sentence(),
            'recipient_signature' => null,
            'is_received' => $this->faker->boolean(80),
            'received_at' => function (array $attributes) {
                return $attributes['is_received'] ? 
                    $this->faker->dateTimeBetween($attributes['distribution_date'], 'now') : 
                    null;
            },
        ];
    }

    /**
     * Indicate that the distribution is received.
     */
    public function received(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_received' => true,
            'received_at' => $this->faker->dateTimeBetween($attributes['distribution_date'] ?? '-1 week', 'now'),
        ]);
    }
}