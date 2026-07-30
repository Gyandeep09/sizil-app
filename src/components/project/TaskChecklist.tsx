import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { useProjectStore } from "../../store/useProjectStore";

interface TaskChecklistProps {
  projectId: string;
}

export function TaskChecklist({ projectId }: TaskChecklistProps) {
  const { tasksByProject, fetchTasks, addTask, toggleTask, deleteTask } =
    useProjectStore();
  const [newTitle, setNewTitle] = useState("");
  const tasks = tasksByProject[projectId] ?? [];

  useEffect(() => {

    if (!tasksByProject[projectId]) {
      fetchTasks(projectId);
    }

  }, [projectId]);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTask(projectId, newTitle.trim());
    setNewTitle("");
  };

  return (
    <div className="mt-2 border-t-2 border-line pt-2 flex flex-col gap-1.5">
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-2 group/task">
          <button
            onClick={() => toggleTask(projectId, t.id)}
            className={`w-3.5 h-3.5 border-2 rounded shrink-0 transition-colors ${
              t.status === "DONE"
                ? "bg-brutGreen border-line"
                : "border-line bg-surface"
            }`}
            aria-label={t.status === "DONE" ? "Mark as not done" : "Mark as done"}
          />
          <span
            className={`flex-1 font-sans text-xs truncate ${
              t.status === "DONE" ? "text-muted line-through" : "text-fg"
            }`}
          >
            {t.title}
          </span>
          <button
            onClick={() => deleteTask(projectId, t.id)}
            className="opacity-0 group-hover/task:opacity-100 text-muted hover:text-brutRed transition-opacity"
            aria-label="Delete task"
          >
            <X size={12} />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2 mt-1">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a task…"
          className="flex-1 bg-paper border-2 border-line rounded-md px-2 py-1 text-xs font-mono text-fg outline-none focus:border-brutBlue"
        />
        <button
          onClick={handleAdd}
          className="text-muted hover:text-brutGreen transition-colors"
          aria-label="Add task"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
