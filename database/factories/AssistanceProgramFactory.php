<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AssistanceProgram>
 */
class AssistanceProgramFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = ['bantuan_tunai', 'bantuan_barang', 'bantuan_jasa'];
        $type = $this->faker->randomElement($types);
        
        return [
            'name' => $this->faker->randomElement([
                'Bantuan Langsung Tunai',
                'Program Keluarga Harapan',
                'Bantuan Sembako',
                'Bantuan Modal Usaha',
                'Bantuan Kesehatan',
                'Program Rehabilitasi Rumah',
            ]),
            'description' => $this->faker->paragraph(3),
            'type' => $type,
            'amount' => $type === 'bantuan_tunai' ? $this->faker->numberBetween(500000, 5000000) : null,
            'requirements' => implode("\n", [
                '- KTP yang masih berlaku',
                '- Kartu Keluarga',
                '- Surat Keterangan Tidak Mampu (SKTM)',
                '- Foto rumah tampak depan',
                '- Surat pernyataan tidak menerima bantuan sejenis',
            ]),
            'registration_start' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'registration_end' => $this->faker->dateTimeBetween('now', '+2 months'),
            'quota' => $this->faker->numberBetween(50, 500),
            'status' => $this->faker->randomElement(['draft', 'active', 'closed']),
        ];
    }

    /**
     * Indicate that the program is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'registration_start' => now()->subDays(7),
            'registration_end' => now()->addDays(30),
        ]);
    }
}