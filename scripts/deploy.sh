
set -e

echo "=== Déploiement TechFlow SAS v2.3.1 ==="
echo "Environnement : PRODUCTION"
echo "Date : $(date)"

# ⚠️ VULN : credentials en clair dans le script (versionné dans Git)
DB_HOST="prod-db.techflow-internal.com"
DB_USER="techflow_admin"
DB_PASSWORD="Sup3rS3cr3tDB!2024"   # ← MOT DE PASSE EN CLAIR

# ⚠️ VULN : clés AWS en clair
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
export AWS_DEFAULT_REGION="eu-west-1"

# ⚠️ VULN : le mot de passe apparaît dans les logs du shell (set -x)
set -x

# Migration de base de données
# ⚠️ VULN : mot de passe visible dans l'historique bash et les logs CI
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -U "$DB_USER" \
    -d "techflow_prod" \
    -f scripts/migrations/latest.sql

# Build et push de l'image Docker
docker build -t registry.gitlab.com/techflow/api:latest -f docker/Dockerfile .
# ⚠️ VULN : pas de scan de l'image avant push
docker push registry.gitlab.com/techflow/api:latest

# Déploiement Kubernetes
# ⚠️ VULN : kubectl avec le kubeconfig admin par défaut
kubectl apply -f k8s/deployment.yaml
kubectl rollout status deployment/techflow-api -n production

# ⚠️ VULN : notification Slack avec le webhook en clair
SLACK_WEBHOOK="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXX"
curl -s -X POST "$SLACK_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"✅ Déploiement réussi — API v2.3.1 en production\"}"

echo "=== Déploiement terminé ==="
