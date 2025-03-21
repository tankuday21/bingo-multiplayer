"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Palette, Sparkles, Gamepad2, Candy } from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const themeIcons = {
    light: <Sun className="h-5 w-5" />,
    dark: <Moon className="h-5 w-5" />,
    neon: <Sparkles className="h-5 w-5 text-fuchsia-400" />,
    galaxy: <Palette className="h-5 w-5 text-indigo-400" />,
    retro: <Gamepad2 className="h-5 w-5 text-amber-400" />,
    candy: <Candy className="h-5 w-5 text-pink-400" />
  }

  const currentIcon = theme ? themeIcons[theme as keyof typeof themeIcons] || themeIcons.light : themeIcons.light

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {currentIcon}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="animate-in">
        <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-2 cursor-pointer">
          <Sun className="h-4 w-4" /> <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2 cursor-pointer">
          <Moon className="h-4 w-4" /> <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("neon")} className="flex items-center gap-2 cursor-pointer">
          <Sparkles className="h-4 w-4 text-fuchsia-400" /> <span>Neon</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("galaxy")} className="flex items-center gap-2 cursor-pointer">
          <Palette className="h-4 w-4 text-indigo-400" /> <span>Galaxy</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("retro")} className="flex items-center gap-2 cursor-pointer">
          <Gamepad2 className="h-4 w-4 text-amber-400" /> <span>Retro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("candy")} className="flex items-center gap-2 cursor-pointer">
          <Candy className="h-4 w-4 text-pink-400" /> <span>Candy</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

