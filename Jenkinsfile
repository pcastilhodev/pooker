pipeline {
    agent any

    environment {
        SONAR_TOKEN = credentials('sonar-token')
    }

    stages {
        stage('Build Java') {
            parallel {
                stage('Build API Gateway') {
                    steps {
                        dir('backend/api-gateway') {
                            sh './gradlew build -x test'
                        }
                    }
                }
                stage('Build Auth Service') {
                    steps {
                        dir('backend/auth-service') {
                            sh './mvnw package -DskipTests'
                        }
                    }
                }
            }
        }

        stage('Test Java') {
            parallel {
                stage('Test API Gateway') {
                    steps {
                        dir('backend/api-gateway') {
                            sh './gradlew test jacocoTestReport jacocoTestCoverageVerification'
                        }
                    }
                    post {
                        always {
                            junit 'backend/api-gateway/build/test-results/**/*.xml'
                        }
                    }
                }
                stage('Test Auth Service') {
                    steps {
                        dir('backend/auth-service') {
                            sh './mvnw test jacoco:report jacoco:check'
                        }
                    }
                    post {
                        always {
                            junit 'backend/auth-service/target/surefire-reports/**/*.xml'
                        }
                    }
                }
            }
        }

        stage('Build & Test Python') {
            parallel {
                stage('alugueis-service') {
                    steps {
                        dir('backend/alugueis-service') {
                            sh '''
                                pip install -r requirements.txt
                                pip install pytest pytest-cov flake8
                                flake8 app/ --count --select=E,F --show-source --statistics
                                pytest --junitxml=report.xml --cov=app --cov-report=xml:coverage.xml --cov-fail-under=70
                            '''
                        }
                    }
                    post {
                        always {
                            junit 'backend/alugueis-service/report.xml'
                        }
                    }
                }
                stage('filmes-service') {
                    steps {
                        dir('backend/filmes-service') {
                            sh '''
                                pip install -r requirements.txt
                                pip install pytest pytest-cov flake8
                                flake8 app/ --count --select=E,F --show-source --statistics
                                pytest --junitxml=report.xml --cov=app --cov-report=xml:coverage.xml --cov-fail-under=70
                            '''
                        }
                    }
                    post {
                        always {
                            junit 'backend/filmes-service/report.xml'
                        }
                    }
                }
                stage('user-service') {
                    steps {
                        dir('backend/user-service') {
                            sh '''
                                pip install -r requirements.txt
                                pip install pytest pytest-cov flake8
                                flake8 app/ --count --select=E,F --show-source --statistics
                                pytest --junitxml=report.xml --cov=app --cov-report=xml:coverage.xml --cov-fail-under=70
                            '''
                        }
                    }
                    post {
                        always {
                            junit 'backend/user-service/report.xml'
                        }
                    }
                }
                stage('payment-service') {
                    steps {
                        dir('backend/payment-service') {
                            sh '''
                                if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
                                pip install pytest pytest-cov flake8
                                flake8 app/ --count --select=E,F --show-source --statistics
                                pytest --junitxml=report.xml --cov=app --cov-report=xml:coverage.xml --cov-fail-under=70
                            '''
                        }
                    }
                    post {
                        always {
                            junit 'backend/payment-service/report.xml'
                        }
                    }
                }
            }
        }

        stage('Build Angular') {
            steps {
                dir('frontend') {
                    sh 'npm ci && npm run lint && npm run build -- --configuration production'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner \
                          -Dsonar.projectKey=pooker \
                          -Dsonar.projectName="Pooker" \
                          -Dsonar.sources=. \
                          -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/__pycache__/**,**/alembic/**,**/build/**,**/target/**
                    '''
                }
            }
        }

        stage('Docker Build') {
            parallel {
                stage('Docker: API Gateway') {
                    steps {
                        sh 'docker build -t pooker/api-gateway:${GIT_COMMIT} backend/api-gateway/'
                    }
                }
                stage('Docker: Auth Service') {
                    steps {
                        sh 'docker build -t pooker/auth-service:${GIT_COMMIT} backend/auth-service/'
                    }
                }
                stage('Docker: alugueis-service') {
                    steps {
                        sh 'docker build -t pooker/alugueis-service:${GIT_COMMIT} backend/alugueis-service/'
                    }
                }
                stage('Docker: filmes-service') {
                    steps {
                        sh 'docker build -t pooker/filmes-service:${GIT_COMMIT} backend/filmes-service/'
                    }
                }
                stage('Docker: user-service') {
                    steps {
                        sh 'docker build -t pooker/user-service:${GIT_COMMIT} backend/user-service/'
                    }
                }
                stage('Docker: payment-service') {
                    steps {
                        sh 'docker build -t pooker/payment-service:${GIT_COMMIT} backend/payment-service/'
                    }
                }
                stage('Docker: Frontend') {
                    steps {
                        sh 'docker build -t pooker/frontend:${GIT_COMMIT} frontend/'
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check the logs above.'
        }
    }
}
