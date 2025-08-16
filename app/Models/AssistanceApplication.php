<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * App\Models\AssistanceApplication
 *
 * @property int $id
 * @property string $application_number
 * @property int $user_id
 * @property int $assistance_program_id
 * @property array $personal_data
 * @property array $family_data
 * @property array $economic_data
 * @property array $documents
 * @property string $status
 * @property string|null $notes
 * @property string|null $rejection_reason
 * @property int|null $reviewed_by
 * @property \Illuminate\Support\Carbon|null $reviewed_at
 * @property int|null $field_officer_id
 * @property \Illuminate\Support\Carbon|null $field_verification_at
 * @property string|null $field_verification_notes
 * @property \Illuminate\Support\Carbon|null $distributed_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $user
 * @property-read \App\Models\AssistanceProgram $assistanceProgram
 * @property-read \App\Models\User|null $reviewer
 * @property-read \App\Models\User|null $fieldOfficer
 * @property-read \App\Models\Distribution|null $distribution
 * 
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication query()
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereApplicationNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereAssistanceProgramId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication wherePersonalData($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereFamilyData($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereEconomicData($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereDocuments($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereRejectionReason($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereReviewedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereReviewedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereFieldOfficerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereFieldVerificationAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereFieldVerificationNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereDistributedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|AssistanceApplication whereUpdatedAt($value)
 * @method static \Database\Factories\AssistanceApplicationFactory factory($count = null, $state = [])
 * 
 * @mixin \Eloquent
 */
class AssistanceApplication extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'application_number',
        'user_id',
        'assistance_program_id',
        'personal_data',
        'family_data',
        'economic_data',
        'documents',
        'status',
        'notes',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'field_officer_id',
        'field_verification_at',
        'field_verification_notes',
        'distributed_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'personal_data' => 'array',
        'family_data' => 'array',
        'economic_data' => 'array',
        'documents' => 'array',
        'reviewed_at' => 'datetime',
        'field_verification_at' => 'datetime',
        'distributed_at' => 'datetime',
    ];

    /**
     * Get the user who applied.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the assistance program.
     */
    public function assistanceProgram(): BelongsTo
    {
        return $this->belongsTo(AssistanceProgram::class);
    }

    /**
     * Get the user who reviewed the application.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Get the field officer assigned.
     */
    public function fieldOfficer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'field_officer_id');
    }

    /**
     * Get the distribution record.
     */
    public function distribution(): HasOne
    {
        return $this->hasOne(Distribution::class);
    }

    /**
     * Generate unique application number.
     */
    public static function generateApplicationNumber(): string
    {
        $prefix = 'BS' . date('Y') . date('m');
        $lastApplication = static::where('application_number', 'like', $prefix . '%')
            ->orderByDesc('application_number')
            ->first();

        if (!$lastApplication) {
            return $prefix . '0001';
        }

        $lastNumber = intval(substr($lastApplication->application_number, -4));
        return $prefix . str_pad((string)($lastNumber + 1), 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get status display name.
     */
    public function getStatusDisplayAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Menunggu Review',
            'under_review' => 'Sedang Direview',
            'field_verification' => 'Verifikasi Lapangan',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            'distributed' => 'Sudah Disalurkan',
            default => 'Unknown'
        };
    }

    /**
     * Get status color class.
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'bg-yellow-100 text-yellow-800',
            'under_review' => 'bg-blue-100 text-blue-800',
            'field_verification' => 'bg-purple-100 text-purple-800',
            'approved' => 'bg-green-100 text-green-800',
            'rejected' => 'bg-red-100 text-red-800',
            'distributed' => 'bg-gray-100 text-gray-800',
            default => 'bg-gray-100 text-gray-800'
        };
    }
}