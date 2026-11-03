<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    /**
     * Menampilkan daftar staf & user aplikasi.
     */
    public function index(Request $request)
    {
        $query = User::latest();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'message' => 'Daftar pengguna (User List)',
            'data'    => $query->get()
        ]);
    }

    /**
     * Membuat user / staf baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:150',
            'email'     => 'required|email|unique:users,email',
            'password'  => 'required|string|min:6',
            'role'      => 'required|in:admin,cashier,kitchen',
            'is_active' => 'boolean',
        ]);

        $user = User::create([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => Hash::make($validated['password']),
            'role'      => $validated['role'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'User berhasil dibuat',
            'data'    => $user
        ], 201);
    }

    /**
     * Memperbarui profil / status user.
     */
    public function update(Request $request, User $user)
    {
        if ($user->role === 'superadmin' && $request->user()->role !== 'superadmin') {
            return response()->json([
                'message' => 'Akses ditolak. Hanya Superadmin (Owner) yang dapat mengubah profil Superadmin.'
            ], 403);
        }

        $validated = $request->validate([
            'name'      => 'required|string|max:150',
            'email'     => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role'      => 'required|in:admin,cashier,kitchen',
            'is_active' => 'boolean',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'User berhasil diperbarui',
            'data'    => $user
        ]);
    }

    /**
     * Reset password user oleh Admin.
     */
    public function resetPassword(Request $request, User $user)
    {
        if ($user->role === 'superadmin' && $request->user()->role !== 'superadmin') {
            return response()->json([
                'message' => 'Akses ditolak. Hanya Superadmin (Owner) yang dapat mereset password Superadmin.'
            ], 403);
        }

        $validated = $request->validate([
            'password' => 'required|string|min:6',
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => "Password untuk {$user->name} berhasil di-reset"
        ]);
    }

    /**
     * Menghapus user.
     */
    public function destroy(User $user)
    {
        if ($user->id === request()->user()->id) {
            return response()->json([
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri'
            ], 400);
        }

        if ($user->role === 'superadmin') {
            return response()->json([
                'message' => 'Akun Superadmin (Owner) dilindungi dan tidak dapat dihapus.'
            ], 403);
        }

        $user->delete();

        return response()->json([
            'message' => 'User berhasil dihapus'
        ]);
    }
}
