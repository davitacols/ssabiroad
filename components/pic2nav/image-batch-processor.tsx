"use client"

import { useState, useCallback } from "react"
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface BatchResult {
  id: string
  file: File
  status: 'pending' | 'processing' | 'success' | 'error'
  result?: any
  error?: string
  progress?: number
}

interface ImageBatchProcessorProps {
  onBatchComplete: (results: BatchResult[]) => void
  maxFiles?: number
}

export function ImageBatchProcessor({ onBatchComplete, maxFiles = 10 }: ImageBatchProcessorProps) {
  const [files, setFiles] = useState<BatchResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)

  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const fileArray = Array.from(selectedFiles).slice(0, maxFiles)
    const batchResults: BatchResult[] = fileArray.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      status: 'pending'
    }))
    setFiles(batchResults)
  }, [maxFiles])

  const processFiles = useCallback(async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    const updatedFiles = [...files]

    for (let i = 0; i < updatedFiles.length; i++) {
      const fileResult = updatedFiles[i]
      fileResult.status = 'processing'
      setFiles([...updatedFiles])

      try {
        const formData = new FormData()
        formData.append("image", fileResult.file)
        formData.append("analyzeLandmarks", "true")

        const response = await fetch('/api/location-recognition-v2', {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error(`API error: ${response.status}`)

        const data = await response.json()
        fileResult.result = data
        fileResult.status = data.success ? 'success' : 'error'
        fileResult.error = data.success ? undefined : data.error

      } catch (error) {
        fileResult.status = 'error'
        fileResult.error = error instanceof Error ? error.message : "Processing failed"
      }

      setOverallProgress(((i + 1) / updatedFiles.length) * 100)
      setFiles([...updatedFiles])
    }

    setIsProcessing(false)
    onBatchComplete(updatedFiles)
  }, [files, onBatchComplete])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setFiles([])
    setOverallProgress(0)
  }, [])

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <Card className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Batch Image Processing</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Select up to {maxFiles} images to process simultaneously
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              id="batch-upload"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            />
            <Button asChild>
              <label htmlFor="batch-upload" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Select Images
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Selected Images ({files.length})</h4>
              <div className="flex gap-2">
                <Button
                  onClick={processFiles}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Process All'
                  )}
                </Button>
                <Button onClick={clearAll} variant="outline" disabled={isProcessing}>
                  Clear All
                </Button>
              </div>
            </div>

            {isProcessing && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
            )}

            <div className="space-y-3">
              {files.map((fileResult) => (
                <div key={fileResult.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex-shrink-0">
                    {fileResult.status === 'pending' && (
                      <div className="h-8 w-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                        <span className="text-xs">⏳</span>
                      </div>
                    )}
                    {fileResult.status === 'processing' && (
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      </div>
                    )}
                    {fileResult.status === 'success' && (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    )}
                    {fileResult.status === 'error' && (
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fileResult.file.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {(fileResult.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {fileResult.result?.name && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Found: {fileResult.result.name}
                      </p>
                    )}
                    {fileResult.error && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Error: {fileResult.error}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={
                      fileResult.status === 'success' ? 'default' :
                      fileResult.status === 'error' ? 'destructive' :
                      fileResult.status === 'processing' ? 'secondary' : 'outline'
                    }>
                      {fileResult.status}
                    </Badge>
                    
                    {!isProcessing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(fileResult.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}