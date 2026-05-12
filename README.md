# Naïa — Assistante IA conversationnelle

Questionnaire conversationnel propulsé par Claude AI pour qualifier les prospects avant rendez-vous.

## 🏗️ Architecture

```
Prospect (navigateur)
    ↓ GitHub Pages
index.html (React via CDN)
    ↓ POST /naiaChat
Cloud Function europe-west1 (proxy)
    ↓ avec clé API Anthropic
API Anthropic Claude
```

## 🚀 Déploiement — Étapes à suivre dans l'ordre

### 1. Créer le repo GitHub

1. Aller sur https://github.com/new
2. Nom : `naia`
3. Visibilité : **Public** (obligatoire pour GitHub Pages gratuit)
4. Ne pas initialiser avec README
5. Créer

### 2. Uploader les fichiers

Depuis l'interface web GitHub du repo :
- Glisser-déposer tous les fichiers et dossiers fournis
- Commit message : "Initial setup"

### 3. Créer un compte de service Google Cloud

Sur https://console.cloud.google.com/iam-admin/serviceaccounts?project=ecosysteme-rodolphe :

1. Cliquer **Créer un compte de service**
2. Nom : `naia-deploy`
3. Rôles à attribuer :
   - **Cloud Functions Admin** (`roles/cloudfunctions.admin`)
   - **Cloud Run Admin** (`roles/run.admin`)
   - **Service Account User** (`roles/iam.serviceAccountUser`)
   - **Storage Admin** (`roles/storage.admin`) — pour le bucket de déploiement
   - **Cloud Build Editor** (`roles/cloudbuild.builds.editor`)
   - **Artifact Registry Writer** (`roles/artifactregistry.writer`)
4. Une fois créé, cliquer dessus puis onglet **Clés** → **Ajouter une clé** → **JSON**
5. Le fichier JSON se télécharge automatiquement — **garder ce fichier précieusement**

### 4. Configurer les secrets GitHub

Sur ton repo GitHub : **Settings → Secrets and variables → Actions → New repository secret**

Créer 2 secrets :

| Nom du secret | Valeur |
|---|---|
| `GCP_SA_KEY` | **Tout le contenu** du fichier JSON téléchargé à l'étape 3 |
| `ANTHROPIC_API_KEY` | Ta clé API Anthropic (commence par `sk-ant-...`) |

### 5. Déclencher le premier déploiement

Sur GitHub : **Actions → Déployer la fonction Naïa → Run workflow → main → Run workflow**

Attendre 2-3 minutes. À la fin du log, tu verras l'URL de la fonction (devrait être) :
```
https://europe-west1-ecosysteme-rodolphe.cloudfunctions.net/naiaChat
```

### 6. Activer GitHub Pages

Sur le repo GitHub : **Settings → Pages**

- **Source** : Deploy from a branch
- **Branch** : `main` / `/ (root)`
- Save

Attendre 1-2 minutes. L'URL sera : `https://ridolf974.github.io/naia/`

### 7. Tester

Ouvrir `https://ridolf974.github.io/naia/` dans un navigateur :
- L'écran d'accueil de Naïa doit apparaître
- Lancer la conversation
- Après chaque réponse, Naïa doit générer une réaction **personnalisée** (pas générique)

Si Naïa répond toujours "Bien noté 👌" → la Cloud Function ne répond pas. Vérifier :
- Les logs Cloud Function sur https://console.cloud.google.com/functions
- Que la clé API Anthropic est valide et a des crédits

## 💰 Coûts mensuels estimés

Pour ~50 prospects/mois :

| Service | Coût |
|---|---|
| GitHub Pages | 0 € |
| Cloud Function (free tier) | 0 € |
| API Anthropic (Haiku 4.5) | ~1 € |
| **Total** | **~1 €/mois** |

## 🔧 Modification du questionnaire

Pour ajuster les questions, exemples ou comportement :
- Ouvrir `index.html`
- Modifier les sections `QUESTIONS`, `FOLLOW_UPS`, ou `NAIA_SYSTEM` (dans `functions/index.js`)
- Commit + push → GitHub Actions redéploie automatiquement

## 📁 Structure des fichiers

```
naia/
├── .github/workflows/
│   └── deploy-function.yml    # Déploiement auto sur push
├── functions/
│   ├── index.js                # Code de la Cloud Function
│   ├── package.json            # Dépendances Node.js
│   └── .gitignore
├── index.html                  # Frontend conversationnel
└── README.md                   # Ce fichier
```
