import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { HomeActions } from "@/components/home-actions"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Bingo Multiplayer</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/leaderboard">
              <Button variant="ghost">Leaderboard</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="flex max-w-[980px] flex-col items-center gap-2">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
              Welcome to Bingo Multiplayer
            </h1>
            <p className="max-w-[700px] text-center text-muted-foreground">
              Create a new room or join an existing one to play with friends.
            </p>
          </div>
          <div className="grid w-full max-w-sm items-center gap-6 mx-auto">
            <HomeActions />
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Bingo Multiplayer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
