## Project setup
1. Launch VS developer command prompt and run `populatebackend.bat` inside project root dir
2. Run `npm run tauri dev` to launch dev version of app
3. If you want to make a full build, run `npm run tauri build`, this will generate installers under src-tauri/target/release/bundle

Note that running the build will pull the latest version of the backend again.

## Recommended IDE Setup (tauri docs)

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
