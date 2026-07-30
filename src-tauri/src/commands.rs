use crate::auth;
use crate::launcher;
use crate::models::{Project, Task, User};
use crate::scanner;
use crate::AppState;
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use std::collections::HashSet;
use std::path::Path;
use tauri::{AppHandle, Manager, State};
use uuid::Uuid;

#[tauri::command]
pub fn initialize_db(state: State<'_, AppState>) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|e| e.to_string())?;
    Ok("Sizil database ready.".to_string())
}

#[tauri::command]
pub fn sign_up(
    username: String,
    password: String,
    state: State<'_, AppState>,
) -> Result<User, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    auth::sign_up(&conn, &username, &password)
}

#[tauri::command]
pub fn sign_in(
    username: String,
    password: String,
    state: State<'_, AppState>,
) -> Result<User, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    auth::sign_in(&conn, &username, &password)
}

#[tauri::command]
pub fn get_user(user_id: String, state: State<'_, AppState>) -> Result<User, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    auth::fetch_user(&conn, &user_id)
}

#[tauri::command]
pub fn upload_avatar(
    user_id: String,
    source_path: String,
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<User, String> {
    let source = Path::new(&source_path);
    if !source.is_file() {
        return Err(format!("'{source_path}' is not a valid file."));
    }

    let ext = source.extension().and_then(|e| e.to_str()).unwrap_or("png");
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let avatars_dir = app_data_dir.join("avatars");
    std::fs::create_dir_all(&avatars_dir).map_err(|e| e.to_string())?;

    let dest = avatars_dir.join(format!("{user_id}.{ext}"));
    std::fs::copy(source, &dest).map_err(|e| e.to_string())?;

    let conn = state.db.lock().map_err(|e| e.to_string())?;
    auth::set_avatar(&conn, &user_id, &dest.to_string_lossy())
}

#[tauri::command]
pub fn set_preset_avatar(
    user_id: String,
    slug: String,
    state: State<'_, AppState>,
) -> Result<User, String> {
    const VALID_SLUGS: &[&str] = &["ava1", "ava2", "ava3", "ava4", "ava5", "ava6"];
    if !VALID_SLUGS.contains(&slug.as_str()) {
        return Err(format!("'{slug}' is not a valid preset avatar."));
    }
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    auth::set_avatar(&conn, &user_id, &slug)
}

#[tauri::command]
pub fn get_projects(user_id: String, state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    query_all_projects(&conn, &user_id)
}

#[tauri::command]
pub fn add_project(
    user_id: String,
    path: String,
    state: State<'_, AppState>,
) -> Result<Project, String> {
    let root = Path::new(&path);
    if !root.is_dir() {
        return Err(format!("'{path}' is not a valid directory."));
    }
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    insert_project(&conn, &user_id, root)
}

#[tauri::command]
pub fn scan_directory(
    user_id: String,
    parent_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<Project>, String> {
    let parent = Path::new(&parent_path);
    if !parent.is_dir() {
        return Err(format!("'{parent_path}' is not a valid directory."));
    }

    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let existing_paths: HashSet<String> = query_all_projects(&conn, &user_id)?
        .into_iter()
        .map(|p| p.path)
        .collect();

    let parent_language = scanner::detect_primary_language(parent);
    if parent_language != "Unknown" {
        let parent_str = parent.to_string_lossy().to_string();
        if existing_paths.contains(&parent_str) {
            return Ok(Vec::new());
        }
        return insert_project(&conn, &user_id, parent).map(|p| vec![p]);
    }

    let entries = std::fs::read_dir(parent).map_err(|e| e.to_string())?;
    let mut newly_added = Vec::new();

    for entry in entries.filter_map(|e| e.ok()) {
        let candidate = entry.path();
        if !candidate.is_dir() {
            continue;
        }

        let candidate_str = candidate.to_string_lossy().to_string();
        if existing_paths.contains(&candidate_str) {
            continue;
        }

        let language = scanner::detect_primary_language(&candidate);
        if language == "Unknown" {
            continue;
        }

        if let Ok(project) = insert_project(&conn, &user_id, &candidate) {
            newly_added.push(project);
        }
    }

    Ok(newly_added)
}

#[tauri::command]
pub fn update_project_status(
    id: String,
    status: String,
    state: State<'_, AppState>,
) -> Result<Project, String> {
    const VALID: &[&str] = &["ACTIVE", "PAUSED", "ARCHIVED", "COMPLETED", "DELETED"];
    if !VALID.contains(&status.as_str()) {
        return Err(format!("Unknown status '{status}'."));
    }

    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    let result = match status.as_str() {
        "COMPLETED" => conn.execute(
            "UPDATE projects SET status = ?1, completed_at = ?2, deleted_at = NULL WHERE id = ?3",
            params![status, now, id],
        ),
        "DELETED" => conn.execute(
            "UPDATE projects SET status = ?1, deleted_at = ?2 WHERE id = ?3",
            params![status, now, id],
        ),
        _ => conn.execute(
            "UPDATE projects SET status = ?1, completed_at = NULL, deleted_at = NULL WHERE id = ?2",
            params![status, id],
        ),
    };
    result.map_err(|e| e.to_string())?;

    fetch_project(&conn, &id)
}

#[tauri::command]
pub fn permanently_delete_project(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM projects WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn launch_tool(tool: String, path: String) -> Result<(), String> {
    launcher::launch(&tool, &path)
}

#[tauri::command]
pub fn get_tasks(project_id: String, state: State<'_, AppState>) -> Result<Vec<Task>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, title, status, due_date FROM tasks
             WHERE project_id = ?1 ORDER BY rowid ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| {
            Ok(Task {
                id: row.get(0)?,
                project_id: row.get(1)?,
                title: row.get(2)?,
                status: row.get(3)?,
                due_date: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_task(
    project_id: String,
    title: String,
    state: State<'_, AppState>,
) -> Result<Task, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO tasks (id, project_id, title, status) VALUES (?1, ?2, ?3, 'TODO')",
        params![id, project_id, title],
    )
    .map_err(|e| e.to_string())?;

    Ok(Task {
        id,
        project_id,
        title,
        status: "TODO".to_string(),
        due_date: None,
    })
}

#[tauri::command]
pub fn toggle_task(id: String, state: State<'_, AppState>) -> Result<Task, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let current: String = conn
        .query_row("SELECT status FROM tasks WHERE id = ?1", params![id], |row| {
            row.get(0)
        })
        .map_err(|e| e.to_string())?;

    let next = if current == "DONE" { "TODO" } else { "DONE" };
    conn.execute("UPDATE tasks SET status = ?1 WHERE id = ?2", params![next, id])
        .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, project_id, title, status, due_date FROM tasks WHERE id = ?1",
        params![id],
        |row| {
            Ok(Task {
                id: row.get(0)?,
                project_id: row.get(1)?,
                title: row.get(2)?,
                status: row.get(3)?,
                due_date: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_task(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn row_to_project(row: &rusqlite::Row<'_>) -> rusqlite::Result<Project> {
    let tech_stack_json: Option<String> = row.get(5)?;
    let tech_stack: Vec<String> = tech_stack_json
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default();

    Ok(Project {
        id: row.get(0)?,
        user_id: row.get(1)?,
        name: row.get(2)?,
        path: row.get(3)?,
        primary_language: row.get(4)?,
        tech_stack,
        status: row.get(6)?,
        last_modified: row.get(7)?,
        completed_at: row.get(8)?,
        deleted_at: row.get(9)?,
        created_at: row.get(10)?,
    })
}

const PROJECT_COLUMNS: &str = "id, user_id, name, path, primary_language, tech_stack, status, last_modified, completed_at, deleted_at, created_at";

fn query_all_projects(conn: &Connection, user_id: &str) -> Result<Vec<Project>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {PROJECT_COLUMNS} FROM projects WHERE user_id = ?1 ORDER BY created_at DESC"
        ))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![user_id], row_to_project)
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

fn fetch_project(conn: &Connection, id: &str) -> Result<Project, String> {
    conn.query_row(
        &format!("SELECT {PROJECT_COLUMNS} FROM projects WHERE id = ?1"),
        params![id],
        row_to_project,
    )
    .map_err(|e| e.to_string())
}

fn insert_project(conn: &Connection, user_id: &str, root: &Path) -> Result<Project, String> {
    let path = root.to_string_lossy().to_string();

    let name = root
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Untitled Project")
        .to_string();

    let primary_language = scanner::detect_primary_language(root);
    let tech_stack = scanner::detect_all_technologies(root, &primary_language);
    let tech_stack_json = serde_json::to_string(&tech_stack).unwrap_or_else(|_| "[]".to_string());

    let last_modified = root
        .metadata()
        .and_then(|m| m.modified())
        .map(|t| DateTime::<Utc>::from(t).to_rfc3339())
        .unwrap_or_else(|_| Utc::now().to_rfc3339());

    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO projects
            (id, user_id, name, path, primary_language, tech_stack, status, last_modified, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'ACTIVE', ?7, ?8)",
        params![
            id,
            user_id,
            name,
            path,
            primary_language,
            tech_stack_json,
            last_modified,
            created_at
        ],
    )
    .map_err(|e| {
        if e.to_string().contains("UNIQUE constraint failed") {
            format!("'{path}' is already tracked in Sizil.")
        } else {
            e.to_string()
        }
    })?;

    Ok(Project {
        id,
        user_id: user_id.to_string(),
        name,
        path,
        primary_language,
        tech_stack,
        status: "ACTIVE".to_string(),
        last_modified: Some(last_modified),
        completed_at: None,
        deleted_at: None,
        created_at,
    })
}
