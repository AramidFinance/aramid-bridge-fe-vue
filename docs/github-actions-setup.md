# GitHub Actions Setup — Beta CI/CD

## Overview

Two workflows handle the beta pipeline:

| Workflow | File | Trigger |
|----------|------|---------|
| CI — Build Beta Docker Image | `.github/workflows/ci-beta.yml` | Push to `beta` branch |
| CD — Deploy Beta to Kubernetes | `.github/workflows/cd-beta.yml` | After CI succeeds |

---

## Required Secrets

Go to **GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret** and add each secret below.

### 1. `DOCKERHUB_USERNAME`

Your Docker Hub username.

```
scholtz2
```

### 2. `DOCKERHUB_TOKEN`

A Docker Hub **access token** (not your password).

Steps to create one:
1. Log in to [hub.docker.com](https://hub.docker.com)
2. Go to **Account Settings → Personal access tokens → Generate new token**
3. Name it `aramid-bridge-ci`, set **Access permissions** to `Read & Write`
4. Copy the token and save it as this secret

### 3. `KUBECONFIG`

A base64-encoded kubeconfig file that grants access to your cluster.

Steps:

1. On your Kubernetes server, locate or generate a kubeconfig for the deployment service account:

   ```bash
   # Option A — copy your existing admin kubeconfig (restrict permissions in production)
   cat ~/.kube/config | base64 -w 0

   # Option B — use a dedicated service account (recommended)
   kubectl -n zb-web-beta get secret <sa-token-secret> -o jsonpath='{.data.token}'
   ```

2. The safest approach is a dedicated service account with minimal permissions. Run this on the cluster:

   ```bash
   # Create service account
   kubectl create serviceaccount github-actions -n zb-web-beta

   # Grant deploy permissions
   kubectl create rolebinding github-actions-deploy \
     --clusterrole=edit \
     --serviceaccount=zb-web-beta:github-actions \
     -n zb-web-beta

   # For Kubernetes 1.24+ create a long-lived token
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

   # Build a minimal kubeconfig
   SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
   CA=$(kubectl config view --minify --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}')
   TOKEN=$(kubectl -n zb-web-beta get secret github-actions-token -o jsonpath='{.data.token}' | base64 -d)

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

   # Encode it for the secret
   cat /tmp/github-actions-kubeconfig.yaml | base64 -w 0
   ```

3. Copy the base64 output and save it as the `KUBECONFIG` secret.

---

## How versioning works

The version is computed at runtime in both workflows using the same formula:

```
1.YYYY.MM.DD-beta
```

For example, a push on June 28 2026 produces: `1.2026.06.28-beta`

The CD workflow also commits the updated `k8s/deployment-beta.yaml` back to the `beta` branch so the manifest in the repo always reflects what is running in the cluster.

---

## Branch permissions

The CD workflow commits back to the `beta` branch using the `GITHUB_TOKEN`. Make sure the workflow has write permission:

1. Go to **Settings → Actions → General → Workflow permissions**
2. Select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests** if needed

---

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `docker push` fails with 401 | `DOCKERHUB_TOKEN` is wrong or expired — regenerate it |
| `kubectl` fails with `Unauthorized` | `KUBECONFIG` secret is malformed or token expired |
| CD workflow never starts | CI workflow name in `cd-beta.yml` must exactly match the `name:` field in `ci-beta.yml` |
| Rollout times out | Pod crash-loopback — check `kubectl logs -n zb-web-beta -l app=zb-web-beta` |
