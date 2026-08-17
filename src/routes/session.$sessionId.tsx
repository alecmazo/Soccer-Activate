import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SessionRunner } from "@/components/session-runner";
import { getSessionById } from "@/lib/training/program";

export const Route = createFileRoute("/session/$sessionId")({
  component: SessionPage,
});

function SessionPage() {
  const { sessionId } = Route.useParams();
  const session = getSessionById(sessionId);
  if (!session) {
    return (
      <AppShell>
        <div className="py-16 text-center">
          <h1 className="font-display text-3xl uppercase">Session not found</h1>
          <Link to="/" className="mt-4 inline-block text-sm text-muted hover:text-fg">
            Back to today
          </Link>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <SessionRunner session={session} />
    </AppShell>
  );
}
