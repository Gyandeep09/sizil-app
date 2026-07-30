import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderSearch, Loader2, Plus, X } from "lucide-react";
import { useProjectStore } from "../../store/useProjectStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useUiStore } from "../../store/useUiStore";
import { sound } from "../../utils/sound";

export function Toolbar() {
  const { scanDirectory, addProject } = useProjectStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const pushToast = useUiStore((s) => s.pushToast);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualPath, setManualPath] = useState("");
  const [scanning, setScanning] = useState(false);

  if (!currentUser) return null;
  const userId = currentUser.id;

  const handleScan = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected !== "string") return;

    sound.click();
    setScanning(true);
    const found = await scanDirectory(userId, selected);
    setScanning(false);

    const scanError = useProjectStore.getState().error;
    if (scanError) {
      useProjectStore.setState({ error: null });
      pushToast(scanError, "error");
      sound.error();
    } else if (found.length > 0) {
      pushToast(
        `Found ${found.length} new project${found.length === 1 ? "" : "s"}.`,
        "success"
      );
      sound.success();
    } else {
      pushToast("No new projects found in that folder.", "info");
    }
  };

  const handleManualAdd = async () => {
    if (!manualPath.trim()) return;
    sound.click();
    const created = await addProject(userId, manualPath.trim());
    if (created) {
      pushToast(`Added ${created.name}.`, "success");
      sound.success();
      setManualPath("");
      setManualOpen(false);
    } else {
      pushToast(
        useProjectStore.getState().error ?? "Couldn't add that path.",
        "error"
      );
      useProjectStore.setState({ error: null });
      sound.error();
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center flex-wrap gap-3">
        <button
          onClick={handleScan}
          disabled={scanning}
          className="inline-flex items-center gap-2 bg-brutBlue text-white border-[3px] border-line rounded-lg font-sans font-bold text-sm px-4 py-2.5 shadow-brut-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-70 disabled:cursor-wait"
        >
          {scanning ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FolderSearch size={16} />
          )}
          {scanning ? "Scanning…" : "Scan a folder for projects"}
        </button>

        {!manualOpen && (
          <button
            onClick={() => setManualOpen(true)}
            className="inline-flex items-center gap-1 text-muted text-sm font-sans font-semibold transition-colors hover:text-brutBlue active:scale-95"
          >
            <Plus size={14} />
            Add one path manually
          </button>
        )}
      </div>

      {manualOpen && (
        <div className="flex gap-2 mt-3 max-w-xl">
          <input
            autoFocus
            className="flex-1 bg-surface border-[3px] border-line rounded-lg px-3 py-2 text-sm font-mono text-fg outline-none transition-colors focus:border-brutBlue"
            placeholder="/absolute/path/to/project"
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleManualAdd();
              if (e.key === "Escape") { setManualOpen(false); setManualPath(""); }
            }}
          />
          <button
            onClick={handleManualAdd}
            className="bg-surface border-[3px] border-line rounded-lg text-fg text-sm font-sans font-bold px-3 py-2 transition-all hover:bg-brutYellow active:scale-95"
          >
            Add
          </button>
          <button
            onClick={() => { setManualOpen(false); setManualPath(""); }}
            title="Cancel"
            aria-label="Cancel manual path entry"
            className="bg-surface border-[3px] border-line rounded-lg text-muted px-2.5 py-2 transition-all hover:text-brutRed hover:border-brutRed active:scale-95"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
