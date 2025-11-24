"use client"

import { ImageBatchProcessor } from "@/components/pic2nav/image-batch-processor"

export default function BatchPage() {
  const handleBatchComplete = (results: any[]) => {
    console.log('Batch processing completed:', results)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Batch Image Processing
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Process multiple images simultaneously to identify locations
          </p>
        </div>
        
        <ImageBatchProcessor 
          onBatchComplete={handleBatchComplete}
          maxFiles={20}
        />
      </div>
    </div>
  )
}