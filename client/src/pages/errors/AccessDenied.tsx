import { ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AccessDenied() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="text-center max-w-md animate-fade-in-up">
        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
          <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">403</h1>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          You do not have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.97]">
            Go Back
          </button>
          <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97] transition-all duration-200">
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
