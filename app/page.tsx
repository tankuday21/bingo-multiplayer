import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { HomeActions } from "@/components/home-actions"
import { Trophy, Sparkles, Github } from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl opacity-50 -z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-r from-accent/20 via-primary/20 to-secondary/20 blur-3xl opacity-50 -z-10" />
      </div>

      <header className="sticky top-0 z-30 w-full border-b backdrop-blur-md bg-background/70">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Bingo Multiplayer</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/leaderboard">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                <span>Leaderboard</span>
              </Button>
            </Link>
            <ThemeToggle />
            <Link href="https://github.com/tankuday21/bingo-multiplayer" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon">
                <Github className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <motion.section 
          className="container grid items-center gap-6 pt-8 md:py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero section */}
          <motion.div 
            className="flex flex-col items-center gap-4 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full blur-3xl bg-primary/20 animate-pulse" />
              <motion.div
                className="relative bg-primary/10 p-3 rounded-full"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <div className="relative z-10 text-4xl">🎮</div>
              </motion.div>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tighter md:text-5xl lg:text-6xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Bingo Multiplayer
            </h1>
            <p className="max-w-[700px] text-center text-muted-foreground text-lg">
              Create a room or join one to play a fast-paced bingo game with friends or other players online.
            </p>
          </motion.div>

          {/* Features section */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="p-4 rounded-lg border bg-card/50 backdrop-blur">
              <div className="mb-2 rounded-full w-10 h-10 flex items-center justify-center bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Play</h3>
              <p className="text-muted-foreground text-sm">Play in real-time with friends and competitors around the world.</p>
            </div>
            <div className="p-4 rounded-lg border bg-card/50 backdrop-blur">
              <div className="mb-2 rounded-full w-10 h-10 flex items-center justify-center bg-secondary/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Custom Grid Sizes</h3>
              <p className="text-muted-foreground text-sm">Choose different grid sizes for varied gameplay and difficulty.</p>
            </div>
            <div className="p-4 rounded-lg border bg-card/50 backdrop-blur">
              <div className="mb-2 rounded-full w-10 h-10 flex items-center justify-center bg-accent/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" /><circle cx="17" cy="7" r="5" /></svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Beautiful Themes</h3>
              <p className="text-muted-foreground text-sm">Choose from multiple visual themes to customize your experience.</p>
            </div>
          </motion.div>

          {/* Action section */}
          <motion.div 
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <HomeActions />
          </motion.div>
        </motion.section>
      </main>

      <footer className="border-t py-6 backdrop-blur-md bg-background/70">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Bingo Multiplayer. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/leaderboard">
              <Button variant="ghost" size="sm">Leaderboard</Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  )
}
