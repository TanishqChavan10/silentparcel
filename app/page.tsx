'use client';

import { Upload, MessageSquare, Shield, Zap, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SecureShare</h1>
          </div>
          
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              Share Files & Chat Anonymously
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Upload files securely, create ephemeral chat rooms, and maintain your privacy. 
              No registration required, no data retained.
            </p>
          </div>

          {/* Main CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/files">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-xl hover:scale-105 transition-transform">
                <Upload className="mr-2 h-5 w-5" />
                Upload a File
              </Button>
            </Link>
            
            <Link href="/rooms">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-lg px-8 py-6 rounded-xl bg-background/50 hover:bg-accent/50 border-border/50 hover:scale-105 transition-transform"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Enter Secret Room
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-card/50 border-border/50 hover:bg-card/70 transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Privacy First</CardTitle>
                <CardDescription>
                  No accounts, no tracking. Your data is encrypted and automatically deleted.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 border-border/50 hover:bg-card/70 transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-chart-1" />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Instant file uploads, real-time chat, and blazing fast downloads.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 border-border/50 hover:bg-card/70 transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-chart-2" />
                </div>
                <CardTitle>Zero Knowledge</CardTitle>
                <CardDescription>
                  We can't see your files or messages. End-to-end privacy guaranteed.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h4 className="text-xl font-bold mb-4 flex items-center">
                <Upload className="mr-3 h-5 w-5 text-primary" />
                File Sharing
              </h4>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  Drag & drop files up to 700MB
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  Complete CAPTCHA verification
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  Get shareable link & edit token
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  Automatic virus scanning
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-4 flex items-center">
                <MessageSquare className="mr-3 h-5 w-5 text-chart-1" />
                Anonymous Chat
              </h4>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-chart-1/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-chart-1 rounded-full"></div>
                  </div>
                  Create password-protected rooms
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-chart-1/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-chart-1 rounded-full"></div>
                  </div>
                  Auto-generated anonymous names
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-chart-1/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-chart-1 rounded-full"></div>
                  </div>
                  Share files within chat (10MB limit)
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-chart-1/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-chart-1 rounded-full"></div>
                  </div>
                  Rooms self-destruct automatically
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/40">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 SecureShare. Privacy-focused file sharing and ephemeral chat.</p>
        </div>
      </footer>
    </div>
  );
}