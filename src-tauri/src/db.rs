use rusqlite::Connection;
use std::fs;
use tauri::{AppHandle, Manager};

pub fn init_connection(app_handle: &AppHandle) -> rusqlite::Result<Connection> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .expect("could not resolve app data directory");

    fs::create_dir_all(&app_data_dir).expect("failed to create app data directory");
    fs::create_dir_all(app_data_dir.join("avatars"))
        .expect("failed to create avatars directory");

    let db_path = app_data_dir.join("sizil.db");
    let conn = Connection::open(db_path)?;

    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "foreign_keys", true)?;

    run_migrations(&conn)?;
    Ok(conn)
}

fn run_migrations(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id             TEXT PRIMARY KEY,
            username       TEXT UNIQUE NOT NULL,
            password_hash  TEXT NOT NULL,
            avatar_path    TEXT,
            created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS projects (
            id                TEXT PRIMARY KEY,
            user_id           TEXT NOT NULL,
            name              TEXT NOT NULL,
            path              TEXT UNIQUE NOT NULL,
            primary_language  TEXT NOT NULL,
            tech_stack        TEXT,
            status            TEXT NOT NULL DEFAULT 'ACTIVE',
            last_modified     DATETIME,
            completed_at      DATETIME,
            deleted_at        DATETIME,
            created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notes (
            id          TEXT PRIMARY KEY,
            project_id  TEXT NOT NULL,
            title       TEXT NOT NULL,
            content     TEXT,
            updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id          TEXT PRIMARY KEY,
            project_id  TEXT NOT NULL,
            title       TEXT NOT NULL,
            status      TEXT NOT NULL DEFAULT 'TODO',
            due_date    DATETIME,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS snippets (
            id          TEXT PRIMARY KEY,
            title       TEXT NOT NULL,
            code        TEXT NOT NULL,
            language    TEXT NOT NULL DEFAULT 'text',
            created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_notes_project_id ON notes(project_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
        CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
        "#,
    )?;
    add_column_if_missing(conn, "projects", "user_id", "TEXT")?;
    add_column_if_missing(conn, "projects", "tech_stack", "TEXT")?;
    add_column_if_missing(conn, "projects", "completed_at", "DATETIME")?;
    add_column_if_missing(conn, "projects", "deleted_at", "DATETIME")?;
    conn.execute_batch(
        "CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);",
    )?;

    Ok(())
}

fn add_column_if_missing(
    conn: &Connection,
    table: &str,
    column: &str,
    sql_type: &str,
) -> rusqlite::Result<()> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({table})"))?;
    let existing: Vec<String> = stmt
        .query_map([], |row| row.get::<_, String>(1))?
        .filter_map(|r| r.ok())
        .collect();

    if !existing.iter().any(|c| c == column) {
        conn.execute_batch(&format!(
            "ALTER TABLE {table} ADD COLUMN {column} {sql_type};"
        ))?;
    }
    Ok(())
}
