import React, { useState, useEffect } from 'react'
import { api, unwrapList } from '../../api/client'
import { Users, Plus, Edit2, Trash2, KeyRound, X, Check, Shield } from 'lucide-react'

export function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    is_active: true
  })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users')
      setUsers(unwrapList(res))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: 'password',
      role: 'cashier',
      is_active: true
    })
    setIsModalOpen(true)
  }

  const openEditModal = (u) => {
    setEditingUser(u)
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'cashier',
      is_active: u.is_active ?? true
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          is_active: formData.is_active
        })
      } else {
        await api.post('/admin/users', formData)
      }
      setIsModalOpen(false)
      fetchUsers()
    } catch (err) {
      alert(err.message || 'Gagal menyimpan user')
    }
  }

  const handleResetPassword = async (user) => {
    const newPass = window.prompt(`Reset password baru untuk ${user.name}:`, 'password')
    if (!newPass) return
    try {
      await api.post(`/admin/users/${user.id}/reset-password`, { password: newPass })
      alert(`Password untuk ${user.name} berhasil diubah.`)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus staf / kasir ini?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      fetchUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest-950">
            Kelola Staf & Hak Akses (User Management)
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Atur akun kasir, koki dapur, manajer gudang, dan hak akses sistem
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold shadow-warm-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Staf Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-pine-200 shadow-warm-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper-100 text-ink-700 font-semibold uppercase text-[10px] tracking-wider border-b border-pine-200">
              <tr>
                <th className="py-3.5 px-5">Nama Staf</th>
                <th className="py-3.5 px-4">Alamat Email</th>
                <th className="py-3.5 px-4 text-center">Peran (Role)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-ink-400">Memuat daftar staf...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-ink-400">Belum ada akun staf.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-paper-50/60 transition">
                    <td className="py-3.5 px-5 font-bold text-forest-950">
                      {u.name}
                    </td>
                    <td className="py-3.5 px-4 text-ink-600 font-mono">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        u.role === 'kitchen' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {u.is_active !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u)}
                          className="p-1.5 rounded-lg border border-pine-200 text-ink-700 hover:bg-paper-100"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg border border-pine-200 text-forest-800 hover:bg-paper-100"
                          title="Edit Staf"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-warm-lg border border-pine-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pine-100">
              <h3 className="font-serif font-bold text-base text-forest-950">
                {editingUser ? 'Edit Staf' : 'Tambah Staf Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Budi Santoso"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pine-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Alamat Email</label>
                <input
                  type="email"
                  required
                  placeholder="kasir@pos.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pine-200"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Kata Sandi Awal</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pine-200"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Peran / Hak Akses</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pine-200 bg-white"
                >
                  <option value="cashier">Kasir (Cashier)</option>
                  <option value="kitchen">Koki Dapur (Kitchen KDS)</option>
                  <option value="admin">Admin (Gudang & Backoffice)</option>
                  <option value="superadmin">Superadmin (Owner)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-pine-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-pine-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-forest-900 text-white font-semibold"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
