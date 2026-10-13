<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OwnerMorningDigestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $summaryData,
        public string $aiExecutiveNarrative
    ) {}

    public function envelope(): Envelope
    {
        $dateStr = now()->subDay()->isoFormat('D MMMM Y');
        return new Envelope(
            subject: "☕ Laporan Operasional Pagi Toko ({$dateStr}) — Arunika POS",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.owner_morning_digest',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
