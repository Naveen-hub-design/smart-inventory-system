import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Search, Users as UsersIcon, Power, PowerOff, Key, ShieldCheck, Clock, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { User, PasswordResetRequest } from '../../types'
import Modal from '../../components/ui/Modal'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import UserForm from './UserForm'

export default function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<User | null>(null)
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [approveModal, setApproveModal] = useState<PasswordResetRequest | null>(null)
  const [approvePassword, setApprovePassword] = useState('')
  const [rejectModal, setRejectModal] = useState<PasswordResetRequest | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')

  const fetchUsers = useCallback(async (p?: number) => {
    setLoading(true)
    const currentPage = p ?? page
    try {
      const params: any = { page: currentPage, per_page: 10 }
      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await authService.getUsers(params)
      setUsers(res.users)
      setPages(res.pages)
      setTotal(res.total)
      setPage(res.page)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { fetchUsers() }, [page])

  const fetchResetRequests = useCallback(async () => {
    try {
      const res = await authService.getPasswordResetRequests({ status: 'pending', per_page: 50 })
      setResetRequests(res.requests)
    } catch {
    } finally {
      setRequestsLoading(false)
    }
  }, [])

  useEffect(() => { fetchResetRequests() }, [])

  const handleApproveReset = async () => {
    if (!approveModal || !approvePassword) return
    try {
      await authService.approvePasswordReset(approveModal.id, approvePassword)
      toast.success('Password reset approved')
      setApproveModal(null)
      setApprovePassword('')
      fetchResetRequests()
    } catch {
      toast.error('Failed to approve request')
    }
  }

  const handleRejectReset = async () => {
    if (!rejectModal) return
    try {
      await authService.rejectPasswordReset(rejectModal.id, rejectNotes)
      toast.success('Request rejected')
      setRejectModal(null)
      setRejectNotes('')
      fetchResetRequests()
    } catch {
      toast.error('Failed to reject request')
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchUsers(1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleToggleStatus = async (user: User) => {
    try {
      await authService.toggleUserStatus(user.id, !user.is_active)
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`)
      setConfirmToggle(null)
      fetchUsers(page)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (user: User) => {
    try {
      await authService.deleteUser(user.id)
      toast.success('User deleted')
      setConfirmDelete(null)
      const newTotal = total - 1
      const lastPage = Math.max(1, Math.ceil(newTotal / 10))
      const nextPage = page > lastPage ? lastPage : page
      fetchUsers(nextPage)
    } catch {
      toast.error('Failed to delete user')
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordId || !newPassword) return
    try {
      await authService.resetUserPassword(resetPasswordId, newPassword)
      toast.success('Password reset successfully')
      setResetPasswordId(null)
      setNewPassword('')
    } catch {
      toast.error('Failed to reset password')
    }
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditingUser(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage staff accounts</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by name, username or email..."
              className="input-field pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="input-field w-full sm:w-44"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={handleSearch} className="btn-primary px-6">
            Search
          </button>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : users.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-8 h-8 text-gray-400" />}
            title="No users found"
            description={total === 0 ? 'Create your first staff account to get started.' : 'Try a different search or filter.'}
            action={total === 0 ? <button onClick={openCreate} className="btn-primary">Add Staff</button> : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="table-header">Employee ID</th>
                    <th className="table-header">User</th>
                    <th className="table-header">Username</th>
                    <th className="table-header">Email</th>
                    <th className="table-header">Role</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Last Login</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={user.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      <td className="table-cell font-mono text-xs text-gray-500 dark:text-gray-400">
                        {user.employee_id || '-'}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-md shadow-primary-500/20">
                            {user.full_name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-xs">{user.username}</td>
                      <td className="table-cell">{user.email}</td>
                      <td className="table-cell">
                        <span className={user.role === 'admin' ? 'badge-info' : 'badge-success'}>
                          {user.role === 'admin' ? (
                            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Admin</span>
                          ) : 'Staff'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={user.is_active ? 'badge-success' : 'badge-warning'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-cell text-xs text-gray-500 dark:text-gray-400">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button
                            onClick={() => setConfirmToggle(user)}
                            className="p-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {user.is_active
                              ? <PowerOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                              : <Power className="w-4 h-4 text-green-600 dark:text-green-400" />
                            }
                          </button>
                          <button
                            onClick={() => setResetPasswordId(user.id)}
                            className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => setConfirmDelete(user)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      {!requestsLoading && resetRequests.length > 0 && (
        <div className="card animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Password Reset Requests</h2>
            <span className="badge-warning text-xs">{resetRequests.length} pending</span>
          </div>
          <div className="space-y-2">
            {resetRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{req.user_full_name || req.username_input}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {req.username_input}{req.email_input ? ` / ${req.email_input}` : ''} &middot; {new Date(req.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setApproveModal(req); setApprovePassword('') }} className="btn-success !py-1.5 !px-3 text-xs flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => { setRejectModal(req); setRejectNotes('') }} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit Staff' : 'Add Staff'} size="md">
        <UserForm
          user={editingUser}
          onSuccess={() => { setModalOpen(false); fetchUsers(page) }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{confirmDelete?.full_name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmDelete(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDelete(confirmDelete!)} className="btn-danger flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!confirmToggle} onClose={() => setConfirmToggle(null)} title={confirmToggle?.is_active ? 'Confirm Deactivate' : 'Confirm Activate'} size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to {confirmToggle?.is_active ? 'deactivate' : 'activate'} <strong className="text-gray-900 dark:text-white">{confirmToggle?.full_name}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmToggle(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleToggleStatus(confirmToggle!)} className={`btn-primary flex items-center gap-2 ${confirmToggle?.is_active ? '!bg-yellow-600 hover:!bg-yellow-500' : ''} shadow-lg shadow-primary-500/20`}>
              {confirmToggle?.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
              {confirmToggle?.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!resetPasswordId} onClose={() => { setResetPasswordId(null); setNewPassword('') }} title="Reset Password" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Enter a new password for this user.
          </p>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 6 characters)"
            className="input-field"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => { setResetPasswordId(null); setNewPassword('') }} className="btn-secondary">Cancel</button>
            <button onClick={handleResetPassword} disabled={newPassword.length < 6} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20">
              <Key className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!approveModal} onClose={() => setApproveModal(null)} title="Approve Password Reset" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Set a temporary password for <strong className="text-gray-900 dark:text-white">{approveModal?.user_full_name || approveModal?.username_input}</strong>.
            The user will be required to change this password on next login.
          </p>
          <input
            type="password"
            value={approvePassword}
            onChange={(e) => setApprovePassword(e.target.value)}
            placeholder="Temporary password (min 6 characters)"
            className="input-field"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setApproveModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleApproveReset} disabled={approvePassword.length < 6} className="btn-success flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Approve &amp; Set Password
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Password Reset" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Reject request for <strong className="text-gray-900 dark:text-white">{rejectModal?.user_full_name || rejectModal?.username_input}</strong>?
          </p>
          <textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Optional notes..."
            className="input-field"
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setRejectModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleRejectReset} className="btn-danger flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Reject Request
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
