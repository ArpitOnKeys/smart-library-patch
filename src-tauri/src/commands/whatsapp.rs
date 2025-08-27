use tauri::command;
use std::process::Command;
use std::path::Path;

#[derive(serde::Serialize)]
pub struct WhatsAppResult {
    success: bool,
    error: Option<String>,
}

#[derive(serde::Serialize)]
pub struct InstallationInfo {
    is_installed: bool,
    platform: String,
    whatsapp_path: Option<String>,
}

/// Check if WhatsApp Desktop is installed on the system
#[command]
pub async fn check_whatsapp_installation() -> Result<bool, String> {
    let platform = std::env::consts::OS;
    
    match platform {
        "windows" => check_windows_whatsapp(),
        "macos" => check_macos_whatsapp(),
        "linux" => check_linux_whatsapp(),
        _ => Ok(false),
    }
}

/// Get the current platform
#[command]
pub async fn get_platform() -> Result<String, String> {
    Ok(std::env::consts::OS.to_string())
}

/// Open WhatsApp with a deep link (phone and message)
#[command]
pub async fn open_whatsapp_deeplink(phone: String, message: String) -> Result<WhatsAppResult, String> {
    // Encode the message for URL
    let encoded_message = urlencoding::encode(&message);
    
    // Format phone number (remove + and any non-digits)
    let formatted_phone = phone.chars()
        .filter(|c| c.is_ascii_digit())
        .collect::<String>();
    
    // Create WhatsApp deep link
    let whatsapp_url = format!("whatsapp://send?phone={}&text={}", formatted_phone, encoded_message);
    
    match open_url(&whatsapp_url) {
        Ok(_) => Ok(WhatsAppResult {
            success: true,
            error: None,
        }),
        Err(e) => Ok(WhatsAppResult {
            success: false,
            error: Some(e.to_string()),
        }),
    }
}

/// Test WhatsApp connection by opening the app
#[command]
pub async fn test_whatsapp_connection() -> Result<WhatsAppResult, String> {
    match open_url("whatsapp://") {
        Ok(_) => Ok(WhatsAppResult {
            success: true,
            error: None,
        }),
        Err(e) => Ok(WhatsAppResult {
            success: false,
            error: Some(e.to_string()),
        }),
    }
}

/// Get detailed WhatsApp installation information
#[command]
pub async fn get_whatsapp_installation_info() -> Result<InstallationInfo, String> {
    let platform = std::env::consts::OS.to_string();
    let is_installed = check_whatsapp_installation().await.unwrap_or(false);
    
    Ok(InstallationInfo {
        is_installed,
        platform,
        whatsapp_path: None, // Could be expanded to return actual path
    })
}

// Platform-specific installation checks
fn check_windows_whatsapp() -> Result<bool, String> {
    let common_paths = vec![
        r"C:\Users\%USERNAME%\AppData\Local\WhatsApp\WhatsApp.exe",
        r"C:\Users\%USERNAME%\AppData\Roaming\WhatsApp\WhatsApp.exe",
        r"C:\Program Files\WhatsApp\WhatsApp.exe",
        r"C:\Program Files (x86)\WhatsApp\WhatsApp.exe",
    ];
    
    for path_template in common_paths {
        // Expand environment variables
        if let Ok(username) = std::env::var("USERNAME") {
            let path = path_template.replace("%USERNAME%", &username);
            if Path::new(&path).exists() {
                return Ok(true);
            }
        }
    }
    
    // Try to detect via registry or protocol
    match Command::new("reg")
        .args(&["query", "HKEY_CLASSES_ROOT\\whatsapp"])
        .output()
    {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}

fn check_macos_whatsapp() -> Result<bool, String> {
    let common_paths = vec![
        "/Applications/WhatsApp.app",
        "/System/Applications/WhatsApp.app",
    ];
    
    for path in common_paths {
        if Path::new(path).exists() {
            return Ok(true);
        }
    }
    
    // Check if user has WhatsApp in their Applications folder
    if let Ok(home) = std::env::var("HOME") {
        let user_apps = format!("{}/Applications/WhatsApp.app", home);
        if Path::new(&user_apps).exists() {
            return Ok(true);
        }
    }
    
    Ok(false)
}

fn check_linux_whatsapp() -> Result<bool, String> {
    let common_paths = vec![
        "/usr/bin/whatsapp-desktop",
        "/usr/local/bin/whatsapp-desktop",
        "/opt/WhatsApp/whatsapp-desktop",
        "/snap/bin/whatsapp-for-linux",
        "/usr/bin/whatsapp-for-linux",
    ];
    
    for path in common_paths {
        if Path::new(path).exists() {
            return Ok(true);
        }
    }
    
    // Check user's local bin
    if let Ok(home) = std::env::var("HOME") {
        let local_bin = format!("{}/.local/bin/whatsapp-desktop", home);
        if Path::new(&local_bin).exists() {
            return Ok(true);
        }
    }
    
    // Try which command
    match Command::new("which")
        .arg("whatsapp-desktop")
        .output()
    {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}

// Cross-platform URL opening
fn open_url(url: &str) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(&["/C", "start", url])
            .spawn()?;
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(url)
            .spawn()?;
    }
    
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(url)
            .spawn()?;
    }
    
    Ok(())
}