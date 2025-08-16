<?php

namespace Database\Factories;

use App\Models\Complaint;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Complaint>
 */
class ComplaintFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subjects = [
            'Bantuan belum diterima',
            'Proses verifikasi terlalu lama',
            'Petugas tidak datang untuk survei',
            'Data bantuan tidak sesuai',
            'Website sering error',
            'Informasi program tidak jelas',
            'Dokumen hilang saat proses',
            'Pelayanan kurang memuaskan',
        ];

        return [
            'ticket_number' => Complaint::generateTicketNumber(),
            'user_id' => User::factory(),
            'subject' => $this->faker->randomElement($subjects),
            'description' => $this->faker->paragraph(3),
            'category' => $this->faker->randomElement(['layanan', 'distribusi', 'verifikasi', 'sistem', 'lainnya']),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high']),
            'status' => $this->faker->randomElement(['open', 'in_progress', 'resolved', 'closed']),
        ];
    }

    /**
     * Indicate that the complaint is open.
     */
    public function open(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'open',
        ]);
    }

    /**
     * Indicate that the complaint is resolved.
     */
    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'resolved',
            'assigned_to' => User::factory(),
            'response' => $this->faker->paragraph(2),
            'responded_at' => $this->faker->dateTimeBetween('-1 week', 'now'),
            'resolved_at' => $this->faker->dateTimeBetween('-1 week', 'now'),
        ]);
    }
}