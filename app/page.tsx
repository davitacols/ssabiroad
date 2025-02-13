"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";
import { useSession } from "next-auth/react";

// 🚀 Define Features & Plans Data
const features = [
  { icon: "Architecture", title: "Instant Recognition", desc: "Identify buildings in real-time with high accuracy." },
  { icon: "Database", title: "Rich Information", desc: "Access detailed architectural and historical data." },
  { icon: "Globe", title: "Global Coverage", desc: "Supports buildings worldwide with local context." },
];

const plans = [
  { icon: "Building2", title: "Personal", price: "Free", features: ["Building Recognition", "Basic Info", "5 Scans/Day"] },
  { icon: "Landmark", title: "Professional", price: "Custom", features: ["Advanced Analytics", "Historical Data", "Unlimited Scans"] },
];

const ModernHome = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = useCallback((plan?: string) => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    } else {
      const authPath = plan === "Professional" ? "/signup" : "/login";
      router.push(authPath);
    }
  }, [router, session, status]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white/90 backdrop-blur-xl shadow-sm dark:bg-gray-900/90" : "bg-white"}`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <LucideIcons.Building className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                SabiRoad
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {["Features", "Solutions", "Pricing"].map((item) => (
                <Button key={item} variant="ghost" className="text-sm font-medium">{item}</Button>
              ))}
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90" 
                onClick={() => handleGetStarted()}
              >
                {status === "authenticated" ? "Go to Dashboard" : "Get Started"} 
                <LucideIcons.ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={toggleMenu} className="text-2xl bg-white dark:bg-gray-900 p-2 rounded-md shadow-md border border-gray-300 dark:border-gray-700">
                {isMenuOpen ? <LucideIcons.X /> : <LucideIcons.Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 shadow-lg border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-6 py-4 space-y-4">
              {["Features", "Solutions", "Pricing"].map((item) => (
                <Button key={item} variant="ghost" className="w-full text-left">{item}</Button>
              ))}
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90" 
                onClick={() => handleGetStarted()}
              >
                {status === "authenticated" ? "Go to Dashboard" : "Get Started"} 
                <LucideIcons.ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-32 px-6 md:px-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h1 className="text-5xl font-bold mb-4">Discover Buildings Instantly</h1>
        <p className="text-lg max-w-2xl">Upload an image and find detailed information about any building worldwide.</p>
        <Button 
          className="mt-6 bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-200"
          onClick={() => handleGetStarted()}
        >
          Get Started
        </Button>
      </section>

      {/* Features Section */}
      <section className="container mx-auto py-20 px-6 grid md:grid-cols-3 gap-8">
        {features.map((feature) => (
          <Card key={feature.title} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
            {LucideIcons[feature.icon] && React.createElement(LucideIcons[feature.icon], { className: "w-12 h-12 text-blue-600 mx-auto" })}
            <h3 className="text-xl font-semibold mt-4">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{feature.desc}</p>
          </Card>
        ))}
      </section>

      {/* Pricing Plans */}
      <section className="bg-gray-100 dark:bg-gray-900 py-20 px-6 text-center">
        <h2 className="text-4xl font-bold">Choose Your Plan</h2>
        <div className="container mx-auto grid md:grid-cols-2 gap-8 mt-10">
          {plans.map((plan) => (
            <Card key={plan.title} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
              {LucideIcons[plan.icon] && React.createElement(LucideIcons[plan.icon], { className: "w-12 h-12 text-blue-600 mx-auto" })}
              <h3 className="text-2xl font-bold mt-4">{plan.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-300">
                {plan.features.map((feat) => <li key={feat}>✔ {feat}</li>)}
              </ul>
              <Button className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg" onClick={() => handleGetStarted(plan.title)}>Get Started</Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ModernHome;
