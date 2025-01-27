"use client"

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

// Authentication Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

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
      }
      return false
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
      }
      return false
    } catch (error) {
      console.error('Signup error', error)
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
        if (!success) setError('Invalid email or password')
      } else {
        const success = await signup(email, password, name)
        if (!success) setError('Signup failed. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6">
          Get Started
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isLogin ? 'Welcome Back' : 'Create Account'}</DialogTitle>
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
                  className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your full name"
                  required
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
                className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your email"
                required
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
                className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your password"
                required
                minLength={8}
              />
              <Lock className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          {error && (
            <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-indigo-600 hover:underline"
            >
              {isLogin 
                ? 'Need an account? Sign Up' 
                : 'Already have an account? Sign In'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const FEATURES = [
  {
    icon: Navigation,
    title: "Intuitive Pathfinding",
    description: "Smart routes that adapt to your journey preferences and real-time conditions"
  },
  {
    icon: Shield,
    title: "Reliable Security",
    description: "Your journey data protected with state-of-the-art encryption and privacy measures"
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Detailed maps and routes covering every corner of the world with precision"
  },
  {
    icon: Users,
    title: "Team Synergy",
    description: "Share routes and locations in real-time with your team members effortlessly"
  },
  {
    icon: Compass,
    title: "Offline Access",
    description: "Keep navigating even when offline with downloadable map regions"
  },
  {
    icon: MapPin,
    title: "Smart Waypoints",
    description: "Create rich, interactive markers with notes and media attachments"
  }
]

const MapDisplay = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl overflow-hidden shadow-lg">
    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"/>
    <div 
      className="absolute inset-0 opacity-10" 
      style={{
        backgroundImage: `radial-gradient(circle, rgba(99,102,241,0.4) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }}
    />
    <div className="absolute inset-0">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-indigo-400/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `pulse ${3 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
    </div>
  </div>
)

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="fixed w-full bg-white/70 backdrop-blur-md border-b border-gray-100 z-50">
        <nav className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Sabi<span className="font-black">Road</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Button variant="ghost" className="text-gray-600 hover:text-indigo-600">Features</Button>
            <Button variant="ghost" className="text-gray-600 hover:text-indigo-600">Solutions</Button>
            <Button variant="ghost" className="text-gray-600 hover:text-indigo-600">Pricing</Button>
            {user ? (
              <Button 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl px-6"
                onClick={() => router.push('/journey')}
              >
                Dashboard
              </Button>
            ) : (
              <AuthDialog />
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 mt-8">
                <Button variant="ghost">Features</Button>
                <Button variant="ghost">Solutions</Button>
                <Button variant="ghost">Pricing</Button>
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  Get Started
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </header>

      <main className="pt-32 pb-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 mb-8">
                <Star className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-600">New AI Map Router</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Smart Routes for
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"> Modern Teams</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-10">
                Experience intelligent navigation that adapts to your needs, powered by advanced AI and real-time data.
              </p>
              
              <div className="flex gap-4">
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-6 rounded-xl text-lg">
                  Start Free Trial
                </Button>
                <Button variant="outline" className="px-8 py-6 rounded-xl text-lg border-indigo-200">Watch Demo
                </Button>
              </div>
            </div>
            
            <div className="relative h-[600px]">
              <MapDisplay />
            </div>
          </div>
        </div>

        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                Everything you need for
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"> seamless navigation</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map((feature, index) => (
                <Card key={index} className="p-6 bg-white/50 backdrop-blur-sm border-0 rounded-2xl hover:shadow-xl transition-all">
                  <feature.icon className="w-8 h-8 text-indigo-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-8">
              <span className="text-sm text-gray-500">© 2025 SabiRoad</span>
              <Link href="#" className="text-sm text-gray-500 hover:text-indigo-600">Privacy</Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-indigo-600">Terms</Link>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-gray-400 hover:text-indigo-600">
                <Github className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function HomeWrapper() {
  return (
    <AuthProvider>
      <Home />
    </AuthProvider>
  )
}