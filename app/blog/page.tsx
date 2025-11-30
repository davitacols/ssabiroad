'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Bookmark, MoreHorizontal, TrendingUp, Search, Share2, Twitter, Facebook, Linkedin, Copy, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AuthModal } from '@/components/auth-modal'
import { ThemeToggle } from '@/components/theme-toggle'
import { NewsletterSignup } from '@/components/newsletter-signup'

export default function BlogPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const postsPerPage = 10

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'Blog - Stories & Insights | SSABIRoad'
      
      const metaTags = [
        { name: 'description', content: 'Explore stories, tutorials, and insights about navigation, maps, location technology, and building analysis on SSABIRoad blog.' },
        { name: 'keywords', content: 'navigation blog, map reading, location technology, building analysis, SSABIRoad, Pic2Nav, tutorials, guides' },
        { property: 'og:title', content: 'Blog - Stories & Insights | SSABIRoad' },
        { property: 'og:description', content: 'Explore stories, tutorials, and insights about navigation, maps, location technology, and building analysis.' },
        { property: 'og:url', content: 'https://ssabiroad.vercel.app/blog' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: 'https://ssabiroad.vercel.app/pic2nav.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Blog - Stories & Insights | SSABIRoad' },
        { name: 'twitter:description', content: 'Explore stories, tutorials, and insights about navigation, maps, and location technology.' }
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
      canonical.setAttribute('href', 'https://ssabiroad.vercel.app/blog')
    }
  }, [])

  const [posts, setPosts] = useState<any[]>([])
  const [allPosts, setAllPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sharePostId, setSharePostId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSignOut = () => {
    document.cookie = 'token=; Max-Age=0; path=/'
    window.location.href = '/login'
  }

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({ id: payload.userId, email: payload.email })
    }
  }, [])

  useEffect(() => {
    if (currentPage === 1) {
      fetch('/api/blog?page=1&limit=100')
        .then(res => res.json())
        .then(data => setAllPosts(data.posts || []))
    }
  }, [])

  useEffect(() => {
    fetch(`/api/blog?page=${currentPage}&limit=${postsPerPage}`)
      .then(res => res.json())
      .then(data => {
        setPosts(data.posts || data)
        setTotalPages(data.totalPages || 1)
        setLoading(false)
      })
    
    fetch('/api/users/suggested')
      .then(res => res.json())
      .then(data => setSuggestedUsers(data.slice(0, 3)))
      .catch(err => console.error('Error loading users:', err))
  }, [currentPage])

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

  const handleShare = (postSlug: string, platform: string) => {
    const url = `https://pic2nav.com/blog/${postSlug}`
    const text = 'Check out this article on Pic2Nav'
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    }
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
  }

  const featuredPost = posts[0]
  const regularPosts = posts.slice(1)

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "SSABIRoad Blog",
    "description": "Stories, tutorials, and insights about navigation, maps, and location technology",
    "url": "https://ssabiroad.vercel.app/blog",
    "publisher": {
      "@type": "Organization",
      "name": "SSABIRoad",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ssabiroad.vercel.app/pic2nav.png"
      }
    }
  }

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
            <img src="/pic2nav.png" alt="Pic2Nav" className="h-8 sm:h-10 w-auto" />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/blog" className="text-xs sm:text-sm font-medium">Stories</Link>
            {user && <Link href="/blog/create" className="hidden sm:inline text-sm text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white">Write</Link>}
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/profile" className="text-xs sm:text-sm hover:underline hidden md:inline">{user.email}</Link>
                <Button size="sm" variant="outline" className="rounded-full text-xs sm:text-sm" onClick={handleSignOut}>Sign Out</Button>
              </div>
            ) : (
              <Button size="sm" className="rounded-full text-xs sm:text-sm" asChild><Link href="/login">Sign In</Link></Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-stone-200 dark:border-stone-800 bg-amber-50 dark:bg-amber-950/20 py-6 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm font-medium">TRENDING ON PIC2NAV</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {(allPosts.length > 0 ? allPosts : posts).slice(0, 3).map((post, i) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <div className="flex gap-3 sm:gap-4">
                  <span className="text-2xl sm:text-3xl font-bold text-stone-300">0{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-stone-300 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium truncate">{post.author.name}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold group-hover:underline line-clamp-2">{post.title}</h3>
                    <div className="text-xs sm:text-sm text-stone-600 mt-2">{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12">
        <div className="max-w-2xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-12">
          {/* Posts */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-12">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-stone-600 mb-4">No posts yet</p>
                <Button asChild><Link href="/blog/create">Create First Post</Link></Button>
              </div>
            ) : (
              posts
                .filter(post => 
                  (selectedCategory === 'All' || post.category === selectedCategory) &&
                  (searchQuery === '' || 
                    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((post) => (
                <article key={post.id} className="group">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-stone-300 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium truncate">{post.author.name}</span>
                        </div>
                        <h2 className="text-lg sm:text-2xl font-bold mb-2 group-hover:underline line-clamp-2">{post.title}</h2>
                        <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mb-3 sm:mb-4 line-clamp-2">{post.excerpt}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-stone-600 flex-wrap">
                            <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span className="hidden sm:inline">·</span>
                            <span className="hidden sm:inline">{Math.ceil(post.content.length / 1000)} min read</span>
                            <span className="px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-full text-xs">{post.category}</span>
                          </div>
                          <div className="flex items-center gap-3 sm:gap-4">
                            <button onClick={(e) => { e.preventDefault(); handleLike(post.id); }} className="flex items-center gap-1 text-stone-600 hover:text-red-600 transition-colors">
                              <Heart className="h-4 w-4" />
                              <span className="text-xs sm:text-sm">{post.likes}</span>
                            </button>
                            <button className="flex items-center gap-1 text-stone-600 hover:text-blue-600 transition-colors">
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-xs sm:text-sm">{post._count.comments}</span>
                            </button>
                            <button className="text-stone-600 hover:text-yellow-600 transition-colors">
                              <Bookmark className="h-4 w-4" />
                            </button>
                            <div className="relative">
                              <button 
                                onClick={(e) => { e.preventDefault(); setSharePostId(sharePostId === post.slug ? null : post.slug); }}
                                className="text-stone-600 hover:text-green-600 transition-colors"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>
                              {sharePostId === post.slug && (
                                <div className="absolute right-0 mt-2 p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-lg z-10 flex gap-2">
                                  <button onClick={(e) => { e.preventDefault(); handleShare(post.slug, 'twitter'); }} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded">
                                    <Twitter className="h-4 w-4" />
                                  </button>
                                  <button onClick={(e) => { e.preventDefault(); handleShare(post.slug, 'facebook'); }} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded">
                                    <Facebook className="h-4 w-4" />
                                  </button>
                                  <button onClick={(e) => { e.preventDefault(); handleShare(post.slug, 'linkedin'); }} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded">
                                    <Linkedin className="h-4 w-4" />
                                  </button>
                                  <button onClick={(e) => { e.preventDefault(); handleShare(post.slug, 'copy'); }} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded">
                                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {post.coverImage && (
                        <img src={post.coverImage} alt={post.title} className="w-full sm:w-24 md:w-32 h-48 sm:h-24 md:h-32 object-cover rounded flex-shrink-0" />
                      )}
                    </div>
                  </Link>
                </article>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 rounded-lg border ${
                      currentPage === i + 1
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-black'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 sm:space-y-8">
            <div className="p-6 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold mb-3">Subscribe to newsletter</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">Get new posts delivered to your inbox</p>
              <NewsletterSignup />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4">Filter by category</h3>
              <div className="flex flex-wrap gap-2">
                {['All', 'Tutorial', 'Guide', 'Technology', 'News'].map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => setSelectedCategory(tag)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-colors ${
                      selectedCategory === tag 
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-black' 
                        : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            {suggestedUsers.length > 0 && (
              <div className="hidden lg:block">
                <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4">Who to follow</h3>
                <div className="space-y-4">
                  {suggestedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-xs sm:text-sm truncate">{user.name}</div>
                          <div className="text-xs text-stone-600 truncate">{user.bio || 'Writer'}</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-full text-xs flex-shrink-0">Follow</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
