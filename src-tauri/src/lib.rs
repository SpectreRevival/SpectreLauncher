use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::{LazyLock, Mutex};
use tauri::AppHandle;
use tauri_plugin_store::StoreBuilder;
use winreg::enums::*;
use winreg::RegKey;

#[tauri::command]
fn find_spectre_divide_path() -> Option<String> {
    let target_filename = "SpectreClient-Win64-Shipping.exe";
    let game_folder_name = "Spectre Divide";

    // 1. Find Steam Install Path via Registry
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    let steam_path: String = hkcu
        .open_subkey("Software\\Valve\\Steam")
        .and_then(|key| key.get_value("SteamPath"))
        .or_else(|_| {
            hklm.open_subkey("SOFTWARE\\WOW6432Node\\Valve\\Steam")
                .and_then(|key| key.get_value("InstallPath"))
        })
        .ok()?;

    let mut library_paths = vec![PathBuf::from(&steam_path)];

    // 2. Parse libraryfolders.vdf to find other Steam libraries
    let vdf_path = Path::new(&steam_path)
        .join("steamapps")
        .join("libraryfolders.vdf");
    if let Ok(content) = fs::read_to_string(vdf_path) {
        // Simple regex-like parsing for "path" entries
        for line in content.lines() {
            if line.contains("\"path\"") {
                let parts: Vec<&str> = line.split('"').collect();
                if parts.len() >= 4 {
                    let path = parts[3].replace("\\\\", "\\");
                    library_paths.push(PathBuf::from(path));
                }
            }
        }
    }

    // 3. Search libraries for the executable
    for lib in library_paths {
        let game_dir = lib.join("steamapps").join("common").join(game_folder_name);
        if game_dir.exists() {
            // Recursive search for the executable
            if let Some(found_path) = find_file_recursive(&game_dir, target_filename) {
                return Some(found_path.to_string_lossy().into_owned());
            }
        }
    }

    None
}

fn find_file_recursive(dir: &Path, target: &str) -> Option<PathBuf> {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Some(found) = find_file_recursive(&path, target) {
                    return Some(found);
                }
            } else if path.file_name().and_then(|n| n.to_str()) == Some(target) {
                return Some(path);
            }
        }
    }
    None
}

const SPECTRE_APP_ID: &str = "2641470";
static LAUNCHED_PROCESSES: LazyLock<Mutex<Vec<Child>>> = LazyLock::new(|| Mutex::new(Vec::new()));

fn is_process_running(proc: &mut Child) -> bool {
    match proc.try_wait() {
        Ok(None) => true, // Still running
        _ => false,       // Exited, or an error occurred
    }
}

#[tauri::command]
fn has_spectre_been_launched() -> bool {
    let mut processes = LAUNCHED_PROCESSES.lock().unwrap();

    processes.retain_mut(|proc| is_process_running(proc));

    !processes.is_empty()
}

#[tauri::command]
async fn launch_spectre_divide(app: AppHandle) {
    let path = PathBuf::from("settingsStore.json");

    let store = StoreBuilder::new(&app, path)
        .build()
        .expect("Failed to create store");
    store.reload().expect("Store must load");
    let game_executable_path: String = store
        .get("binaryPath")
        .unwrap()
        .as_str()
        .unwrap()
        .to_string();
    if game_executable_path.is_empty() {
        return;
    }

    let backend_address: String = store
        .get("backendAddress")
        .unwrap()
        .as_str()
        .unwrap()
        .to_string();

    let backend_port: i64 = store
        .get("backendPort")
        .unwrap()
        .as_number()
        .unwrap()
        .as_i64()
        .unwrap();

    let _proc = Command::new(&game_executable_path)
        .arg(format!(
            "-PragmaBackendAddress=http://{}:{}/",
            backend_address, backend_port
        ))
        .arg("-PragmaEnvironment=live")
        .env("STEAMID", "PlayerSTEAMID")
        .env("SteamGameId", SPECTRE_APP_ID)
        .env("SteamAppID", SPECTRE_APP_ID)
        .env("SteamOverlayGameId", SPECTRE_APP_ID)
        .spawn();
    LAUNCHED_PROCESSES.lock().unwrap().push(_proc.unwrap());
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            find_spectre_divide_path,
            launch_spectre_divide,
            has_spectre_been_launched
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
