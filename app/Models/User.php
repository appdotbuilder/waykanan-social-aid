<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * App\Models\User
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $role
 * @property string|null $phone
 * @property string|null $nik
 * @property string|null $address
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property mixed $password
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\AssistanceApplication> $assistanceApplications
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Complaint> $complaints
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\AssistanceApplication> $reviewedApplications
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\AssistanceApplication> $fieldVerifications
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Complaint> $assignedComplaints
 * 
 * @method static \Illuminate\Database\Eloquent\Builder|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|User query()
 * @method static \Illuminate\Database\Eloquent\Builder|User whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereNik($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereAddress($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereEmailVerifiedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User wherePassword($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereRememberToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|User whereUpdatedAt($value)
 * @method static \Database\Factories\UserFactory factory($count = null, $state = [])
 * 
 * @mixin \Eloquent
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'nik',
        'address',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the assistance applications for the user.
     */
    public function assistanceApplications(): HasMany
    {
        return $this->hasMany(AssistanceApplication::class);
    }

    /**
     * Get the complaints filed by the user.
     */
    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }

    /**
     * Get the assistance applications reviewed by this user.
     */
    public function reviewedApplications(): HasMany
    {
        return $this->hasMany(AssistanceApplication::class, 'reviewed_by');
    }

    /**
     * Get the field verifications assigned to this user.
     */
    public function fieldVerifications(): HasMany
    {
        return $this->hasMany(AssistanceApplication::class, 'field_officer_id');
    }

    /**
     * Get the complaints assigned to this user.
     */
    public function assignedComplaints(): HasMany
    {
        return $this->hasMany(Complaint::class, 'assigned_to');
    }

    /**
     * Check if user is admin dinas.
     */
    public function isAdminDinas(): bool
    {
        return $this->role === 'admin_dinas';
    }

    /**
     * Check if user is operator.
     */
    public function isOperator(): bool
    {
        return $this->role === 'operator';
    }

    /**
     * Check if user is field officer.
     */
    public function isPetugasLapangan(): bool
    {
        return $this->role === 'petugas_lapangan';
    }

    /**
     * Check if user is public citizen.
     */
    public function isMasyarakat(): bool
    {
        return $this->role === 'masyarakat';
    }

    /**
     * Get role display name.
     */
    public function getRoleDisplayAttribute(): string
    {
        return match($this->role) {
            'admin_dinas' => 'Admin Dinas',
            'operator' => 'Operator/Staff',
            'petugas_lapangan' => 'Petugas Lapangan',
            'masyarakat' => 'Masyarakat',
            default => 'Unknown'
        };
    }
}