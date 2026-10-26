<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthAndSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_check_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'timestamp',
                'services' => [
                    'database',
                    'forecasting_engine',
                ],
                'environment',
            ])
            ->assertJson([
                'status' => 'healthy',
                'services' => [
                    'database' => 'connected',
                ],
            ]);
    }

    public function test_login_rate_limiting_blocks_after_too_many_attempts(): void
    {
        // Rate limit is throttle:6,1 (6 attempts allowed, 7th is 429)
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/login', [
                'email'    => 'nonexistent@example.com',
                'password' => 'wrongpassword',
            ]);
        }

        $blockedResponse = $this->postJson('/api/login', [
            'email'    => 'nonexistent@example.com',
            'password' => 'wrongpassword',
        ]);

        $blockedResponse->assertStatus(429);
    }
}
