import { ModeToggle } from '@/components/mode-toggle'

export function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">© 2025 SabiRoad</span>
          <ModeToggle />
        </div>
      </div>
    </footer>
  )
}
