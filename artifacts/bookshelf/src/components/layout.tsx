import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { BookOpen, Library as LibraryIcon, MessageSquare, PlusCircle, User as UserIcon, LogOut, Globe, Sun, Moon, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/i18n";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

function Navbar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { t, i18n } = useTranslation();
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  function toggleTheme() {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("lumina-theme", dark ? "dark" : "light");
    setIsDark(dark);
  }

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Sparkles className="h-5 w-5" />
          <span className="font-serif font-bold text-xl tracking-tight">Lumina</span>
        </Link>

        <Show when="signed-in">
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/browse" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/browse") ? "text-primary" : "text-muted-foreground"}`}>
              {t("nav.browse")}
            </Link>
            <Link href="/feed" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/feed") ? "text-primary" : "text-muted-foreground"}`}>
              Feed
            </Link>
            <Link href="/library" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/library") ? "text-primary" : "text-muted-foreground"}`}>
              {t("nav.library")}
            </Link>
            <Link href="/messages" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/messages") ? "text-primary" : "text-muted-foreground"}`}>
              {t("nav.messages")}
            </Link>
          </nav>
        </Show>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Toggle theme">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline text-xs uppercase font-semibold">{i18n.language?.slice(0, 2) || "es"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto">
              <DropdownMenuLabel className="text-xs text-muted-foreground">{t("language.label")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SUPPORTED_LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`cursor-pointer text-sm ${i18n.language?.startsWith(lang.code) ? "font-semibold text-primary" : ""}`}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Show when="signed-in">
            <Link href="/upload" className="hidden sm:flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9">
                <PlusCircle className="h-4 w-4 mr-2" />
                {t("nav.upload")}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.imageUrl} alt={user?.username || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {user?.firstName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName || user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile/me">
                  <DropdownMenuItem className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>{t("nav.profile")}</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/library">
                  <DropdownMenuItem className="cursor-pointer md:hidden">
                    <LibraryIcon className="mr-2 h-4 w-4" />
                    <span>{t("nav.library")}</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/messages">
                  <DropdownMenuItem className="cursor-pointer md:hidden">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>{t("nav.messages")}</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/upload">
                  <DropdownMenuItem className="cursor-pointer sm:hidden">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>{t("upload.title")}</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("nav.logOut")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Show>

          <Show when="signed-out">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">{t("nav.signIn")}</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">{t("nav.getStarted")}</Button>
            </Link>
          </Show>
        </div>
      </div>
    </header>
  );
}
