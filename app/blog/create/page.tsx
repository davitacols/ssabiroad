'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RichTextEditor } from '@/components/rich-text-editor'

export default function CreateBlogPost() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Tutorial')
  const [coverImage, setCoverImage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/blog/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      setCoverImage(data.url)
    } catch (error) {
      alert('Upload failed')
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          coverImage,
          category,
          authorId: 'default-user-id', // Replace with actual user ID from session
        }),
      })

      if (res.ok) {
        router.push('/blog')
      } else {
        alert('Failed to create post')
      }
    } catch (error) {
      alert('Error creating post')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0a0a0a]">
      <nav className="sticky top-0 z-50 border-b border-stone-200/50 dark:border-stone-800/50 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-12 sm:h-14 md:h-16 w-auto" />
          </Link>
          <Button variant="ghost" className="rounded-full" asChild>
            <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
          </Button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Create New Post</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900"
            >
              <option>Tutorial</option>
              <option>Guide</option>
              <option>Safety</option>
              <option>News</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cover Image</label>
            <div className="flex gap-4 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="cover-upload"
              />
              <label htmlFor="cover-upload">
                <Button type="button" variant="outline" className="rounded-full" asChild>
                  <span><Upload className="mr-2 h-4 w-4" />{uploading ? 'Uploading...' : 'Upload Image'}</span>
                </Button>
              </label>
              {coverImage && <img src={coverImage} alt="Cover" className="h-20 w-20 object-cover rounded-lg" />}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>

          <Button type="submit" className="rounded-full" disabled={submitting}>
            {submitting ? 'Publishing...' : 'Publish Post'}
          </Button>
        </form>
      </div>
    </div>
  )
}
