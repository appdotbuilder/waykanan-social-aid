<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\Distribution
 *
 * @property int $id
 * @property int $assistance_application_id
 * @property int $distributed_by
 * @property \Illuminate\Support\Carbon $distribution_date
 * @property string $location
 * @property string|null $notes
 * @property array|null $recipient_signature
 * @property bool $is_received
 * @property \Illuminate\Support\Carbon|null $received_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\AssistanceApplication $assistanceApplication
 * @property-read \App\Models\User $distributedBy
 * 
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution query()
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution whereAssistanceApplicationId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution whereDistributedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution whereDistributionDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution whereLocation($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution whereNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution whereRecipientSignature($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution whereIsReceived($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution whereReceivedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Distribution whereUpdatedAt($value)
 * @method static \Database\Factories\DistributionFactory factory($count = null, $state = [])
 * 
 * @mixin \Eloquent
 */
class Distribution extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'assistance_application_id',
        'distributed_by',
        'distribution_date',
        'location',
        'notes',
        'recipient_signature',
        'is_received',
        'received_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'distribution_date' => 'date',
        'recipient_signature' => 'array',
        'is_received' => 'boolean',
        'received_at' => 'datetime',
    ];

    /**
     * Get the assistance application.
     */
    public function assistanceApplication(): BelongsTo
    {
        return $this->belongsTo(AssistanceApplication::class);
    }

    /**
     * Get the user who distributed.
     */
    public function distributedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'distributed_by');
    }
}