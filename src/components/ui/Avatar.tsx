import { useEffect, useState } from "react";
import { readFile } from "@tauri-apps/plugin-fs";
import { UserCircle2 } from "lucide-react";

interface AvatarProps {
  path: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ path, size = 32, className = "" }: AvatarProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setSrc(null);
      return;
    }

    if (/^ava\d+$/.test(path)) {
      setSrc(`/avatars/${path}.png`);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    readFile(path)
      .then((bytes) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([bytes]));
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  const circleStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    objectPosition: "top center",
    display: "block",
    flexShrink: 0,
  };

  if (!src) {
    return (
      <UserCircle2
        size={size}
        className={`text-muted ${className}`}
        style={{ flexShrink: 0 }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={src}
      alt="Profile avatar"
      style={circleStyle}
      className={className}
    />
  );
}
