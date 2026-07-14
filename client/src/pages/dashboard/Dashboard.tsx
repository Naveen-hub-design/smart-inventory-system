import { useAuth } from '../../context/AuthContext'
import AdminDashboard from './AdminDashboard'
import StaffDashboard from './StaffDashboard'

export default function Dashboard() {
  const { isAdmin, user } = useAuth()

  if (!user) return null

  if (isAdmin) {
    return <AdminDashboard />
  }

  return <StaffDashboard />
}
