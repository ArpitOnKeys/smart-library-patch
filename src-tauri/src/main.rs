// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::command;
use std::process::Command;
use std::thread;
use std::time::Duration;

#[cfg(target_os = "windows")]
use winapi::um::winuser::{keybd_event, VK_RETURN, KEYEVENTF_KEYUP};

#[cfg(target_os = "macos")]
use core_graphics::event::{CGEvent, CGEventType, CGKeyCode};
#[cfg(target_os = "macos")]
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

#[cfg(target_os = "linux")]
use std::process::Stdio;

#[command]
async fn check_whatsapp_desktop() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("powershell")
            .arg("-Command")
            .arg("Get-Process WhatsApp -ErrorAction SilentlyContinue")
            .output();
        
        match output {
            Ok(result) => Ok(!result.stdout.is_empty()),
            Err(_) => {
                // Check if WhatsApp is installed
                let install_check = Command::new("powershell")
                    .arg("-Command")
                    .arg(r#"Get-AppxPackage | Where-Object {$_.Name -like "*WhatsApp*"}"#)
                    .output();
                
                match install_check {
                    Ok(result) => Ok(!result.stdout.is_empty()),
                    Err(_) => Ok(false)
                }
            }
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("pgrep")
            .arg("-f")
            .arg("WhatsApp")
            .output();
        
        match output {
            Ok(result) => Ok(result.status.success()),
            Err(_) => {
                // Check if WhatsApp is installed
                let install_check = Command::new("find")
                    .arg("/Applications")
                    .arg("-name")
                    .arg("WhatsApp.app")
                    .output();
                
                match install_check {
                    Ok(result) => Ok(!result.stdout.is_empty()),
                    Err(_) => Ok(false)
                }
            }
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        let output = Command::new("pgrep")
            .arg("-f")
            .arg("whatsapp")
            .output();
        
        match output {
            Ok(result) => Ok(result.status.success()),
            Err(_) => {
                // Check if WhatsApp is available via snap/flatpak
                let snap_check = Command::new("snap")
                    .arg("list")
                    .arg("whatsapp-for-linux")
                    .output();
                
                if let Ok(result) = snap_check {
                    if result.status.success() {
                        return Ok(true);
                    }
                }
                
                Ok(false)
            }
        }
    }
}

#[command]
async fn open_whatsapp_and_send(phone: String, message: String) -> Result<String, String> {
    let encoded_message = urlencoding::encode(&message);
    let url = format!("whatsapp://send?phone={}&text={}", phone, encoded_message);
    
    // Open WhatsApp with the URL
    #[cfg(target_os = "windows")]
    {
        let result = Command::new("rundll32")
            .arg("url.dll,FileProtocolHandler")
            .arg(&url)
            .output();
        
        match result {
            Ok(_) => {
                // Wait for WhatsApp to open and load
                thread::sleep(Duration::from_millis(3000));
                
                // Send Enter key to actually send the message
                unsafe {
                    keybd_event(VK_RETURN as u8, 0, 0, 0);
                    thread::sleep(Duration::from_millis(50));
                    keybd_event(VK_RETURN as u8, 0, KEYEVENTF_KEYUP, 0);
                }
                
                Ok("Message sent successfully".to_string())
            }
            Err(e) => Err(format!("Failed to open WhatsApp: {}", e))
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let result = Command::new("open")
            .arg(&url)
            .output();
        
        match result {
            Ok(_) => {
                // Wait for WhatsApp to open and load
                thread::sleep(Duration::from_millis(3000));
                
                // Send Enter key using Core Graphics
                let source = CGEventSource::new(CGEventSourceStateID::HIDSystemState)
                    .map_err(|e| format!("Failed to create event source: {:?}", e))?;
                
                let key_down = CGEvent::new_keyboard_event(source.clone(), CGKeyCode(0x24), true)
                    .map_err(|e| format!("Failed to create key down event: {:?}", e))?;
                let key_up = CGEvent::new_keyboard_event(source, CGKeyCode(0x24), false)
                    .map_err(|e| format!("Failed to create key up event: {:?}", e))?;
                
                key_down.post(CGEventType::KeyDown);
                thread::sleep(Duration::from_millis(50));
                key_up.post(CGEventType::KeyUp);
                
                Ok("Message sent successfully".to_string())
            }
            Err(e) => Err(format!("Failed to open WhatsApp: {}", e))
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        let result = Command::new("xdg-open")
            .arg(&url)
            .output();
        
        match result {
            Ok(_) => {
                // Wait for WhatsApp to open and load
                thread::sleep(Duration::from_millis(3000));
                
                // Send Enter key using xdotool
                let key_result = Command::new("xdotool")
                    .arg("key")
                    .arg("Return")
                    .output();
                
                match key_result {
                    Ok(_) => Ok("Message sent successfully".to_string()),
                    Err(_) => {
                        // Fallback: try with ydotool
                        let ydotool_result = Command::new("ydotool")
                            .arg("key")
                            .arg("28:1")  // Enter key
                            .arg("28:0")
                            .output();
                        
                        match ydotool_result {
                            Ok(_) => Ok("Message sent successfully".to_string()),
                            Err(e) => Err(format!("Failed to send key press. Install xdotool or ydotool: {}", e))
                        }
                    }
                }
            }
            Err(e) => Err(format!("Failed to open WhatsApp: {}", e))
        }
    }
}

#[command]
async fn simulate_key_press(key: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        match key.as_str() {
            "Enter" => {
                unsafe {
                    keybd_event(VK_RETURN as u8, 0, 0, 0);
                    thread::sleep(Duration::from_millis(50));
                    keybd_event(VK_RETURN as u8, 0, KEYEVENTF_KEYUP, 0);
                }
                Ok("Enter key pressed".to_string())
            }
            _ => Err("Unsupported key".to_string())
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        match key.as_str() {
            "Enter" => {
                let source = CGEventSource::new(CGEventSourceStateID::HIDSystemState)
                    .map_err(|e| format!("Failed to create event source: {:?}", e))?;
                
                let key_down = CGEvent::new_keyboard_event(source.clone(), CGKeyCode(0x24), true)
                    .map_err(|e| format!("Failed to create key down event: {:?}", e))?;
                let key_up = CGEvent::new_keyboard_event(source, CGKeyCode(0x24), false)
                    .map_err(|e| format!("Failed to create key up event: {:?}", e))?;
                
                key_down.post(CGEventType::KeyDown);
                thread::sleep(Duration::from_millis(50));
                key_up.post(CGEventType::KeyUp);
                
                Ok("Enter key pressed".to_string())
            }
            _ => Err("Unsupported key".to_string())
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        match key.as_str() {
            "Enter" => {
                let result = Command::new("xdotool")
                    .arg("key")
                    .arg("Return")
                    .output();
                
                match result {
                    Ok(_) => Ok("Enter key pressed".to_string()),
                    Err(_) => {
                        // Fallback to ydotool
                        let ydotool_result = Command::new("ydotool")
                            .arg("key")
                            .arg("28:1")
                            .arg("28:0")
                            .output();
                        
                        match ydotool_result {
                            Ok(_) => Ok("Enter key pressed".to_string()),
                            Err(e) => Err(format!("Key press failed: {}", e))
                        }
                    }
                }
            }
            _ => Err("Unsupported key".to_string())
        }
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            check_whatsapp_desktop,
            open_whatsapp_and_send,
            simulate_key_press
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}