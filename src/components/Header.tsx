import { useEffect, useState } from 'react';
import { LogOut, Moon, Sun, User as UserIcon } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

const NAV = [
  { to: '/leagues', label: 'Leagues' },
  { to: '/live', label: 'Live' },
  { to: '/matches', label: 'Matches' },
  { to: '/about', label: 'About' },
] as const;

export function Header() {
  const { user, signOut } = useAuth();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <a href="/">
            <Logo />
          </a>

          <nav className="hidden gap-6 md:flex">
            {NAV.map((n) => (
              <a
                key={n.to}
                href={n.to}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-foreground hover:bg-muted"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <a href="/account">
                  <UserIcon className="mr-1 h-4 w-4" />
                  Account
                </a>
              </Button>

              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="mr-1 h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <a href="/auth">Sign in</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
