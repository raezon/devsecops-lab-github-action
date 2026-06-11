# TechFlow SAS — Dépôt de Démonstration DevSecOps

> ⚠️ **ATTENTION : Ce dépôt est volontairement vulnérable à des fins pédagogiques.**
> Il contient des secrets, des mauvaises pratiques et des configurations non sécurisées.
> **NE JAMAIS déployer en production.**

---

## Contexte pédagogique

Ce dépôt illustre la posture DevOps **avant** la transition DevSecOps de TechFlow SAS.
Il est utilisé dans le cadre du **TP Guidé – Chapitre 1 : Intégration de la sécurité dans les pratiques DevOps**.

## Structure du projet

```
techflow-devsecops-demo/
├── src/
│   ├── app/          # Application Node.js principale
│   ├── auth/         # Module d'authentification
│   └── api/          # Endpoints API REST
├── docker/           # Dockerfiles (volontairement non sécurisés)
├── .gitlab-ci/       # Pipelines CI/CD GitLab
├── .github/          # Workflows GitHub Actions
├── k8s/              # Manifestes Kubernetes
├── scripts/          # Scripts d'administration
└── docs/             # Documentation interne
```

## Vulnérabilités intentionnelles (pour le TP)

| # | Fichier | Vulnérabilité | Phase SDLC |
|---|---------|--------------|------------|
| 1 | `src/app/config.js` | Secrets AWS en clair | Code |
| 2 | `docker/Dockerfile` | Image `ubuntu:latest` non pinée | Build |
| 3 | `.gitlab-ci/pipeline.yml` | Pas de scanner SAST | Build/Test |
| 4 | `src/auth/jwt.js` | Clé JWT hardcodée | Code |
| 5 | `scripts/deploy.sh` | Mot de passe DB en variable d'env | Deploy |
| 6 | `k8s/deployment.yaml` | Container root, pas de securityContext | Deploy |
| 7 | `src/api/users.js` | Injection SQL potentielle | Code |
| 8 | `.env.example` | Vrais credentials copiés depuis .env | Code |

## Exercices suggérés

1. **Partie a** : Identifier toutes les vulnérabilités ci-dessus dans le code
2. **Partie c** : Classifier chaque vulnérabilité par phase SDLC et outil correctif
3. **Partie d** : Proposer les corrections et les intégrer dans une roadmap

## Stack technique (simulée)

- **Backend** : Node.js 18 / Express
- **Base de données** : PostgreSQL 14
- **CI/CD** : GitLab CI/CD
- **Orchestration** : Kubernetes 1.28
- **Registry** : GitLab Container Registry
# devsecops-lab-github-action
