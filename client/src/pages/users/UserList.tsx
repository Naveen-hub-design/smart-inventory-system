import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Edit2, Trash2, Search, X, Users as UsersIcon, Power, PowerOff, Key, ShieldCheck, Clock, CheckCircle, XCircle, HelpCircle, Eye, UserCheck, UserX, UserPlus, Calendar, Mail, Phone, BadgeCheck, Building2, UserCog } from 'lucide-react'
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

  const [roleFilter, setRoleFilter] = useState('all')
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])

  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [approveModal, setApproveModal] = useState<PasswordResetRequest | null>(null)
  const [approvePassword, setApprovePassword] = useState('')
  const [rejectModal, setRejectModal] = useState<PasswordResetRequest | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')

  const fetchUsers = useCallback(async (p?: number, searchVal?: string) => {
    setLoading(true)
    const currentPage = p ?? page
    const s = searchVal ?? search
    try {
      const params: any = { page: currentPage, per_page: 10 }
      if (s) params.search = s
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await authService.getUsers(params)
      let filtered = res.users
      if (roleFilter !== 'all') {
        filtered = filtered.filter(u => u.role === roleFilter)
      }
      setUsers(filtered)
      setPages(res.pages)
      setTotal(res.total)
      setPage(res.page)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, roleFilter])

  useEffect(() => { fetchUsers() }, [page])

  useEffect(() => {
    authService.getUsers({ per_page: 100 }).then(res => {
      if (res.users) setAllUsers(res.users)
    }).catch(() => {})
  }, [])

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

  const employeeStats = useMemo(() => {
    const list = allUsers.length > 0 ? allUsers : users
    const total = list.length
    const active = list.filter(u => u.is_active).length
    const inactive = total - active
    const admins = list.filter(u => u.role === 'admin').length
    const staff = total - admins
    const newThisMonth = list.filter(u => {
      if (!u.created_at) return false
      const created = new Date(u.created_at)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length
    return { total, active, inactive, admins, staff, newThisMonth }
  }, [users, allUsers])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage staff accounts and permissions</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 animate-fade-in-up">
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 p-3.5 transition-all duration-200 hover:shadow-premium-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/20">
              <UsersIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums leading-tight">{employeeStats.total}</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 p-3.5 transition-all duration-200 hover:shadow-premium-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight">{employeeStats.active}</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 p-3.5 transition-all duration-200 hover:shadow-premium-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center shadow-md shadow-gray-400/20">
              <UserX className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Inactive</p>
              <p className="text-lg font-bold text-gray-600 dark:text-gray-400 tabular-nums leading-tight">{employeeStats.inactive}</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 p-3.5 transition-all duration-200 hover:shadow-premium-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">New Month</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums leading-tight">{employeeStats.newThisMonth}</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 p-3.5 transition-all duration-200 hover:shadow-premium-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Admins</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums leading-tight">{employeeStats.admins}</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 p-3.5 transition-all duration-200 hover:shadow-premium-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
              <UserCog className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Staff</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight">{employeeStats.staff}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400" />
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by name, username, email or employee ID..."
              className="input-field pl-10 pr-9"
            />
              {search && (
                <button type="button" onClick={() => { setSearch(''); setPage(1); fetchUsers(1, '') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="select-field w-full sm:w-40"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="select-field w-full sm:w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={handleSearch} className="btn-primary">
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
            <div className="overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle px-6">
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
                        <td className="table-cell">
                          {user.employee_id ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-mono font-semibold border border-gray-200 dark:border-gray-700 shadow-sm">
                              <BadgeCheck className="w-3 h-3 text-primary-500" />
                              {user.employee_id}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                          )}
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-primary-500/20 ring-2 ring-primary-500/10 dark:ring-primary-400/10 transition-transform duration-200 group-hover:scale-105">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{user.full_name}</span>
                          </div>
                        </td>
                        <td className="table-cell font-mono text-xs text-gray-600 dark:text-gray-400">{user.username}</td>
                        <td className="table-cell text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="table-cell">
                          {user.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-medium shadow-sm shadow-indigo-500/20">
                              <ShieldCheck className="w-3 h-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-medium shadow-sm shadow-emerald-500/20">
                              Staff
                            </span>
                          )}
                        </td>
                        <td className="table-cell">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium ring-1 ring-emerald-200/50 dark:ring-emerald-700/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium ring-1 ring-gray-200/50 dark:ring-gray-700/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="table-cell">
                          {user.last_login ? (
                            <span className="inline-flex items-center gap-1.5 text-muted">
                              <Clock className="w-3 h-3" />
                              {new Date(user.last_login).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-hint italic">Never</span>
                          )}
                        </td>
                        <td className="table-cell text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setProfileUser(user)}
                              className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200 active:scale-90 hover:shadow-premium-sm"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            </button>
                            <button
                              onClick={() => openEdit(user)}
                              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 active:scale-90 hover:shadow-premium-sm"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              onClick={() => setConfirmToggle(user)}
                              className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200 active:scale-90 hover:shadow-premium-sm"
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {user.is_active
                                ? <PowerOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                : <Power className="w-4 h-4 text-green-600 dark:text-green-400" />
                              }
                            </button>
                            <button
                              onClick={() => setResetPasswordId(user.id)}
                              className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200 active:scale-90 hover:shadow-premium-sm"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => setConfirmDelete(user)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 active:scale-90 hover:shadow-premium-sm"
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
            </div>
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      {!requestsLoading && resetRequests.length > 0 && (
        <div className="card relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-500" />
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="section-title">Password Reset Requests</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium ring-1 ring-amber-200/50 dark:ring-amber-700/30">{resetRequests.length} pending</span>
          </div>
          <div className="space-y-2">
            {resetRequests.map((req) => (
              <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50/50 dark:bg-amber-900/5 rounded-xl border border-amber-200/50 dark:border-amber-700/20 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all duration-200 hover:shadow-premium-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{req.user_full_name || req.username_input}</p>
                    <p className="text-muted truncate">
                      <span className="font-mono">{req.username_input}</span>{req.email_input ? <span className="text-gray-300 dark:text-gray-600 mx-1">/</span> : ''}{req.email_input ? <span>{req.email_input}</span> : ''}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                      {new Date(req.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { setApproveModal(req); setApprovePassword('') }} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-medium rounded-lg shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.97] transition-all duration-200">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => { setRejectModal(req); setRejectNotes('') }} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-all duration-200 active:scale-[0.97]">
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
        <div className="relative">
          <div className="absolute -top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-red-500" />
          <div className="flex items-center gap-3 mb-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{confirmDelete?.full_name}</strong>?
              </p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">This action cannot be undone.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmDelete(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDelete(confirmDelete!)} className="btn-danger">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!confirmToggle} onClose={() => setConfirmToggle(null)} title={confirmToggle?.is_active ? 'Confirm Deactivate' : 'Confirm Activate'} size="sm">
        <div className="relative">
          <div className={`absolute -top-6 left-0 right-0 h-0.5 bg-gradient-to-r ${confirmToggle?.is_active ? 'from-yellow-400 to-yellow-500' : 'from-primary-400 to-primary-500'}`} />
          <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl border ${confirmToggle?.is_active ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/20' : 'bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/20'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${confirmToggle?.is_active ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-primary-100 dark:bg-primary-900/30'}`}>
              {confirmToggle?.is_active ? <PowerOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400" /> : <Power className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to {confirmToggle?.is_active ? 'deactivate' : 'activate'} <strong className="text-gray-900 dark:text-white">{confirmToggle?.full_name}</strong>?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmToggle(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleToggleStatus(confirmToggle!)} className={`inline-flex items-center gap-2 px-5 py-2.5 ${confirmToggle?.is_active ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/30' : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30'} text-white text-sm font-medium rounded-xl active:scale-[0.97] transition-all duration-200`}>
              {confirmToggle?.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
              {confirmToggle?.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!resetPasswordId} onClose={() => { setResetPasswordId(null); setNewPassword('') }} title="Reset Password" size="sm">
        <div className="relative">
          <div className="absolute -top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-500" />
          <div className="flex items-center gap-3 mb-4 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set a new password for this user. The user will need to use this password on next login.
              </p>
            </div>
          </div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 6 characters)"
            className="input-field focus:ring-purple-500/20 focus:border-purple-400/50"
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => { setResetPasswordId(null); setNewPassword('') }} className="btn-secondary">Cancel</button>
            <button onClick={handleResetPassword} disabled={newPassword.length < 6} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 disabled:from-purple-500/50 disabled:to-purple-600/50 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.97] transition-all duration-200 disabled:cursor-not-allowed">
              <Key className="w-4 h-4" /> Reset Password
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!approveModal} onClose={() => setApproveModal(null)} title="Approve Password Reset" size="sm">
        <div className="relative">
          <div className="absolute -top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500" />
          <div className="flex items-center gap-3 mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set a temporary password for <strong className="text-gray-900 dark:text-white">{approveModal?.user_full_name || approveModal?.username_input}</strong>.
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">User will be required to change on next login.</p>
            </div>
          </div>
          <input
            type="password"
            value={approvePassword}
            onChange={(e) => setApprovePassword(e.target.value)}
            placeholder="Temporary password (min 6 characters)"
            className="input-field focus:ring-emerald-500/20 focus:border-emerald-400/50"
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setApproveModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleApproveReset} disabled={approvePassword.length < 6} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-emerald-500/50 disabled:to-emerald-600/50 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.97] transition-all duration-200 disabled:cursor-not-allowed">
              <CheckCircle className="w-4 h-4" /> Approve &amp; Set Password
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Password Reset" size="sm">
        <div className="relative">
          <div className="absolute -top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-red-500" />
          <div className="flex items-center gap-3 mb-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reject request for <strong className="text-gray-900 dark:text-white">{rejectModal?.user_full_name || rejectModal?.username_input}</strong>?
              </p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">Optionally provide a reason below.</p>
            </div>
          </div>
          <textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Optional rejection notes..."
            className="input-field resize-none focus:ring-red-500/20 focus:border-red-400/50"
            rows={3}
          />
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setRejectModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleRejectReset} className="btn-danger">
              <XCircle className="w-4 h-4" /> Reject Request
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!profileUser} onClose={() => setProfileUser(null)} title="Employee Profile" size="lg">
        {profileUser && (
          <div className="relative animate-fade-in">
            <div className="absolute -top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-500" />
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-3 shrink-0 w-full sm:w-48">
                <div className="w-28 h-28 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-primary-500/25 ring-4 ring-primary-500/10 dark:ring-primary-400/10">
                  {profileUser.full_name.charAt(0).toUpperCase()}
                </div>
                {profileUser.employee_id && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-mono font-semibold border border-gray-200 dark:border-gray-700 shadow-sm">
                    <BadgeCheck className="w-3.5 h-3.5 text-primary-500" />
                    {profileUser.employee_id}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  {profileUser.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-medium shadow-sm shadow-indigo-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-medium shadow-sm shadow-emerald-500/20">
                      Staff
                    </span>
                  )}
                  {profileUser.is_active ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium ring-1 ring-emerald-200/50 dark:ring-emerald-700/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium ring-1 ring-gray-200/50 dark:ring-gray-700/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 w-full space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profileUser.full_name}</h2>
                  <p className="text-secondary">@{profileUser.username}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profileUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted">Phone</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{profileUser.phone || <span className="text-gray-400 italic">Not set</span>}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted">Joined</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {profileUser.created_at ? new Date(profileUser.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : <span className="text-gray-400 italic">Unknown</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted">Last Login</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {profileUser.last_login ? new Date(profileUser.last_login).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : <span className="text-gray-400 italic">Never</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setProfileUser(null)} className="btn-secondary">Close</button>
              <button onClick={() => { setProfileUser(null); openEdit(profileUser) }} className="btn-primary">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
