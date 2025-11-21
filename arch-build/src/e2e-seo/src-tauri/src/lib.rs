use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
struct SeoCheckResult {
    success: bool,
    data: Option<serde_json::Value>,
    error: Option<String>,
}

#[tauri::command]
async fn run_seo_check(url: String, config: Option<String>) -> Result<SeoCheckResult, String> {
    // Build the command to run the SEO checker
    let mut cmd = Command::new("node");

    // Get the app directory to find the CLI
    let app_dir = std::env::current_dir()
        .map_err(|e| format!("Failed to get current directory: {}", e))?;

    let cli_path = app_dir.join("dist").join("cli.js");

    cmd.arg(cli_path.to_str().unwrap())
        .arg(&url)
        .arg("--json");

    // Add config if provided
    if let Some(cfg) = config {
        cmd.arg("--config").arg(cfg);
    }

    // Execute the command
    let output = cmd.output()
        .map_err(|e| format!("Failed to execute SEO checker: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let data: serde_json::Value = serde_json::from_str(&stdout)
            .map_err(|e| format!("Failed to parse JSON output: {}", e))?;

        Ok(SeoCheckResult {
            success: true,
            data: Some(data),
            error: None,
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Ok(SeoCheckResult {
            success: false,
            data: None,
            error: Some(stderr.to_string()),
        })
    }
}

#[tauri::command]
async fn get_available_presets() -> Result<Vec<String>, String> {
    Ok(vec![
        "basic".to_string(),
        "advanced".to_string(),
        "strict".to_string(),
    ])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![run_seo_check, get_available_presets])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
