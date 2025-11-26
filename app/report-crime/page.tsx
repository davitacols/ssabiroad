"use client"

import { useState, useRef } from "react"
import { Camera, Upload, AlertTriangle, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function ReportCrimePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [description, setDescription] = useState("")
  const [contactInfo, setContactInfo] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return
    const newFiles = Array.from(selectedFiles).slice(0, 5) // Max 5 files
    setFiles(prev => [...prev, ...newFiles].slice(0, 5))
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) {
      toast({ title: "Error", description: "Please upload at least one file", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      formData.append('description', description)
      formData.append('contactInfo', isAnonymous ? '' : contactInfo)
      formData.append('isAnonymous', isAnonymous.toString())

      const response = await fetch('/api/report-crime', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        toast({ title: "Report Submitted", description: `Report ID: ${data.reportId}` })
        setFiles([])
        setDescription("")
        setContactInfo("")
      } else {
        throw new Error('Failed to submit report')
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit report", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-black">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-stone-200/50 dark:border-stone-800/50 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-12 sm:h-14 md:h-16 w-auto object-contain drop-shadow-lg" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/camera" className="text-sm hover:underline">Scanner</Link>
            <Button className="rounded-full bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2">
              <Phone className="w-4 h-4 mr-2" />
              Emergency: 199/911
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Warning */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">Emergency Situations</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                If this is an emergency, call 199 or 911 immediately. This form is for non-emergency crime reporting only.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Report Crime</h1>
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            Upload photos or videos of crime scenes to help authorities with location identification and evidence.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Evidence Files (Photos/Videos) *
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-lg p-8 text-center hover:border-stone-400 dark:hover:border-stone-600 transition-colors cursor-pointer"
              >
                <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  Click to upload photos or videos (Max 5 files, 10MB each)
                </p>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-stone-100 dark:bg-stone-800 p-2 rounded">
                      <span className="text-sm text-stone-700 dark:text-stone-300">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Description *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, when, and any other relevant details..."
                className="min-h-[120px]"
                required
              />
            </div>

            {/* Anonymous Option */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="anonymous" className="text-sm text-stone-700 dark:text-stone-300">
                Submit anonymously
              </label>
            </div>

            {/* Contact Info */}
            {!isAnonymous && (
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Contact Information (Optional)
                </label>
                <Input
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Phone number or email for follow-up"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || files.length === 0}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? "Submitting Report..." : "Submit Crime Report"}
            </Button>
          </form>

          <div className="mt-6 text-xs text-stone-500 dark:text-stone-400">
            <p>• Reports are processed by local authorities</p>
            <p>• Location data will be extracted from uploaded files</p>
            <p>• All submissions are encrypted and secure</p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </div>
  )
}