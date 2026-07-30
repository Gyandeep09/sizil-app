import { Archive, CheckCircle2, FolderSearch, Trash2 } from "lucide-react";
import type { ProjectView } from "../../store/useProjectStore";

const COPY: Record<ProjectView, { Icon: typeof FolderSearch; title: string; body: string }> = {
  active: {
    Icon: FolderSearch,
    title: "No projects here.",
    body: "Scan a folder above to find your repos, or add one by path.",
  },
  completed: {
    Icon: CheckCircle2,
    title: "Nothing completed yet.",
    body: "Mark a project done from the In Progress list and it'll show up here.",
  },
  archived: {
    Icon: Archive,
    title: "Nothing archived.",
    body: "Archive a project from its card menu to tuck it away without deleting it.",
  },
  deleted: {
    Icon: Trash2,
    title: "Nothing in the trash.",
    body: "Deleted projects land here first and can be restored anytime.",
  },
};

interface EmptyStateProps {
  view: ProjectView;
}

export function EmptyState({ view }: EmptyStateProps) {
  const { Icon, title, body } = COPY[view];
  return (
    <div className="border-[3px] border-dashed border-line rounded-xl py-16 px-6 text-center bg-surface">
      <Icon className="mx-auto text-muted" size={26} aria-hidden />
      <p className="font-sans font-bold text-fg mt-4">{title}</p>
      <p className="font-sans text-muted text-sm mt-1">{body}</p>
    </div>
  );
}
