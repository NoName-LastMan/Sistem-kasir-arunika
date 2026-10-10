<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !in_array($request->user()->role, ['admin', 'superadmin'])) {
            return response()->json([
                'message' => 'Akses ditolak. Endpoint ini khusus untuk role Admin.'
            ], 403);
        }

        return $next($request);
    }
}
