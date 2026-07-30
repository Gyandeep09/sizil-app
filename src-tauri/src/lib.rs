mod auth;
mod commands;
mod db;
mod launcher;
mod models;
mod scanner;

use std::sync::Mutex;
use tauri::Manager;

pub struct AppState {
    pub db: Mutex<rusqlite::Connection>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            let conn = db::init_connection(&app_handle)
                .expect("failed to initialize sizil.db");

            app.manage(AppState {
                db: Mutex::new(conn),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::initialize_db,
            commands::sign_up,
            commands::sign_in,
            commands::get_user,
            commands::upload_avatar,
            commands::set_preset_avatar,
            commands::get_projects,
            commands::add_project,
            commands::scan_directory,
            commands::update_project_status,
            commands::permanently_delete_project,
            commands::launch_tool,
            commands::get_tasks,
            commands::add_task,
            commands::toggle_task,
            commands::delete_task,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Sizil");
}
