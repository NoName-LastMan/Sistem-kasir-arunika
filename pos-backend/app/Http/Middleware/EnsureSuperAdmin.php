<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || $request->user()->role !== 'superadmin') {
            return response()->json([
                'message' => 'Akses ditolak. Endpoint ini khusus untuk Super Admin (Owner).'
            ], 403);
        }

        return $next($request);
    }
}
