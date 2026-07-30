use crate::models::User;
use rusqlite::{params, Connection};
use uuid::Uuid;

const BCRYPT_COST: u32 = 10;
const MIN_PASSWORD_LEN: usize = 6;

pub fn sign_up(conn: &Connection, username: &str, password: &str) -> Result<User, String> {
    let username = username.trim();
    if username.is_empty() {
        return Err("Username can't be empty.".to_string());
    }
    if password.len() < MIN_PASSWORD_LEN {
        return Err(format!(
            "Password must be at least {MIN_PASSWORD_LEN} characters."
        ));
    }

    let hash = bcrypt::hash(password, BCRYPT_COST).map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO users (id, username, password_hash) VALUES (?1, ?2, ?3)",
        params![id, username, hash],
    )
    .map_err(|e| {
        if e.to_string().contains("UNIQUE constraint failed") {
            format!("'{username}' is already taken.")
        } else {
            e.to_string()
        }
    })?;

    fetch_user(conn, &id)
}

pub fn sign_in(conn: &Connection, username: &str, password: &str) -> Result<User, String> {
    let username = username.trim();

    let mut stmt = conn
        .prepare(
            "SELECT id, username, password_hash, avatar_path, created_at
             FROM users WHERE username = ?1",
        )
        .map_err(|e| e.to_string())?;

    let (id, username, password_hash, avatar_path, created_at) = stmt
        .query_row(params![username], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, String>(4)?,
            ))
        })
        .map_err(|_| "No account with that username.".to_string())?;

    let matches = bcrypt::verify(password, &password_hash).map_err(|e| e.to_string())?;
    if !matches {
        return Err("Incorrect password.".to_string());
    }

    Ok(User {
        id,
        username,
        avatar_path,
        created_at,
    })
}

pub fn fetch_user(conn: &Connection, id: &str) -> Result<User, String> {
    conn.query_row(
        "SELECT id, username, avatar_path, created_at FROM users WHERE id = ?1",
        params![id],
        |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                avatar_path: row.get(2)?,
                created_at: row.get(3)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

pub fn set_avatar(conn: &Connection, user_id: &str, avatar_path: &str) -> Result<User, String> {
    conn.execute(
        "UPDATE users SET avatar_path = ?1 WHERE id = ?2",
        params![avatar_path, user_id],
    )
    .map_err(|e| e.to_string())?;
    fetch_user(conn, user_id)
}
