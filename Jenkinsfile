pipeline {
    agent none

    stages {
        stage("Build and Lint") {
            parallel {
                stage("Autoformat Rust") {
                    agent { label 'linux' }
                    steps {
                        checkout scm
                        dir("src-tauri") {
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
                        script {
                            if (fileExists('fmt.patch')) {
                                archiveArtifacts artifacts: 'fmt.patch', fingerprint: true
                                sh "rm fmt.patch"
                                error("Rust formatting changes required")
                            }
                        }
                    }
                }

                stage("Lint Rust (Clippy)") {
                    agent { label 'linux' }
                    steps {
                        checkout scm
                        dir("src-tauri") {
                            sh "cargo clippy --fix --lib -p spectrelauncher -- "
                        }
                        sh """
                            if ! git diff --quiet; then
                                git diff > clippy.patch
                                echo "Patch created, apply the patch from the artifacts section to fix"
                            else
                                echo "No changes required"
                            fi
                        """
                        script {
                            if (fileExists('clippy.patch')) {
                                archiveArtifacts artifacts: 'clippy.patch', fingerprint: true
                                sh "rm clippy.patch"
                                error("Clippy linter changes required")
                            }
                        }
                    }
                }

                stage("Lint Rust (Check)"){
                    agent { label 'linux' }
                    steps {
                        checkout scm
                        dir("src-tauri"){
                            sh "cargo fix --lib -p spectrelauncher"
                        }
                        sh """
                            if ! git diff --quiet; then
                                git diff > check.patch
                                echo "Patch created, apply the patch from the artifacts section to fix"
                            else
                                echo "No changes required"
                            fi
                        """
                        script {
                            if (fileExists('check.patch')) {
                                archiveArtifacts artifacts: 'check.patch', fingerprint: true
                                sh "rm check.patch"
                                error("Check linter changes required")
                            }
                        }
                    }
                }

                stage("JS Lint (ESLint)") {
                    agent { label 'linux' }
                    steps {
                        checkout scm
                        sh "npm ci"
                        sh "npm run lint"
                        sh """
                            if ! git diff --quiet; then
                                git diff > eslint.patch
                                echo "Patch created, apply the patch from the artifacts section to fix"
                            else
                                echo "No changes required"
                            fi
                        """
                        script {
                            if (fileExists('eslint.patch')) {
                                archiveArtifacts artifacts: 'eslint.patch', fingerprint: true
                                sh "rm eslint.patch"
                                error("ESLint changes required")
                            }
                        }
                    }
                }

                stage("Windows Build") {
                    agent { label 'windows && x64' }
                    steps {
                        checkout scm
                        bat "npm i"
                        bat "npm run tauri build"
                        archiveArtifacts artifacts: 'src-tauri/target/release/bundle/nsis/*.exe', fingerprint: true
                    }
                }

                stage("Linux Build") {
                    agent { label 'linux && x64' }
                    steps {
                        checkout scm
                        sh "npm i"
                        sh "npm run tauri build"
                        archiveArtifacts artifacts: 'src-tauri/target/release/bundle/appimage/*.AppImage', fingerprint: true
                    }
                }
            }
        }
    }
}