// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::*;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            check_whatsapp_installation,
            get_platform,
            open_whatsapp_deeplink,
            test_whatsapp_connection,
            get_whatsapp_installation_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}