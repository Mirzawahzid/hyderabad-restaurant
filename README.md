# HyderabadiRestaurant — Kubernetes Deployment Guide

## Project Overview

A full-stack restaurant ordering application featuring:
- **Backend**: .NET 8 Web API (`MenuController`, Swagger UI)
- **Frontend**: React SPA with cart + checkout
- **Infrastructure**: Kubernetes on Minikube

---

## Architecture

```
                        [ Browser ]
                             |
                     [ Ingress (nginx) ]
                    /                   \
          /api/* , /swagger/*          /  (all other)
                  |                        |
      [ restaurant-api-service ]   [ restaurant-ui-service ]
                  |                        |
     [ API Deployment x2 pods ]   [ UI Deployment x2 pods ]
      (.NET 8, port 80)            (React/serve, port 3000)
                  |                        |
           [ ConfigMap ]            [ ConfigMap ]
           [ Secrets   ]
```

All resources live in the `hydrabadi-restaurant` namespace.

---

## Prerequisites

| Tool        | Version    |
|-------------|------------|
| Docker      | 20+        |
| Minikube    | 1.30+      |
| kubectl     | 1.27+      |
| Node.js     | 18+        |
| .NET SDK    | 8.0        |

---

## Step 1 — Start Minikube

```bash
minikube start --driver=docker
minikube addons enable ingress
```

---

## Step 2 — Build Docker Images inside Minikube

Point your Docker CLI to Minikube's Docker daemon so images are available in-cluster:

```bash
# Windows PowerShell
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Build API image
cd HyderabadiRestaurant\Api
docker build -t hydrabadi-restaurant-api:latest .

# Build UI image
cd ..\..\ui
docker build -t hydrabadi-restaurant-ui:latest .
```

---

## Step 3 — Apply Kubernetes Manifests

From the repo root, apply all manifests in order:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
kubectl apply -f k8s/ui-deployment.yaml
kubectl apply -f k8s/ui-service.yaml
kubectl apply -f k8s/ingress.yaml
```

Or apply the entire directory at once:

```bash
kubectl apply -f k8s/
```

---

## Step 4 — Configure Local DNS

Get the Minikube IP:

```bash
minikube ip
# Example output: 192.168.49.2
```

Add the following line to your hosts file:

- **Windows**: `C:\Windows\System32\drivers\etc\hosts`
- **Linux/Mac**: `/etc/hosts`

```
192.168.49.2   hydrabadi-restaurant.local
```

---

## Step 5 — Verify Deployment

```bash
# Check all pods are Running
kubectl get pods -n hydrabadi-restaurant

# Check services
kubectl get services -n hydrabadi-restaurant

# Check ingress
kubectl get ingress -n hydrabadi-restaurant
```

Expected output:
```
NAME                         READY   STATUS    RESTARTS   AGE
restaurant-api-xxxxx-yyyyy   1/1     Running   0          2m
restaurant-api-xxxxx-zzzzz   1/1     Running   0          2m
restaurant-ui-xxxxx-yyyyy    1/1     Running   0          2m
restaurant-ui-xxxxx-zzzzz    1/1     Running   0          2m
```

---

## Step 6 — Access the Application

| URL                                          | Description          |
|----------------------------------------------|----------------------|
| http://hydrabadi-restaurant.local            | React frontend       |
| http://hydrabadi-restaurant.local/api/Menu   | REST API endpoint    |
| http://hydrabadi-restaurant.local/swagger    | Swagger UI           |

---

## Useful kubectl Commands

```bash
# View logs for API pods
kubectl logs -l app=restaurant-api -n hydrabadi-restaurant

# View logs for UI pods
kubectl logs -l app=restaurant-ui -n hydrabadi-restaurant

# Describe a pod for debugging
kubectl describe pod <pod-name> -n hydrabadi-restaurant

# Scale replicas
kubectl scale deployment restaurant-api --replicas=3 -n hydrabadi-restaurant

# Delete all resources
kubectl delete namespace hydrabadi-restaurant
```

---

## Project Structure

```
HyderabadiRestaurant/
├── HyderabadiRestaurant/
│   └── Api/                    # .NET 8 Web API
│       ├── Controllers/
│       │   └── MenuController.cs
│       ├── Program.cs
│       └── Dockerfile
├── ui/                         # React frontend
│   ├── src/
│   │   └── App.js
│   └── Dockerfile
├── k8s/                        # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── api-deployment.yaml
│   ├── api-service.yaml
│   ├── ui-deployment.yaml
│   ├── ui-service.yaml
│   └── ingress.yaml
├── README.md
├── design.md
├── debug-drills.md
└── user-manual.md
```
