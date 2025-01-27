'use client'

import { useState, useContext, createContext, ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import {
  Navigation,
  Shield,
  Globe,
  Users,
  Menu,
  Star,
  Compass,
  MapPin,
  Github,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// Global Constants
const FEATURES = [
  {
    icon: Navigation,
    title: "Smart AI Navigation",
    description: "Personalized routes that adapt dynamically to your preferences and real-time conditions"
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description: "Cutting-edge encryption and rigorous compliance with global privacy standards"
  },
  {
    icon: Globe,
    title: "Worldwide Coverage",
    description: "Comprehensive high-definition maps spanning every continent with unparalleled precision"
  },
  {
    icon: Users,
    title: "Collaborative Intelligence",
    description: "Seamless real-time route sharing, location tracking, and team insights"
  },
  {
    icon: Compass,
    title: "Unlimited Connectivity",
    description: "Full-featured navigation even in the most remote areas without internet connection"
  },
  {
    icon: MapPin,
    title: "Advanced Waypoint System",
    description: "Interactive markers with rich media, collaborative annotations, and intelligent context"
  }
]

// Authentication Types
interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin' | 'enterprise'
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

// Authentication Context
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  isAuthenticated: false
})

// Map Display Component
export const MapDisplay = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-teal-800 to-indigo-900 rounded-2xl overflow-hidden shadow-2xl">
    <div 
      className="absolute inset-0 opacity-20" 
      style={{
        backgroundImage: `radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '30px 30px'
      }}
    />
    
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 bg-white/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${4 + i * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`
          }}
        />
      ))}
    </div>
    
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        <path 
          d="M20 30 Q50 10 80 40 T120 70" 
          fill="none" 
          stroke="rgba(255,255,255,0.1)" 
          strokeWidth="3" 
          strokeDasharray="8,8"
        />
        <path 
          d="M10 50 Q70 20 130 60" 
          fill="none" 
          stroke="rgba(255,255,255,0.05)" 
          strokeWidth="2" 
          strokeDasharray="6,6"
        />
      </svg>
    </div>
  </div>
)

// Authentication Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include'
        })
        
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Authentication check failed')
      }
    }
    
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setIsAuthenticated(true)
        router.push('/journey')
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error', error)
      return false
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include'
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setIsAuthenticated(true)
        router.push('/journey')
        return true
      } else {
        // More detailed error parsing
        const errorData = await response.json()
        setError(errorData.message || 'Signup failed')
        return false
      }
    } catch (error) {
      console.error('Signup error', error)
      setError('Network or server error occurred')
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setUser(null)
      setIsAuthenticated(false)
      router.push('/')
    } catch (error) {
      console.error('Logout error', error)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Authentication Hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Authentication Dialog Component
const AuthDialog = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { login, signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (isLogin) {
        const success = await login(email, password)
        if (!success) {
          setError('Invalid email or password')
        }
      } else {
        const success = await signup(email, password, name)
        if (!success) {
          setError('Signup failed. Please try again.')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 hover:bg-teal-700 font-bold text-white">
          Start Journey
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isLogin ? 'Login to SabiRoad' : 'Create Your Account'}</DialogTitle>
          <DialogDescription>
            {isLogin 
              ? 'Access your personalized navigation dashboard' 
              : 'Join the intelligent routing revolution'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full p-2 pl-10 border rounded focus:ring-2 focus:ring-teal-500"
                />
                <Users className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full p-2 pl-10 border rounded focus:ring-2 focus:ring-teal-500"
              />
              <Mail className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={8}
                className="w-full p-2 pl-10 border rounded focus:ring-2 focus:ring-teal-500"
              />
              <Lock className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          {error && (
            <div className="flex items-center text-red-600 bg-red-50 p-3 rounded">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isLogin ? 'Login' : 'Create Account'}
          </Button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-teal-600 hover:underline"
            >
              {isLogin 
                ? 'Need an account? Sign Up' 
                : 'Already have an account? Login'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Protected Route Component
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // Optional: Role-based access
  if (user && user.role !== 'user') {
    return <div>Unauthorized Access</div>
  }

  return isAuthenticated ? <>{children}</> : null
}

// Home Page Component
const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed w-full bg-white/90 backdrop-blur-md border-b border-gray-200 z-50">
        <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 text-white rounded-lg flex items-center justify-center">
                <Navigation className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black">
                Sabi<span className="text-indigo-700">Road</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-semibold text-gray-600 hover:text-teal-600 transition-colors">Features</a>
              <a href="#enterprise" className="text-sm font-semibold text-gray-600 hover:text-teal-600 transition-colors">Enterprise</a>
              <a href="#pricing" className="text-sm font-semibold text-gray-600 hover:text-teal-600 transition-colors">Pricing</a>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => logout()}
                  className="font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                >
                  Logout
                </Button>
                <Button 
                  className="bg-teal-600 hover:bg-teal-700 font-bold text-white"
                  onClick={() => router.push('/journey')}
                >
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50">
                  Documentation
                </Button>
                <AuthDialog />
              </>
            )}
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}><SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="text-2xl font-black text-indigo-800">SabiRoad</SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col gap-4">
              <Button variant="ghost" className="justify-start text-lg text-gray-700 hover:text-teal-600">Features</Button>
              <Button variant="ghost" className="justify-start text-lg text-gray-700 hover:text-teal-600">Enterprise</Button>
              <Button variant="ghost" className="justify-start text-lg text-gray-700 hover:text-teal-600">Pricing</Button>
              <div className="mt-4 pt-4 border-t">
                {user ? (
                  <>
                    <Button 
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full text-lg font-bold text-gray-700 hover:text-teal-600 mb-4"
                      variant="ghost"
                    >
                      Logout
                    </Button>
                    <Button 
                      onClick={() => {
                        router.push('/dashboard')
                        setMobileMenuOpen(false)
                      }}
                      className="w-full text-lg font-bold bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => {
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-lg font-bold bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Start Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>

    <main className="pt-24 pb-16">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50">
              <Star className="w-5 h-5 text-teal-500" />
              <span className="text-sm font-bold text-teal-800">New: AI-Powered Route Optimization</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 text-indigo-900 leading-tight">
              Navigate Smarter, Journey Further
            </h1>
          
            <p className="text-xl text-gray-700 mb-10 font-medium">
              Revolutionize your navigation with intelligent routing, real-time insights, and unparalleled team collaboration technologies.
            </p>
          
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Button 
                  size="lg" 
                  onClick={() => router.push('/dashboard')}
                  className="px-10 bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              ) : (
                <>
                  <AuthDialog />
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="px-10 font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                  >
                    View Documentation
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="relative h-[500px] lg:h-[600px]">
            <MapDisplay />
          </div>
        </div>
      </div>
    </main>

    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-black mb-4 text-indigo-900">
            Powerful Navigation Ecosystem
          </h2>
          <p className="text-xl text-gray-700 font-medium">
            Cutting-edge routing solutions engineered for modern enterprises and dynamic teams
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {FEATURES.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 border-gray-200 hover:shadow-xl transition-all group bg-gray-50 hover:bg-white"
            >
              <div className="flex gap-4">
                <div className="mt-1">
                  <feature.icon className="w-6 h-6 text-teal-600 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-indigo-900">{feature.title}</h3>
                  <p className="text-gray-700 leading-relaxed font-medium">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>

    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-8">
            <span className="text-sm font-semibold text-gray-600">© 2025 SabiRoad Technologies</span>
            <a href="#" className="text-sm font-semibold text-gray-600 hover:text-teal-600">Privacy</a>
            <a href="#" className="text-sm font-semibold text-gray-600 hover:text-teal-600">Terms</a>
          </div>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-teal-600">
              <Github className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
)
}

// Wrap the Home component with AuthProvider
const HomeWrapper = () => {
  return (
    <AuthProvider>
      <Home />
    </AuthProvider>
  )
}

export default HomeWrapper