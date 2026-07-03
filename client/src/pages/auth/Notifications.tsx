import { useState, useEffect } from 'react'
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { notificationService } from '../../services/dataService'
import { Notification } from '../../types'

const typeConfig = {
  info: { icon: Info, color: 'text-blue-500 bg-blue-100' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500 bg-yellow-100' },
  success: { icon: CheckCircle, color: 'text-green-500 bg-green-100' },
  danger: { icon: XCircle, color: 'text-red-500 bg-red-100' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await notificationService.getAll()
      setNotifications(res.data.notifications)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch { }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All marked as read')
    } catch { }
  }

  const handleGenerateAlerts = async () => {
    try {
      await notificationService.generateAlerts()
      toast.success('Alerts generated')
      fetchData()
    } catch { }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-500 mt-1">System alerts and updates</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleGenerateAlerts} className="btn-secondary text-sm">Generate Alerts</button>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-primary text-sm flex items-center gap-1">
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16 w-full" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const config = typeConfig[n.type] || typeConfig.info
              const Icon = config.icon
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                    n.is_read ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800 border-l-4 border-primary-500'
                  }`}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{n.title}</p>
                    {n.message && <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 bg-primary-500 rounded-full mt-2" />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
