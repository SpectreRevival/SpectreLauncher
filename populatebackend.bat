@echo off

git clone https://github.com/SpectreRevival/pragmabackend
cd pragmabackend
git submodule update --init --recursive
type nul > auth.json
cmake . --preset x64-release-win
cmake --build out/build/x64-release-win
call ../cleancppdir.bat out/build/x64-release-win ../src-tauri/pragmabackend
cd ..
rmdir /s /q pragmabackend