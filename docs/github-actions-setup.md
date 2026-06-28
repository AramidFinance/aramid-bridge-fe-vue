# GitHub Actions Setup

## Workflows

| Workflow | File | Trigger |
|----------|------|---------|
| CI/CD — Beta | `.github/workflows/ci-beta.yml` | Push to `main` branch |
| Release — Promote Beta to Main | `.github/workflows/release-main.yml` | Manual (`workflow_dispatch`) |

### Beta pipeline (`ci-beta.yml`)

Two jobs run sequentially on every push to `main`:

1. **CI — build** — computes version `1.YYYY.MM.DD-beta`, builds the Docker image, pushes to Docker Hub
2. **CD — deploy** — patches the image tag in `k8s/deployment-beta.yaml`, applies it to Kubernetes, commits the updated manifest

### Release pipeline (`release-main.yml`)

Run manually from **GitHub → Actions → Release - Promote Beta to Main → Run workflow**.

You supply a beta tag (e.g. `1.2026.06.28-beta`). The workflow:
1. Pulls that image from Docker Hub
2. Retags it as `1.2026.06.28-main` and pushes it
3. Patches `k8s/deployment-main.yaml` and deploys to the `aramid-web-main` namespace
4. Commits the updated manifest back to `main`

---

## Required Secrets

Go to **GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret**.

### `DOCKERHUB_USERNAME`

Your Docker Hub username: `scholtz2`

### `DOCKERHUB_TOKEN`

A Docker Hub **access token** (not your account password).

1. Log in to [hub.docker.com](https://hub.docker.com)
2. **Account Settings → Personal access tokens → Generate new token**
3. Name: `aramid-bridge-ci` · Permissions: **Read & Write**
4. Copy the token value and save it as this secret

### `KUBECONFIG`

A base64-encoded kubeconfig with access to both namespaces (`zb-web-beta` and `aramid-web-main`).

#### Option A — minimal kubeconfig via dedicated service account (recommended)

Run the following on your cluster:

```bash
# 1. Create the service account in both namespaces
for NS in zb-web-beta aramid-web-main; do
  kubectl create serviceaccount github-actions -n $NS
  kubectl create rolebinding github-actions-deploy \
    --clusterrole=edit \
    --serviceaccount=$NS:github-actions \
    -n $NS
done

# 2. Create a long-lived token (Kubernetes 1.24+)
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: github-actions-token
  namespace: zb-web-beta
  annotations:
    kubernetes.io/service-account.name: github-actions
type: kubernetes.io/service-account-token
EOF

# 3. Collect cluster info and token
SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
CA=$(kubectl config view --minify --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}')
TOKEN=$(kubectl -n zb-web-beta get secret github-actions-token -o jsonpath='{.data.token}' | base64 -d)

# 4. Build a minimal kubeconfig
cat <<EOF > /tmp/github-actions-kubeconfig.yaml
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: $CA
    server: $SERVER
  name: k8s-cluster
contexts:
- context:
    cluster: k8s-cluster
    namespace: zb-web-beta
    user: github-actions
  name: github-actions-context
current-context: github-actions-context
users:
- name: github-actions
  user:
    token: $TOKEN
EOF

# 5. Base64-encode it — copy this output into the KUBECONFIG secret
cat /tmp/github-actions-kubeconfig.yaml | base64 -w 0
```

#### Option B — use your existing admin kubeconfig (quick, less secure)

```bash
cat ~/.kube/config | base64 -w 0
```

---

## Workflow permissions

The CD and release jobs commit updated manifests back to `main`. Allow that:

1. **Settings → Actions → General → Workflow permissions**
2. Select **Read and write permissions**

---

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `docker push` fails with 401 | `DOCKERHUB_TOKEN` wrong or expired — regenerate it |
| `docker pull` fails in release pipeline | The beta tag doesn't exist yet — check the CI run completed successfully |
| `kubectl` fails with `Unauthorized` | `KUBECONFIG` secret malformed or SA token expired |
| Rollout times out (beta) | Check `kubectl logs -n zb-web-beta -l app=zb-web-beta` |
| Rollout times out (main) | Check `kubectl logs -n aramid-web-main -l app=aramid-web-main` |
