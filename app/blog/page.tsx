'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Bookmark, MoreHorizontal, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AuthModal } from '@/components/auth-modal'

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({ id: payload.userId, email: payload.email })
    }
  }, [])

  useEffect(() => {
    fetch('/api/blog')
      .then(res => res.json())
      .then(data => {
        setPosts(data)
        setLoading(false)
      })
  }, [])

  const handleLike = async (postId: string) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    await fetch(`/api/blog/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    const res = await fetch('/api/blog')
    const data = await res.json()
    setPosts(data)
  }

  const featuredPost = posts[0]
  const regularPosts = posts.slice(1)

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-10 w-auto" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/blog" className="text-sm font-medium">Stories</Link>
            {user && <Link href="/blog/create" className="text-sm text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white">Write</Link>}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm">{user.email}</span>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => { document.cookie = 'token=; Max-Age=0'; window.location.reload(); }}>Sign Out</Button>
              </div>
            ) : (
              <Button size="sm" className="rounded-full" asChild><Link href="/login">Sign In</Link></Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-stone-200 dark:border-stone-800 bg-amber-50 dark:bg-amber-950/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-medium">TRENDING ON PIC2NAV</span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {posts.slice(0, 3).map((post, i) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <div className="flex gap-4">
                  <span className="text-3xl font-bold text-stone-300">0{i + 1}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-stone-300" />
                      <span className="text-sm font-medium">{post.author.name}</span>
                    </div>
                    <h3 className="font-bold group-hover:underline line-clamp-2">{post.title}</h3>
                    <div className="text-sm text-stone-600 mt-2">{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Posts */}
          <div className="lg:col-span-2 space-y-12">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-stone-600 mb-4">No posts yet</p>
                <Button asChild><Link href="/blog/create">Create First Post</Link></Button>
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="group">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="flex gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-stone-300" />
                          <span className="text-sm font-medium">{post.author.name}</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 group-hover:underline line-clamp-2">{post.title}</h2>
                        <p className="text-stone-600 dark:text-stone-400 mb-4 line-clamp-2">{post.excerpt}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-stone-600">
                            <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span>·</span>
                            <span>{Math.ceil(post.content.length / 1000)} min read</span>
                            <span className="px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-full text-xs">{post.category}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <button onClick={(e) => { e.preventDefault(); handleLike(post.id); }} className="flex items-center gap-1 text-stone-600 hover:text-stone-900">
                              <Heart className="h-4 w-4" />
                              <span className="text-sm">{post.likes}</span>
                            </button>
                            <button className="flex items-center gap-1 text-stone-600 hover:text-stone-900">
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-sm">{post._count.comments}</span>
                            </button>
                            <button className="text-stone-600 hover:text-stone-900">
                              <Bookmark className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      {post.coverImage && (
                        <img src={post.coverImage} alt={post.title} className="w-32 h-32 object-cover rounded" />
                      )}
                    </div>
                  </Link>
                </article>
              ))
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <div>
              <h3 className="font-bold mb-4">Recommended topics</h3>
              <div className="flex flex-wrap gap-2">
                {['Tutorial', 'Guide', 'Safety', 'News'].map(tag => (
                  <button key={tag} className="px-4 py-2 bg-stone-100 dark:bg-stone-800 rounded-full text-sm hover:bg-stone-200 dark:hover:bg-stone-700">{tag}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4">Who to follow</h3>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stone-300" />
                      <div>
                        <div className="font-medium text-sm">Pic2Nav Team</div>
                        <div className="text-xs text-stone-600">Location experts</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-full">Follow</Button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={() => window.location.reload()} 
      />
    </div>
  )
}
