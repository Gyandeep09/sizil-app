import { useState, useRef, useEffect } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  LogOut,
  Smile,
  Trash2,
  X,
} from "lucide-react";
import { useProjectStore, type ProjectView } from "../../store/useProjectStore";
import { useAuthStore, PRESET_AVATARS, type PresetAvatar } from "../../store/useAuthStore";
import { Avatar } from "../ui";
import { sound } from "../../utils/sound";

const SECTIONS: { view: ProjectView; label: string; Icon: typeof ListTodo }[] = [
  { view: "active", label: "In Progress", Icon: ListTodo },
  { view: "completed", label: "Completed", Icon: CheckCircle2 },
  { view: "archived", label: "Archived", Icon: Archive },
  { view: "deleted", label: "Deleted", Icon: Trash2 },
];

function countFor(
  projects: ReturnType<typeof useProjectStore.getState>["projects"],
  v: ProjectView
) {
  switch (v) {
    case "active":
      return projects.filter((p) => p.status === "ACTIVE" || p.status === "PAUSED").length;
    case "completed":
      return projects.filter((p) => p.status === "COMPLETED").length;
    case "archived":
      return projects.filter((p) => p.status === "ARCHIVED").length;
    case "deleted":
      return projects.filter((p) => p.status === "DELETED").length;
  }
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { projects, view, setView } = useProjectStore();
  const { currentUser, signOut, selectPresetAvatar } = useAuthStore();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setAvatarPickerOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const handleSelectAvatar = async (slug: PresetAvatar) => {
    sound.click();
    const ok = await selectPresetAvatar(slug);
    if (ok) {
      setAvatarPickerOpen(false);
      setProfileOpen(false);
      sound.success();
    }
  };

  const handleSignOut = () => {
    setProfileOpen(false);
    setAvatarPickerOpen(false);
    signOut();
  };

  return (
    <aside
      className={`shrink-0 h-full bg-surface border-r-[3px] border-line flex flex-col ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="p-3 text-muted hover:text-fg self-end transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <nav className="flex flex-col gap-1 px-2 overflow-y-auto">
        {SECTIONS.map(({ view: v, label, Icon }) => (
          <button
            key={v}
            onClick={() => {
              sound.click();
              setView(v);
            }}
            className={`flex items-center gap-2 px-2 py-2 font-sans font-semibold text-sm text-left transition-colors border-[3px] rounded-lg ${
              view === v
                ? "bg-brutYellow border-line text-fg"
                : "border-transparent text-muted hover:text-fg hover:border-line"
            }`}
            title={label}
          >
            <Icon size={16} className="shrink-0" />
            {!collapsed && <span className="flex-1 truncate">{label}</span>}
            {!collapsed && (
              <span className="font-mono text-[10px] text-muted">
                {countFor(projects, v)}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto p-2 border-t-[3px] border-line relative" ref={profileRef}>
        {}
        {avatarPickerOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-2 bg-surface border-[3px] border-line rounded-xl shadow-brut p-3 z-50">
            <div className="flex items-center justify-between mb-2">
              <p className="font-sans font-bold text-xs text-fg">Choose your avatar</p>
              <button
                onClick={() => setAvatarPickerOpen(false)}
                className="text-muted hover:text-brutRed transition-colors"
                aria-label="Close avatar picker"
              >
                <X size={13} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_AVATARS.map((slug) => {
                const isSelected = currentUser?.avatarPath === slug;
                return (
                  <button
                    key={slug}
                    onClick={() => handleSelectAvatar(slug)}
                    title={`Select ${slug}`}
                    className={`relative rounded-full overflow-hidden border-[3px] transition-all active:scale-95 ${
                      isSelected
                        ? "border-brutGreen shadow-brut-sm"
                        : "border-line hover:border-brutBlue"
                    }`}
                    style={{ aspectRatio: "1", minHeight: "72px" }}
                  >
                    <img
                      src={`/avatars/${slug}.png`}
                      alt={slug}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: "top center" }}
                    />
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                        <CheckCircle2 size={16} className="text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {}
        {profileOpen && !avatarPickerOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-2 bg-surface border-[3px] border-line rounded-xl shadow-brut p-2 flex flex-col gap-1 z-50">
            <div className="px-2 py-1.5 border-b-2 border-line mb-1">
              <p className="font-sans font-bold text-xs text-fg truncate">
                {currentUser?.username}
              </p>
              <p className="font-mono text-[10px] text-muted">Local account</p>
            </div>
            <button
              onClick={() => setAvatarPickerOpen(true)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-muted hover:text-brutBlue hover:bg-paper transition-colors font-sans text-xs font-semibold"
            >
              <Smile size={13} />
              Choose avatar
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-muted hover:text-brutRed hover:bg-paper transition-colors font-sans text-xs font-semibold"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        )}

        {}
        <button
          onClick={() => {
            setAvatarPickerOpen(false);
            setProfileOpen((o) => !o);
          }}
          className="flex items-center gap-2 w-full px-1 py-2 rounded-lg hover:bg-paper transition-colors"
          title="Profile"
          aria-label="Open profile menu"
          aria-expanded={profileOpen}
        >
          <Avatar
            path={currentUser?.avatarPath ?? null}
            size={32}
            className="border-[3px] border-line"
          />
          {!collapsed && (
            <span className="font-mono text-xs text-fg truncate flex-1 text-left">
              {currentUser?.username}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
