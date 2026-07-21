import { useState, useEffect } from 'react'
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../../services/dataService'
import { Notification } from '../../types'

const typeConfig = {
  info: { icon: Info, color: 'text-blue-500 bg-blue-100' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500 bg-yellow-100' },
  success: { icon: CheckCircle, color: 'text-green-500 bg-green-100' },
  danger: { icon: XCircle, color: 'text-red-500 bg-red-100' },
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await notificationService.getAll()
      setNotifications(res.data.notifications)
    } catch { console.error('Failed to fetch notifications'); toast.error('Failed to load notifications') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleMarkRead = async (id: number, link?: string | null) => {
    try {
      await notificationService.markRead(id)
      if (link) navigate(link)
      else fetchData()
    } catch { console.error('Failed to mark notification as read'); toast.error('Failed to mark as read') }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All marked as read')
    } catch { console.error('Failed to mark all notifications as read'); toast.error('Failed to mark all as read') }
  }

  const handleGenerateAlerts = async () => {
    try {
      await notificationService.generateAlerts()
      toast.success('Alerts generated')
      fetchData()
    } catch { console.error('Failed to generate alerts'); toast.error('Failed to generate alerts') }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">System alerts and updates</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleGenerateAlerts} className="btn-secondary">
            <Bell className="w-4 h-4" /> Generate Alerts
          </button>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-primary">
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-500" />
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const config = typeConfig[n.type] || typeConfig.info
              const Icon = config.icon
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 animate-fade-in ${
                    n.is_read
                      ? 'bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                      : 'bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/10 dark:to-gray-900 border border-primary-100 dark:border-primary-800/30 hover:shadow-md'
                  }`}
                  onClick={() => !n.is_read && handleMarkRead(n.id, n.link)}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{n.title}</p>
                    {n.message && <p className="text-muted mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="text-hint mt-1.5">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="flex-shrink-0 w-2.5 h-2.5 bg-primary-500 rounded-full mt-2 animate-pulse-soft shadow-sm shadow-primary-500/30" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
