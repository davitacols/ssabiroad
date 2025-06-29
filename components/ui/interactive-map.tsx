interface InteractiveMapProps {
  className?: string
}

export function InteractiveMap({ className = "" }: InteractiveMapProps) {
  return (
    <div className={`w-full h-full rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 to-indigo-950 flex items-center justify-center ${className}`}>
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Interactive Map</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Map will load here with discovered locations</p>
      </div>
    </div>
  )
}