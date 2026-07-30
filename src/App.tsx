import { useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useProjectStore } from "./store/useProjectStore";
import { useAuthStore } from "./store/useAuthStore";
import { useUiStore } from "./store/useUiStore";
import { AuthGate } from "./components/auth";
import { Sidebar, Toolbar } from "./components/layout";
import { ProjectCard } from "./components/project";
import { EmptyState, ToastStack, Logo } from "./components/ui";
import { groupByDate } from "./utils/time";

const VIEW_TITLE: Record<ReturnType<typeof useProjectStore.getState>["view"], string> = {
  active: "In Progress",
  completed: "Completed",
  archived: "Archived",
  deleted: "Deleted",
};

function Dashboard() {
  const { projects, isLoading, view, fetchProjects } = useProjectStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { soundEnabled, toggleSound } = useUiStore();

  useEffect(() => {
    if (currentUser) fetchProjects(currentUser.id);

  }, [currentUser?.id]);

  if (!currentUser) return null;

  const filtered = projects.filter((p) => {
    switch (view) {
      case "active":
        return p.status === "ACTIVE" || p.status === "PAUSED";
      case "completed":
        return p.status === "COMPLETED";
      case "archived":
        return p.status === "ARCHIVED";
      case "deleted":
        return p.status === "DELETED";
    }
  });

  const groups = groupByDate(filtered, (p) => p.createdAt);

  return (
    <div className="h-screen bg-paper text-fg flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 px-8 py-10 min-w-0 overflow-y-auto">
        <header className="flex items-end justify-between flex-wrap gap-2 mb-10">
          <div>
            <div className="flex items-center gap-2">
              <Logo iconSize={70} textSize={22} />
            </div>
            <p className="font-sans text-sm text-muted mt-2">{VIEW_TITLE[view]}</p>
          </div>

          <div className="flex items-center gap-3">
            {filtered.length > 0 && (
              <p className="font-mono text-xs text-muted">
                {filtered.length} project{filtered.length === 1 ? "" : "s"}
              </p>
            )}
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Mute sound effects" : "Unmute sound effects"}
              aria-label={soundEnabled ? "Mute sound effects" : "Unmute sound effects"}
              className="p-1.5 rounded-md text-muted transition-all duration-150 hover:text-brutBlue active:scale-90"
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </div>
        </header>

        {view === "active" && <Toolbar />}

        {isLoading ? (
          <p className="font-sans text-sm text-muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState view={view} />
        ) : (
          <div className="flex flex-col gap-8">
            {groups.map((group) => (
              <section key={group.label}>
                <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted mb-3">
                  {group.label}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((p) => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>

      <ToastStack />
    </div>
  );
}

function App() {
  const { currentUser, isRestoring, restoreSession } = useAuthStore();
  const initializeDb = useProjectStore((s) => s.initializeDb);

  useEffect(() => {
    initializeDb().then(restoreSession);

  }, []);

  if (isRestoring) {
    return (
      <main className="min-h-screen bg-paper text-fg flex items-center justify-center">
        <p className="font-mono text-sm text-muted">Loading…</p>
      </main>
    );
  }

  if (!currentUser) return <AuthGate />;

  return <Dashboard />;
}

export default App;
