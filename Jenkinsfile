pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 15, unit: 'MINUTES')
    }

    environment {
        COMPOSE_PROJECT_NAME = "daily-tasks-ci-${BUILD_NUMBER}"
        FRONTEND_PORT = '8080'
    }

    stages {
        stage('Validate Compose') {
            steps {
                sh 'docker compose config --quiet'
            }
        }

        stage('Build containers') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Start application') {
            steps {
                sh 'docker compose up --detach --wait --wait-timeout 120'
            }
        }

        stage('Smoke test') {
            steps {
                sh '''
                    curl --fail --silent --show-error http://localhost:${FRONTEND_PORT}/ > /dev/null
                    curl --fail --silent --show-error http://localhost:${FRONTEND_PORT}/api/health
                    docker compose exec --no-TTY api npm run smoke-test
                '''
            }
        }
    }

    post {
        always {
            sh 'docker compose down --volumes --remove-orphans'
        }
    }
}
