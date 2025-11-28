'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Bookmark, MoreHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AuthModal } from '@/components/auth-modal'
import { ThemeToggle } from '@/components/theme-toggle'
import Head from 'next/head'

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [recentPosts, setRecentPosts] = useState<any[]>([])
  const [relatedPosts, setRelatedPosts] = useState<any[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({ id: payload.userId, email: payload.email })
    }
  }, [])

  const loadData = () => {
    fetch('/api/blog')
      .then(res => res.json())
      .then(data => {
        const foundPost = data.find((p: any) => p.slug === slug)
        setPost(foundPost)
        setRecentPosts(data.slice(0, 4))
        if (foundPost) {
          setRelatedPosts(data.filter((p: any) => p.id !== foundPost.id && p.category === foundPost.category).slice(0, 3))
          return fetch(`/api/blog/comments?postId=${foundPost.id}`)
        }
      })
      .then(res => res?.json())
      .then(data => {
        if (data) setComments(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [slug])

  const handlePostLike = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    await fetch(`/api/blog/${post.id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    loadData()
  }

  const handleCommentLike = async (commentId: string) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    await fetch(`/api/blog/comments/${commentId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    loadData()
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setShowAuthModal(true)
      return
    }
    if (!commentText.trim()) return

    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText,
          authorId: user.id,
          postId: post.id,
        }),
      })

      if (res.ok) {
        const newComment = await res.json()
        setComments([newComment, ...comments])
        setCommentText('')
      }
    } catch (error) {
      alert('Failed to post comment')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!post) {
    return <div className="min-h-screen flex items-center justify-center">Post not found</div>
  }

  const canonicalUrl = `https://ssabiroad.vercel.app/blog/${post.slug}`
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.coverImage || "https://ssabiroad.vercel.app/pic2nav.png",
    "author": {
      "@type": "Person",
      "name": post.author.name
    },
    "publisher": {
      "@type": "Organization",
      "name": "SSABIRoad",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ssabiroad.vercel.app/pic2nav.png"
      }
    },
    "datePublished": post.createdAt,
    "dateModified": post.updatedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = `${post.title} | SSABIRoad Blog`
      
      const metaTags = [
        { property: 'og:title', content: post.title },
        { property: 'og:description', content: post.excerpt },
        { property: 'og:image', content: post.coverImage || 'https://ssabiroad.vercel.app/pic2nav.png' },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:type', content: 'article' },
        { property: 'article:published_time', content: post.createdAt },
        { property: 'article:author', content: post.author.name },
        { property: 'article:section', content: post.category },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: post.title },
        { name: 'twitter:description', content: post.excerpt },
        { name: 'twitter:image', content: post.coverImage || 'https://ssabiroad.vercel.app/pic2nav.png' },
        { name: 'description', content: post.excerpt },
        { name: 'keywords', content: `${post.category}, navigation, maps, location, ${post.title.toLowerCase().split(' ').slice(0, 5).join(', ')}` }
      ]

      metaTags.forEach(tag => {
        const existing = document.querySelector(`meta[${tag.property ? 'property' : 'name'}="${tag.property || tag.name}"]`)
        if (existing) {
          existing.setAttribute('content', tag.content)
        } else {
          const meta = document.createElement('meta')
          if (tag.property) meta.setAttribute('property', tag.property)
          if (tag.name) meta.setAttribute('name', tag.name)
          meta.setAttribute('content', tag.content)
          document.head.appendChild(meta)
        }
      })

      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', canonicalUrl)
    }
  }, [post])

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Header */}
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-10 w-auto" />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/blog" className="text-xs sm:text-sm font-medium">Stories</Link>
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm hidden md:inline">{user.email}</span>
                <Button size="sm" variant="outline" className="rounded-full text-xs sm:text-sm" onClick={() => { document.cookie = 'token=; Max-Age=0'; window.location.reload(); }}>Sign Out</Button>
              </div>
            ) : (
              <Button size="sm" className="rounded-full text-xs sm:text-sm" asChild><Link href="/login">Sign In</Link></Button>
            )}
          </nav>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16 flex flex-col lg:flex-row gap-12 lg:gap-16">
        <article className="flex-1 w-full lg:max-w-[780px] mx-auto">
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl leading-tight font-bold tracking-tight mb-6">{post.title}</h1>
        
        {/* Author & Meta */}
        <div className="flex items-center gap-4 py-8 border-b border-stone-200 dark:border-stone-800">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {post.author.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="font-medium">{post.author.name}</div>
            <div className="text-sm text-stone-600 dark:text-stone-400">
              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {Math.ceil(post.content.length / 1000)} min read
            </div>
          </div>
          <Button 
            size="sm" 
            variant={isFollowing ? "default" : "outline"} 
            className="rounded-full"
            onClick={() => {
              if (!user) {
                setShowAuthModal(true)
                return
              }
              setIsFollowing(!isFollowing)
            }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between py-6 border-b border-stone-200 dark:border-stone-800 mb-12">
          <div className="flex items-center gap-6">
            <button onClick={handlePostLike} className="flex items-center gap-2 text-stone-600 hover:text-stone-900">
              <Heart className="h-6 w-6" />
              <span className="text-sm">{post.likes}</span>
            </button>
            <button className="flex items-center gap-2 text-stone-600 hover:text-stone-900">
              <MessageCircle className="h-6 w-6" />
              <span className="text-sm">{comments.length}</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (!user) {
                  setShowAuthModal(true)
                  return
                }
                setIsBookmarked(!isBookmarked)
              }}
              className={`${isBookmarked ? 'text-stone-900' : 'text-stone-600'} hover:text-stone-900`}
            >
              <Bookmark className={`h-6 w-6 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button className="text-stone-600 hover:text-stone-900">
              <MoreHorizontal className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-12 pb-8 border-b border-stone-200 dark:border-stone-800">
          <span className="text-sm text-stone-600 dark:text-stone-400 w-full sm:w-auto mb-2 sm:mb-0">Share:</span>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-black text-white hover:bg-stone-800 transition-colors text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#1877F2] text-white hover:bg-[#166FE5] transition-colors text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent('*' + post.title + '*\n\n' + post.excerpt + '\n\nRead more: ' + window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#25D366] text-white hover:bg-[#1DA851] transition-colors text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            WhatsApp
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('Link copied to clipboard!')
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Copy Link
          </button>
        </div>

        {/* Cover Image */}
        {post.coverImage && (
          <img src={post.coverImage} alt={post.title} className="w-full mb-16 rounded-lg" loading="eager" />
        )}
        
        {/* Content */}
        <div 
          className="prose prose-lg max-w-none mb-16"
          style={{ 
            fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
            fontSize: '20px',
            lineHeight: '1.8',
            color: '#242424'
          }}
          dangerouslySetInnerHTML={{ __html: post.content }}
          itemProp="articleBody"
        />

        {/* Comments */}
        <div className="border-t border-stone-200 dark:border-stone-800 pt-16">
          <h2 className="text-3xl font-bold mb-10">Responses ({comments.length})</h2>
          
          <form onSubmit={handleCommentSubmit} className="mb-16">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-300 flex-shrink-0" />
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="What are your thoughts?"
                  className="w-full px-0 py-2 border-0 border-b border-stone-200 dark:border-stone-800 focus:border-stone-900 focus:ring-0 text-sm"
                  rows={2}
                />
                <div className="flex justify-end mt-3">
                  <Button type="submit" size="sm" className="rounded-full">Respond</Button>
                </div>
              </div>
            </div>
          </form>

          <div className="space-y-10">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-300 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{comment.author.name}</span>
                    <span className="text-sm text-stone-500">
                      {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-stone-800 dark:text-stone-200 mb-3">{comment.content}</p>
                  <div className="flex items-center gap-4 text-sm text-stone-600">
                    <button onClick={() => handleCommentLike(comment.id)} className="flex items-center gap-1 hover:text-stone-900">
                      <Heart className="h-4 w-4" />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="hover:text-stone-900">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* Sidebar */}
      <aside className="w-full lg:w-96 lg:block">
        {/* Author Profile */}
        <div className="sticky top-24 space-y-10">
          <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              {post.author.name.charAt(0)}
            </div>
            <h3 className="font-bold text-center mb-2">{post.author.name}</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 text-center mb-4">
              Writer sharing insights on navigation technology and innovation
            </p>
            <Button 
              size="sm" 
              className="w-full rounded-full"
              variant={isFollowing ? "default" : "outline"}
              onClick={() => {
                if (!user) {
                  setShowAuthModal(true)
                  return
                }
                setIsFollowing(!isFollowing)
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div>
              <h3 className="font-bold mb-4">Related Stories</h3>
              <div className="space-y-4">
                {relatedPosts.map((p) => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="block group">
                    <h4 className="font-medium text-sm group-hover:underline mb-1">{p.title}</h4>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Posts */}
          <div>
            <h3 className="font-bold mb-4">Recent Posts</h3>
            <div className="space-y-4">
              {recentPosts.slice(0, 3).map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="block group">
                  <h4 className="font-medium text-sm group-hover:underline mb-1">{p.title}</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={() => window.location.reload()} 
      />
    </div>
  )
}
