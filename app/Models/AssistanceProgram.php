<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * App\Models\AssistanceProgram
 *
 * @property int $id
 * @property string $name
 * @property string $description
 * @property string $type
 * @property string|null $amount
 * @property string $requirements
 * @property \Illuminate\Support\Carbon $registration_start
 * @property \Illuminate\Support\Carbon $registration_end
 * @property int $quota
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\AssistanceApplication> $applications
 * 
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram query()
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram whereAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram whereRequirements($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram whereRegistrationStart($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram whereRegistrationEnd($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram whereQuota($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceProgram active()
 * @method static \Database\Factories\AssistanceProgramFactory factory($count = null, $state = [])
 * 
 * @mixin \Eloquent
 */
class AssistanceProgram extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'description',
        'type',
        'amount',
        'requirements',
        'registration_start',
        'registration_end',
        'quota',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'registration_start' => 'date',
        'registration_end' => 'date',
        'amount' => 'decimal:2',
    ];

    /**
     * Get the applications for this program.
     */
    public function applications(): HasMany
    {
        return $this->hasMany(AssistanceApplication::class);
    }

    /**
     * Scope a query to only include active programs.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Check if registration is open.
     */
    public function isRegistrationOpen(): bool
    {
        $now = now()->toDateString();
        return $this->status === 'active' 
            && $this->registration_start <= $now 
            && $this->registration_end >= $now;
    }

    /**
     * Get remaining quota.
     */
    public function getRemainingQuotaAttribute(): int
    {
        return $this->quota - $this->applications()->where('status', 'approved')->count();
    }

    /**
     * Get type display name.
     */
    public function getTypeDisplayAttribute(): string
    {
        return match($this->type) {
            'bantuan_tunai' => 'Bantuan Tunai',
            'bantuan_barang' => 'Bantuan Barang',
            'bantuan_jasa' => 'Bantuan Jasa',
            default => 'Unknown'
        };
    }
}