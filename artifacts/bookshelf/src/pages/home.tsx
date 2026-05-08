import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, UploadCloud, Library } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 py-24 md:py-32 flex flex-col items-center justify-center text-center bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20 dark:to-background overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] dark:opacity-[0.05] mix-blend-multiply pointer-events-none" />
        
        <div className="z-10 max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Discover your next favorite story</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground tracking-tight">
            Your cozy corner of the literary web
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Bookshelf is a warm, inviting community for readers and writers. Upload your stories, build your personal library, and connect with people who share your passion for reading.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                Join the Community
              </Button>
            </Link>
            <Link href="/browse">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 px-8 bg-background/50 backdrop-blur">
                Browse Books
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg">Everything you need to share and enjoy great literature.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                <UploadCloud className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Upload your stories</h3>
              <p className="text-muted-foreground">Share your PDFs and EPUBs with the community. Add beautiful covers and rich descriptions to attract readers.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                <Library className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Build your library</h3>
              <p className="text-muted-foreground">Save interesting finds to your personal library. Keep track of what you're reading and what you want to read next.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Connect with readers</h3>
              <p className="text-muted-foreground">Leave comments on books you love and send direct messages to authors and fellow book enthusiasts.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-amber-600">
            <BookOpen className="h-5 w-5" />
            <span className="font-serif font-bold text-lg">Bookshelf</span>
          </div>
          <p className="text-sm text-muted-foreground">
            A cozy corner of the literary web.
          </p>
        </div>
      </footer>
    </div>
  );
}