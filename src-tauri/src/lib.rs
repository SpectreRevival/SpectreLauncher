use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{LazyLock, Mutex};
use std::{fs, thread};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Emitter, Manager};
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

    processes.retain_mut(is_process_running);

    !processes.is_empty()
}

fn get_current_steam64() -> u64 {
    // The base constant for SteamID64 conversion
    const STEAM_64_BASE: u64 = 76_561_197_960_265_728;
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let steam_key = hkcu.open_subkey("Software\\Valve\\Steam\\ActiveProcess").unwrap();
    let active_user: u32 = steam_key.get_value("ActiveUser").unwrap();
    if active_user == 0 {
        panic!("Steam not logged in");
    } else {
        return STEAM_64_BASE + active_user as u64;
    }
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
        .env("STEAMID", get_current_steam64().to_string())
        .env("SteamGameId", SPECTRE_APP_ID)
        .env("SteamAppID", SPECTRE_APP_ID)
        .env("SteamOverlayGameId", SPECTRE_APP_ID)
        .spawn();
    LAUNCHED_PROCESSES.lock().unwrap().push(_proc.unwrap());
}

static SERVER_PROCESSES: LazyLock<Mutex<Vec<Child>>> = LazyLock::new(|| Mutex::new(Vec::new()));

#[tauri::command]
fn is_server_running() -> bool {
    let mut processes = SERVER_PROCESSES.lock().unwrap();

    processes.retain_mut(is_process_running);

    !processes.is_empty()
}

#[tauri::command]
async fn launch_pragmabackend(
    app: AppHandle,
    game_port: i64,
    social_port: i64,
    websocket_port: i64,
) {
    let server_exe_path = app
        .path()
        .resolve(
            "assets/pragmabackend/pragmabackend.exe",
            BaseDirectory::Resource,
        )
        .unwrap();
    let mut _proc = Command::new(server_exe_path)
        .arg(websocket_port.to_string())
        .arg(social_port.to_string())
        .arg(game_port.to_string())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .stdin(Stdio::piped())
        .spawn()
        .unwrap();
    let stdout = _proc.stdout.take().expect("stdout is piped");
    let stderr = _proc.stderr.take().expect("stderr is piped");

    let app_stdout = app.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            match line {
                Ok(content) => {
                    app_stdout
                        .emit("new-stdout-content", content)
                        .expect("failed to send data to frontend");
                }
                Err(e) => eprintln!("error reading line: {}", e),
            }
        }
    });

    let app_stderr = app.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            match line {
                Ok(content) => {
                    app_stderr
                        .emit("new-stderr-content", content)
                        .expect("failed to send data to frontend");
                }
                Err(e) => eprintln!("error reading line: {}", e),
            }
        }
    });

    SERVER_PROCESSES.lock().unwrap().push(_proc);
}

#[tauri::command]
fn shutdown_pragmabackend() {
    let processes = {
        let mut lock = SERVER_PROCESSES.lock().unwrap();
        std::mem::take(&mut *lock)
    };
    for mut child in processes {
        match child.kill() {
            Ok(_) => {
                // wait until it fully exits
                let _ = child.wait();
            }
            Err(e) => eprintln!("error shutting down pragmabackend process: {}", e),
        }
    }
}

#[tauri::command]
fn send_stdin(content: String) {
    for child in SERVER_PROCESSES.lock().unwrap().iter_mut() {
        child
            .stdin
            .take()
            .unwrap()
            .write_all(content.as_bytes())
            .unwrap();
    }
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
            has_spectre_been_launched,
            launch_pragmabackend,
            is_server_running,
            shutdown_pragmabackend,
            send_stdin
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
