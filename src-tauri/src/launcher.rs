use std::path::Path;

pub fn launch(tool: &str, path: &str) -> Result<(), String> {
    let root = Path::new(path);
    if !root.is_dir() {
        return Err(format!("'{path}' is not a valid directory."));
    }

    let result = match tool {
        "vscode" => platform::vscode(path),
        "neovim" => platform::neovim_terminal(path),
        "terminal" => platform::terminal(path),
        "explorer" => platform::file_manager(path),
        other => {
            return Err(format!(
                "Unknown launcher target '{other}'. Expected one of: vscode, neovim, terminal, explorer."
            ))
        }
    };

    result.map_err(|e| format!("Failed to launch {tool}: {e}"))
}

#[cfg(target_os = "windows")]
mod platform {
    use std::io;
    use std::process::Command;

    fn has_windows_terminal() -> bool {
        Command::new("where")
            .args(["wt"])
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }

    pub fn vscode(path: &str) -> io::Result<()> {
        Command::new("cmd").args(["/C", "code", path]).spawn()?;
        Ok(())
    }

    pub fn neovim_terminal(path: &str) -> io::Result<()> {
        if has_windows_terminal() {
            Command::new("wt").args(["-d", path, "nvim", "."]).spawn()?;
        } else {
            Command::new("cmd")
                .args(["/K", "nvim", "."])
                .current_dir(path)
                .spawn()?;
        }
        Ok(())
    }

    pub fn terminal(path: &str) -> io::Result<()> {
        if has_windows_terminal() {
            Command::new("wt").args(["-d", path]).spawn()?;
        } else {
            Command::new("cmd").current_dir(path).spawn()?;
        }
        Ok(())
    }

    pub fn file_manager(path: &str) -> io::Result<()> {
        Command::new("explorer").arg(path).spawn()?;
        Ok(())
    }
}

#[cfg(target_os = "macos")]
mod platform {
    use std::io;
    use std::process::Command;

    pub fn vscode(path: &str) -> io::Result<()> {
        Command::new("code").arg(path).spawn()?;
        Ok(())
    }

    pub fn neovim_terminal(path: &str) -> io::Result<()> {
        Command::new("open").args(["-a", "Terminal", path]).spawn()?;
        Ok(())
    }

    pub fn terminal(path: &str) -> io::Result<()> {
        Command::new("open").args(["-a", "Terminal", path]).spawn()?;
        Ok(())
    }

    pub fn file_manager(path: &str) -> io::Result<()> {
        Command::new("open").arg(path).spawn()?;
        Ok(())
    }
}

#[cfg(target_os = "linux")]
mod platform {
    use std::io;
    use std::process::Command;

    pub fn vscode(path: &str) -> io::Result<()> {
        Command::new("code").arg(path).spawn()?;
        Ok(())
    }

    pub fn neovim_terminal(path: &str) -> io::Result<()> {
        Command::new("x-terminal-emulator")
            .args(["-e", "nvim", "."])
            .current_dir(path)
            .spawn()?;
        Ok(())
    }

    pub fn terminal(path: &str) -> io::Result<()> {
        Command::new("x-terminal-emulator").current_dir(path).spawn()?;
        Ok(())
    }

    pub fn file_manager(path: &str) -> io::Result<()> {
        Command::new("xdg-open").arg(path).spawn()?;
        Ok(())
    }
}
