import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export default function EmptyState({
  title = 'No data found',
  description = 'There are no items to display.',
  icon,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-up">
      <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl flex items-center justify-center mb-5 shadow-premium-sm ring-1 ring-gray-200/50 dark:ring-gray-700/50">
        <div className="text-gray-300 dark:text-gray-600">
          {icon || <Inbox className="w-10 h-10" />}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm leading-relaxed">{description}</p>
      {action && <div className="animate-fade-in">{action}</div>}
    </div>
  )
}
