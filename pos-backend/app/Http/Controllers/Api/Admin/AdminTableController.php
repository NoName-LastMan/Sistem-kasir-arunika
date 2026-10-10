<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Table;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminTableController extends Controller
{
    public function index()
    {
        $tables = Table::orderBy('table_number')->get();

        return response()->json([
            'message' => 'Daftar meja restoran',
            'data'    => $tables
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'table_number' => 'required|string|max:50|unique:tables,table_number',
            'capacity'     => 'required|integer|min:1',
            'status'       => 'required|in:available,occupied,reserved',
        ]);

        $table = Table::create($validated);

        return response()->json([
            'message' => 'Meja berhasil dibuat',
            'data'    => $table
        ], 201);
    }

    public function update(Request $request, Table $table)
    {
        $validated = $request->validate([
            'table_number' => ['required', 'string', 'max:50', Rule::unique('tables')->ignore($table->id)],
            'capacity'     => 'required|integer|min:1',
            'status'       => 'required|in:available,occupied,reserved',
        ]);

        $table->update($validated);

        return response()->json([
            'message' => 'Meja berhasil diperbarui',
            'data'    => $table
        ]);
    }

    public function destroy(Table $table)
    {
        $table->delete();

        return response()->json([
            'message' => 'Meja berhasil dihapus'
        ]);
    }
}
