'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Image as ImageIcon, Link as LinkIcon, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function RichTextEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Typography,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write your story...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain')
        if (text) {
          const getSiteName = (url: string) => {
            const siteNames: Record<string, string> = {
              'pic2nav.com': 'Pic2Nav',
              'ssabiroad.vercel.app': 'SSABIRoad',
              'github.com': 'GitHub',
              'medium.com': 'Medium',
              'twitter.com': 'Twitter',
              'linkedin.com': 'LinkedIn'
            }
            const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
            return siteNames[domain] || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
          }
          
          const lines = text.split('\n\n')
          const html = lines.map(line => {
            const trimmed = line.trim()
            if (!trimmed) return ''
            
            if (/^\d+\.\s+[A-Z]/.test(trimmed) && trimmed.length < 100) {
              const withLinks = trimmed.replace(/(https?:\/\/[^\s)]+)/g, (url) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer">${getSiteName(url)}</a>`
              })
              return `<h2>${withLinks}</h2>`
            }
            
            if (trimmed.length < 100 && /^[A-Z][^.!?]*$/.test(trimmed) && !/^(The|A|An)\s/.test(trimmed)) {
              const withLinks = trimmed.replace(/(https?:\/\/[^\s)]+)/g, (url) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer">${getSiteName(url)}</a>`
              })
              return `<h2>${withLinks}</h2>`
            }
            
            const withLinks = trimmed.replace(/(https?:\/\/[^\s)]+)/g, (url) => {
              return `<a href="${url}" target="_blank" rel="noopener noreferrer">${getSiteName(url)}</a>`
            })
            return `<p>${withLinks}</p>`
          }).filter(Boolean).join('')
          
          const { state } = view
          const { tr } = state
          tr.replaceSelectionWith(state.schema.text(''))
          view.dispatch(tr)
          editor?.commands.insertContent(html)
          return true
        }
        return false
      },
    },
  })

  if (!mounted) return <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 min-h-[400px]">Loading editor...</div>

  const addImage = () => {
    const url = prompt('Enter image URL:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = prompt('Enter URL:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  if (!editor) return null

  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={addLink}>
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="bg-white dark:bg-stone-950" />
    </div>
  )
}
