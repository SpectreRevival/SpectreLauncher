@echo off
setlocal enabledelayedexpansion

:: 1. Argument Mapping
:: Usage: cleanup.bat <outputFolderPath> <dest> <isDebug>
set "SRC_DIR=%~1"
set "DEST_DIR=%~2"
set "IS_DEBUG=%~3"

:: Set default for DEST_DIR if not provided
if "%DEST_DIR%"=="" set "DEST_DIR=package"
:: Set default for IS_DEBUG if not provided
if "%IS_DEBUG%"=="" set "IS_DEBUG=false"

echo Cleaning up files from %SRC_DIR% and placing a cleaned version in %DEST_DIR%

:: 2. Clear and prep destination
if exist "%DEST_DIR%" rd /s /q "%DEST_DIR%"
mkdir "%DEST_DIR%"

:: 3. Copy contents
:: xcopy /e (recursive) /i (assume directory) /h (hidden) /y (suppress prompt)
xcopy "%SRC_DIR%\*" "%DEST_DIR%\" /e /i /h /y >nul

:: 4. Root and Deep Clean (Recursive deletion of specific file types)
pushd "%DEST_DIR%"

    :: Remove specific file extensions recursively
    del /s /q /f *.cc *.h *.cmake *.log *.ilk *.ninja_deps *.ninja_log 2>nul
    del /s /q /f auth.json build.ninja compile_commands.json CMakeCache.txt 2>nul

    :: Conditional PDB removal (Batch case-insensitive comparison)
    if /i "%IS_DEBUG%" neq "true" (
        del /s /q /f *.pdb 2>nul
    )

    :: Remove specific directories recursively
    :: Batch 'for /r' handles the recursion
    for /d /r %%i in (CMakeFiles) do if exist "%%i" rd /s /q "%%i"
    for /d /r %%i in (.cmake) do if exist "%%i" rd /s /q "%%i"
    for /d /r %%i in (vcpkg_installed) do if exist "%%i" rd /s /q "%%i"

    :: Clean up JSON files specifically inside directories containing 'CMakeFiles' logic
    :: Note: Batch is less surgical than PowerShell; this mimics the logic by targeting 'tests'
    if exist "tests" (
        del /q /f "tests\cmake_test_discovery*.json" 2>nul
    )

    :: General JSON cleanup (Matches the find -exec logic in the Unix block)
    del /s /q /f *.json 2>nul

popd

echo Cleanup complete.
endlocal