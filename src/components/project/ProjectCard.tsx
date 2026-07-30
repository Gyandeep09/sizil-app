import { useEffect, useState, type MouseEvent } from "react";
import {
  Archive,
  ArchiveRestore,
  Check,
  Code2,
  FolderOpen,
  RotateCcw,
  SquareTerminal,
  Terminal,
  Trash2,
} from "lucide-react";
import type { Project } from "../../types";
import { useProjectStore } from "../../store/useProjectStore";
import { useUiStore } from "../../store/useUiStore";
import { sound } from "../../utils/sound";
import { fireCompletionBurst } from "../../utils/confetti";
import { formatRelativeTime } from "../../utils/time";
import { TechIcon } from "../ui";
import { ProgressBar } from "./ProgressBar";
import { TaskChecklist } from "./TaskChecklist";

const LAUNCHERS = [
  { tool: "vscode" as const, label: "VS Code", Icon: Code2 },
  { tool: "neovim" as const, label: "Neovim", Icon: SquareTerminal },
  { tool: "terminal" as const, label: "Terminal", Icon: Terminal },
  { tool: "explorer" as const, label: "file manager", Icon: FolderOpen },
];

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { launchTool, updateStatus, permanentlyDelete, tasksByProject, fetchTasks } =
    useProjectStore();
  const pushToast = useUiStore((s) => s.pushToast);
  const [expanded, setExpanded] = useState(false);
  const [confirmingForever, setConfirmingForever] = useState(false);

  const isActive = project.status === "ACTIVE" || project.status === "PAUSED";
  const tasks = tasksByProject[project.id] ?? [];
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  useEffect(() => {
    if (isActive) fetchTasks(project.id);

  }, [project.id, isActive]);

  useEffect(() => {
    if (!confirmingForever) return;
    const timer = setTimeout(() => setConfirmingForever(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmingForever]);

  const handleLaunch = async (tool: (typeof LAUNCHERS)[number]["tool"], label: string) => {
    sound.click();
    const ok = await launchTool(tool, project.path);
    if (ok) {
      pushToast(`Opened ${project.name} in ${label}.`, "success");
      sound.success();
    } else {
      pushToast(useProjectStore.getState().error ?? `Couldn't open ${label}.`, "error");
      useProjectStore.setState({ error: null });
      sound.error();
    }
  };

  const handleComplete = async (e: MouseEvent) => {
    sound.click();
    const ok = await updateStatus(project.id, "COMPLETED");
    if (ok) {
      fireCompletionBurst(e.clientX, e.clientY);
      sound.success();
      pushToast(`${project.name} marked complete. Nice work.`, "success");
    }
  };

  const handleReopen = async () => {
    sound.click();
    const ok = await updateStatus(project.id, "ACTIVE");
    if (ok) pushToast(`${project.name} moved back to In Progress.`, "info");
  };

  const handleArchive = async () => {
    sound.click();
    const ok = await updateStatus(project.id, "ARCHIVED");
    if (ok) pushToast(`${project.name} archived.`, "info");
  };

  const handleRestore = async () => {
    sound.click();
    const ok = await updateStatus(project.id, "ACTIVE");
    if (ok) {
      pushToast(`${project.name} restored.`, "success");
      sound.success();
    }
  };

  const handleSoftDelete = async () => {
    sound.click();
    const ok = await updateStatus(project.id, "DELETED");
    if (ok) {
      pushToast(`${project.name} moved to Deleted.`, "info");
      sound.error();
    }
  };

  const handleForeverDelete = async () => {
    if (!confirmingForever) {
      setConfirmingForever(true);
      return;
    }
    sound.click();
    const ok = await permanentlyDelete(project.id);
    if (ok) {
      pushToast(`${project.name} permanently deleted.`, "info");
      sound.error();
    }
  };

  const techList = project.techStack.length > 0 ? project.techStack : [];

  return (
    <li className="bg-surface border-[3px] border-line rounded-xl shadow-brut-sm p-4 transition-transform duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut">
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        {techList.length > 0 ? (
          techList.slice(0, 5).map((slug) => <TechIcon key={slug} slug={slug} size={16} />)
        ) : (
          <TechIcon slug="" size={16} />
        )}
      </div>

      <p className="font-sans font-bold text-fg truncate mt-2">{project.name}</p>

      <p className="font-mono text-xs text-muted mt-1 truncate" title={project.path}>
        {project.path}
      </p>

      <p className="font-mono text-[11px] text-muted mt-2">
        {project.primaryLanguage} · {formatRelativeTime(project.lastModified)}
      </p>

      {isActive && (
        <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
          <ProgressBar completed={doneCount} total={tasks.length} />
        </button>
      )}
      {isActive && expanded && <TaskChecklist projectId={project.id} />}

      <div className="flex items-center gap-1 mt-3 pt-3 border-t-2 border-line">
        {isActive && (
          <>
            {LAUNCHERS.map(({ tool, label, Icon }) => (
              <button
                key={tool}
                onClick={() => handleLaunch(tool, label)}
                title={`Open in ${label}`}
                aria-label={`Open in ${label}`}
                className="p-1.5 rounded-md text-muted transition-colors hover:text-brutBlue hover:bg-paper active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brutBlue"
              >
                <Icon size={15} />
              </button>
            ))}
            <span className="flex-1" />
            <button
              onClick={handleComplete}
              title="Mark complete"
              aria-label="Mark complete"
              className="p-1.5 rounded-md text-brutGreen transition-colors hover:bg-paper active:scale-90"
            >
              <Check size={16} />
            </button>
            <button
              onClick={handleArchive}
              title="Archive"
              aria-label="Archive"
              className="p-1.5 rounded-md text-muted transition-colors hover:text-fg hover:bg-brutYellow active:scale-90"
            >
              <Archive size={15} />
            </button>
            <button
              onClick={handleSoftDelete}
              title="Delete"
              aria-label="Delete"
              className="p-1.5 rounded-md text-muted transition-colors hover:text-brutRed hover:bg-paper active:scale-90"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}

        {project.status === "COMPLETED" && (
          <>
            <span className="font-sans font-semibold text-xs text-brutGreen flex-1">
              ✓ Completed{" "}
              {project.completedAt ? formatRelativeTime(project.completedAt) : ""}
            </span>
            <button
              onClick={handleReopen}
              title="Reopen"
              aria-label="Reopen"
              className="p-1.5 rounded-md text-muted transition-colors hover:text-brutBlue hover:bg-paper active:scale-90"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={handleArchive}
              title="Archive"
              aria-label="Archive"
              className="p-1.5 rounded-md text-muted transition-colors hover:text-fg hover:bg-brutYellow active:scale-90"
            >
              <Archive size={15} />
            </button>
            <button
              onClick={handleSoftDelete}
              title="Delete"
              aria-label="Delete"
              className="p-1.5 rounded-md text-muted transition-colors hover:text-brutRed hover:bg-paper active:scale-90"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}

        {project.status === "ARCHIVED" && (
          <>
            <span className="flex-1" />
            <button
              onClick={handleRestore}
              title="Restore"
              aria-label="Restore"
              className="p-1.5 rounded-md text-muted transition-colors hover:text-brutGreen hover:bg-paper active:scale-90"
            >
              <ArchiveRestore size={15} />
            </button>
            <button
              onClick={handleSoftDelete}
              title="Delete"
              aria-label="Delete"
              className="p-1.5 rounded-md text-muted transition-colors hover:text-brutRed hover:bg-paper active:scale-90"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}

        {project.status === "DELETED" && (
          <>
            <span className="flex-1" />
            <button
              onClick={handleRestore}
              title="Restore"
              aria-label="Restore"
              className="p-1.5 rounded-md text-muted transition-colors hover:text-brutGreen hover:bg-paper active:scale-90"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={handleForeverDelete}
              title={confirmingForever ? "Click again to confirm" : "Delete forever"}
              aria-label={confirmingForever ? "Click again to confirm" : "Delete forever"}
              className={`p-1.5 rounded-md transition-colors active:scale-90 ${
                confirmingForever
                  ? "text-white bg-brutRed"
                  : "text-muted hover:text-brutRed hover:bg-paper"
              }`}
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
