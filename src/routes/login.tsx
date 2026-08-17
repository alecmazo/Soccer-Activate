import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleDot } from "lucide-react";
import { authEnabled, GROK_PROVIDERS, signIn, signOut } from "@/lib/auth/client";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="pitch-grid grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-sm bg-accent text-accent-fg">
            <CircleDot className="size-3.5" />
          </span>
          <span className="font-display text-lg uppercase tracking-[0.16em]">
            Activate
          </span>
        </Link>
        <h1 className="font-display text-4xl uppercase leading-none tracking-tight">
          Save the path
        </h1>
        <p className="mt-3 text-sm text-muted">
          Training works without an account. Sign in to keep streaks and scores
          if you switch devices.
        </p>
        <SignedOut>
          <div className="mt-8 space-y-3">
            {authEnabled ? (
              GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
                >
                  Continue with {p.label}
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted">Sign-in is disabled.</p>
            )}
          </div>
        </SignedOut>
        <SignedIn>
          <div className="mt-8 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <UserButton />
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={() => void signOut("/")}
            >
              Sign out
            </Button>
          </div>
        </SignedIn>
        <Link
          to="/"
          className="mt-6 inline-block text-sm text-muted hover:text-fg"
        >
          Back to training
        </Link>
      </div>
    </main>
  );
}
