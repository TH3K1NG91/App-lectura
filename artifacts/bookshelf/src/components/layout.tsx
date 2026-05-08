import { Link, useLocation } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { BookOpen, Library as LibraryIcon, MessageSquare, PlusCircle, Search, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-amber-600 hover:text-amber-700 transition-colors">
          <BookOpen className="h-6 w-6" />
          <span className="font-serif font-bold text-xl tracking-tight">Bookshelf</span>
        </Link>

        <Show when="signed-in">
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/browse" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/browse") ? "text-primary" : "text-muted-foreground"}`}>
              Browse
            </Link>
            <Link href="/library" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/library") ? "text-primary" : "text-muted-foreground"}`}>
              Library
            </Link>
            <Link href="/messages" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/messages") ? "text-primary" : "text-muted-foreground"}`}>
              Messages
            </Link>
          </nav>
        </Show>

        <div className="flex items-center gap-4">
          <Show when="signed-in">
            <Link href="/upload" className="hidden sm:flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9">
                <PlusCircle className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.imageUrl} alt={user?.username || "User"} />
                    <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
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
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/library">
                  <DropdownMenuItem className="cursor-pointer md:hidden">
                    <LibraryIcon className="mr-2 h-4 w-4" />
                    <span>Library</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/messages">
                  <DropdownMenuItem className="cursor-pointer md:hidden">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/upload">
                  <DropdownMenuItem className="cursor-pointer sm:hidden">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>Upload Book</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Show>
          
          <Show when="signed-out">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </Show>
        </div>
      </div>
    </header>
  );
}