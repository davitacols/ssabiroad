"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Navigation,
  Menu,
  Star,
  Check,
  ChevronRight,
  ArrowRight,
  Globe,
  Shield,
  Users,
  Compass,
  MapPin,
  Github,
  Building2,
  Car,
  Factory,
  Truck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ModernHome = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Modern Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">
                Sabi<span className="text-indigo-600">Road</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Button variant="ghost" className="text-sm font-medium">Features</Button>
              <Button variant="ghost" className="text-sm font-medium">Solutions</Button>
              <Button variant="ghost" className="text-sm font-medium">Pricing</Button>
              <Button 
                className="bg-black text-white hover:bg-black/90"
                onClick={handleGetStarted}
              >
                Get Started <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 mb-8">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">New AI-Powered Routes</span>
            </div>
            
            <h1 className="text-6xl font-bold mb-6 leading-tight">
              Navigate Smarter, 
              <span className="text-indigo-600"> Move Faster</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Experience intelligent navigation that adapts to your needs, powered by 
              advanced AI and real-time data analysis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-black text-white hover:bg-black/90 h-12 px-8"
                onClick={handleGetStarted}
              >
                Start Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" className="h-12 px-8">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: "Global Coverage", desc: "Navigate anywhere with precision" },
              { icon: Shield, title: "Enterprise Security", desc: "Bank-grade data protection" },
              { icon: Users, title: "Team Collaboration", desc: "Share routes seamlessly" }
            ].map((feature, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-all border-0 bg-gray-50">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold mb-4">Solutions for every scale</h2>
            <p className="text-xl text-gray-600 mb-12">
              From individual users to enterprise fleets, we have the right solution for you
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: Car, title: "Personal", price: "Free" },
              { icon: Building2, title: "Enterprise", price: "Custom" }
            ].map((plan, i) => (
              <Card key={i} className="p-8 hover:shadow-xl transition-all border-0 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                      <plan.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{plan.title}</h3>
                    <p className="text-4xl font-bold mb-6">{plan.price}</p>
                  </div>
                  <Button 
                    className="bg-black text-white hover:bg-black/90"
                    onClick={handleGetStarted}
                  >
                    Get Started
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ModernHome;