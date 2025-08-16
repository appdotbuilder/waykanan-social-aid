<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\Complaint
 *
 * @property int $id
 * @property string $ticket_number
 * @property int $user_id
 * @property string $subject
 * @property string $description
 * @property string $category
 * @property string $priority
 * @property string $status
 * @property int|null $assigned_to
 * @property string|null $response
 * @property \Illuminate\Support\Carbon|null $responded_at
 * @property \Illuminate\Support\Carbon|null $resolved_at
 * @property int|null $rating
 * @property string|null $feedback
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $user
 * @property-read \App\Models\User|null $assignedUser
 * 
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint query()
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereTicketNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereSubject($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereCategory($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint wherePriority($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereAssignedTo($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereResponse($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereRespondedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereResolvedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereRating($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereFeedback($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Complaint whereUpdatedAt($value)
 * @method static \Database\Factories\ComplaintFactory factory($count = null, $state = [])
 * 
 * @mixin \Eloquent
 */
class Complaint extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'ticket_number',
        'user_id',
        'subject',
        'description',
        'category',
        'priority',
        'status',
        'assigned_to',
        'response',
        'responded_at',
        'resolved_at',
        'rating',
        'feedback',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'responded_at' => 'datetime',
        'resolved_at' => 'datetime',
        'rating' => 'integer',
    ];

    /**
     * Get the user who filed the complaint.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user assigned to handle the complaint.
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Generate unique ticket number.
     */
    public static function generateTicketNumber(): string
    {
        $prefix = 'TK' . date('Y') . date('m');
        $lastComplaint = static::where('ticket_number', 'like', $prefix . '%')
            ->orderByDesc('ticket_number')
            ->first();

        if (!$lastComplaint) {
            return $prefix . '0001';
        }

        $lastNumber = intval(substr($lastComplaint->ticket_number, -4));
        return $prefix . str_pad((string)($lastNumber + 1), 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get category display name.
     */
    public function getCategoryDisplayAttribute(): string
    {
        return match($this->category) {
            'layanan' => 'Layanan',
            'distribusi' => 'Distribusi',
            'verifikasi' => 'Verifikasi',
            'sistem' => 'Sistem',
            'lainnya' => 'Lainnya',
            default => 'Unknown'
        };
    }

    /**
     * Get priority display name.
     */
    public function getPriorityDisplayAttribute(): string
    {
        return match($this->priority) {
            'low' => 'Rendah',
            'medium' => 'Sedang',
            'high' => 'Tinggi',
            'urgent' => 'Mendesak',
            default => 'Unknown'
        };
    }

    /**
     * Get status display name.
     */
    public function getStatusDisplayAttribute(): string
    {
        return match($this->status) {
            'open' => 'Terbuka',
            'in_progress' => 'Sedang Diproses',
            'resolved' => 'Selesai',
            'closed' => 'Ditutup',
            default => 'Unknown'
        };
    }

    /**
     * Get priority color class.
     */
    public function getPriorityColorAttribute(): string
    {
        return match($this->priority) {
            'low' => 'bg-gray-100 text-gray-800',
            'medium' => 'bg-yellow-100 text-yellow-800',
            'high' => 'bg-orange-100 text-orange-800',
            'urgent' => 'bg-red-100 text-red-800',
            default => 'bg-gray-100 text-gray-800'
        };
    }

    /**
     * Get status color class.
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'open' => 'bg-blue-100 text-blue-800',
            'in_progress' => 'bg-yellow-100 text-yellow-800',
            'resolved' => 'bg-green-100 text-green-800',
            'closed' => 'bg-gray-100 text-gray-800',
            default => 'bg-gray-100 text-gray-800'
        };
    }
}