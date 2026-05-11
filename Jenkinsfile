pipeline {
    agent none

    tools {
        nodejs 'node24'
    }

    stages {
        stage("Parallel Checks and Build") {
            parallel {
                stage("Autoformat Rust") {
                    agent { label 'windows' }
                    steps {
                        checkout scm
                        dir("src-tauri") {
                            bat "cargo fmt"
                        }
                        bat """
                            git diff --quiet
                            if %errorlevel% neq 0 (
                                git diff > fmt.patch
                                echo Patch created, apply the patch from the artifacts section to fix
                            ) else (
                                echo No changes required
                            )
                        """
                        script {
                            if (fileExists('fmt.patch')) {
                                archiveArtifacts artifacts: 'fmt.patch', fingerprint: true
                                bat "del fmt.patch"
                                error("Rust formatting changes required")
                            }
                        }
                    }
                }

                stage("Lint Rust (Clippy)") {
                    agent { label 'windows' }
                    steps {
                        checkout scm
                        dir("src-tauri") {
                            bat "cargo clippy --fix --allow-dirty --lib -p spectrelauncher -- "
                        }
                        bat """
                            git diff --quiet
                            if %errorlevel% neq 0 (
                                git diff > clippy.patch
                                echo Patch created, apply the patch from the artifacts section to fix
                            ) else (
                                echo No changes required
                            )
                        """
                        script {
                            if (fileExists('clippy.patch')) {
                                archiveArtifacts artifacts: 'clippy.patch', fingerprint: true
                                bat "del clippy.patch"
                                error("Clippy linter changes required")
                            }
                        }
                    }
                }

                stage("Lint Rust (Check)"){
                    agent { label 'windows' }
                    steps {
                        checkout scm
                        dir("src-tauri"){
                            bat "cargo fix --allow-dirty --lib -p spectrelauncher"
                        }
                        bat """
                            git diff --quiet
                            if %errorlevel% neq 0 (
                                git diff > check.patch
                                echo Patch created, apply the patch from the artifacts section to fix
                            ) else (
                                echo No changes required
                            )
                        """
                        script {
                            if (fileExists('check.patch')) {
                                archiveArtifacts artifacts: 'check.patch', fingerprint: true
                                bat "del check.patch"
                                error("Check linter changes required")
                            }
                        }
                    }
                }

                stage("JS Lint (ESLint)") {
                    agent { label 'windows' }
                    steps {
                        checkout scm
                        bat "npm ci"
                        bat "npm run lint"
                    }
                }

                stage("Windows Build") {
                    agent { label 'windows && x64' }
                    steps {
                        checkout scm
                        bat "npm i"
                        bat """
                            call \"C:\\BuildTools\\VC\\Auxiliary\\Build\\vcvarsall.bat\" x64
                            npm run tauri build
                        """
                        archiveArtifacts artifacts: 'src-tauri/target/release/bundle/**', fingerprint: true
                    }
                }
            }
        }
    }

    post {
        always {
            node('linux') {
                step([
                    $class: 'GitHubCommitStatusSetter',
                    contextSource: [$class: 'ManuallyEnteredCommitContextSource', context: 'jenkins/build-status'],
                    reposSource: [$class: 'ManuallyEnteredRepositorySource', url: 'https://github.com/SpectreRevival/spectrelauncher']
                ])
            }
        }
    }
}