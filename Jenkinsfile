pipeline {
    agent none
    stages {
        stage("Build elements"){
            parallel {
                stages {
                    stage("Autoformat rust code"){
                        steps {
                            checkout scm
                            dir("src-tauri"){
                                sh "cargo fmt"
                            }
                            sh """
                                if ! git diff --quiet; then
                                    git diff > fmt.patch
                                    echo "Patch created, apply the patch from the artifacts section to fix"
                                else
                                    echo "No changes required"
                                fi
                            """
                            if (fileExists('fmt.patch')) {
                                 archiveArtifacts artifacts: 'fmt.patch', fingerprint: true
                                 sh "rm fmt.patch"
                                 error("Linter changes required")
                            }
                        }
                    }
                    stage("Lint rust code"){
                         steps {
                             checkout scm
                             dir("src-tauri"){
                                 sh "cargo clippy"
                             }
                             sh """
                                 if ! git diff --quiet; then
                                     git diff > clippy.patch
                                     echo "Patch created, apply the patch from the artifacts section to fix"
                                 else
                                     echo "No changes required"
                                 fi
                             """
                             if(fileExists('clippy.patch')){
                                 archiveArtifacts artifacts: 'clippy.patch', fingerprint: true
                                 sh "rm clippy.patch"
                                 error("Linter changes required")
                             }
                         }
                    }
                    stage("Javascript lint"){
                        steps {
                            checkout scm
                            sh "npm ci"
                            sh "npm run lint:fix"
                            sh """
                                if ! git diff --quiet; then
                                     git diff > eslint.patch
                                     echo "Patch created, apply the patch from the artifacts section to fix"
                                else
                                    echo "No changes required"
                                fi
                            """
                            if(fileExists('eslint.patch')){
                                archiveArtifacts artifacts: 'eslint.patch', fingerprint: true
                                sh "rm eslint.patch"
                                error("Linter changes required")
                            }
                        }
                    }
                    stage("Windows build"){
                        agent { label 'windows && x64' }
                        steps {
                            checkout scm
                            bat "npm i"
                            bat "npm run tauri build"
                            archiveArtifacts artifacts: 'src-tauri/target/release/bundle/nsis/*.msi', fingerprint: true
                        }
                    }
                    stage("Linux build"){
                        agent { label 'linux && x64' }
                        steps {
                            checkout scm
                            sh "npm i"
                            sh "npm run tauri build"
                            archiveArtifacts 'src-tauri/target/release/bundle/appimage/*.AppImage', fingerprint: true
                        }
                    }
                }
            }
        }
    }
}