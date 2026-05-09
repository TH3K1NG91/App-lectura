import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import {
  Switch,
  Route,
  useLocation,
  Router as WouterRouter,
  Redirect,
} from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { setAuthTokenGetter, useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import Layout from "./components/layout";
import { GenreQuiz } from "./components/genre-quiz";

// Pages
import Home from "./pages/home";
import Browse from "./pages/browse";
import BookDetail from "./pages/book-detail";
import Library from "./pages/library";
import Upload from "./pages/upload";
import Profile from "./pages/profile";
import Me from "./pages/me";
import Messages from "./pages/messages";
import Chat from "./pages/chat";
import Feed from "./pages/feed";
import NotFound from "./pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(43 100% 50%)",
    colorForeground: "hsl(220 20% 15%)",
    colorMutedForeground: "hsl(220 10% 40%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(40 33% 99%)",
    colorInput: "hsl(40 20% 85%)",
    colorInputForeground: "hsl(220 20% 15%)",
    colorNeutral: "hsl(40 20% 85%)",
    fontFamily: "'Geist', 'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-serif font-bold text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-sm font-medium text-foreground",
    footerActionLink: "text-primary hover:text-primary/80 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/80",
    formFieldSuccessText: "text-green-600",
    alertText: "text-destructive",
    logoBox: "mb-4",
    logoImage: "w-12 h-12 object-contain",
    socialButtonsBlockButton: "border-border hover:bg-accent hover:text-accent-foreground",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
    formFieldInput: "bg-background border-input text-foreground focus:ring-ring",
    footerAction: "mt-4",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive text-destructive",
    otpCodeFieldInput: "border-input text-foreground focus:ring-ring",
    formFieldRow: "gap-4",
    main: "gap-6",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener, session } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!session) return null;
      return session.getToken();
    });
  }, [session]);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function GenreQuizInner() {
  const { data: me } = useGetMe();
  const updateMe = useUpdateMe();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("lumina-quiz-done") === "true";
  });

  if (dismissed || !me) return null;
  const prefs = (me as any)?.genrePreferences;
  if (prefs && prefs.length > 0) return null;

  async function handleComplete(genres: string[]) {
    updateMe.mutate(
      { data: { genrePreferences: genres } as any },
      {
        onSuccess: () => {
          localStorage.setItem("lumina-quiz-done", "true");
          setDismissed(true);
        },
      },
    );
  }

  function handleSkip() {
    localStorage.setItem("lumina-quiz-done", "true");
    setDismissed(true);
  }

  return <GenreQuiz onComplete={handleComplete} onSkip={handleSkip} />;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/feed" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back to Lumina",
            subtitle: "Sign in to access your library",
          },
        },
        signUp: {
          start: {
            title: "Join Lumina today",
            subtitle: "Discover and share great stories",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Show when="signed-in"><GenreQuizInner /></Show>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />

          <Route path="/browse">
            <Layout><Browse /></Layout>
          </Route>
          <Route path="/book/:bookId">
            {(params) => (
              <Layout><BookDetail bookId={params.bookId!} /></Layout>
            )}
          </Route>

          {/* Protected routes */}
          <Route path="/feed">
            <Layout><ProtectedRoute component={Feed} /></Layout>
          </Route>
          <Route path="/library">
            <Layout><ProtectedRoute component={Library} /></Layout>
          </Route>
          <Route path="/upload">
            <Layout><ProtectedRoute component={Upload} /></Layout>
          </Route>
          <Route path="/profile/me">
            <Layout><ProtectedRoute component={Me} /></Layout>
          </Route>
          <Route path="/profile/:userId">
            {(params) => (
              <Layout><Profile userId={params.userId!} /></Layout>
            )}
          </Route>
          <Route path="/messages">
            <Layout><ProtectedRoute component={Messages} /></Layout>
          </Route>
          <Route path="/messages/:userId">
            {(params) => (
              <Layout>
                <ProtectedRoute component={() => <Chat userId={params.userId!} />} />
              </Layout>
            )}
          </Route>

          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
