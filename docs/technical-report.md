# Technical Report — HyderabadiRestaurant Kubernetes Deployment

**Project:** HyderabadiRestaurant  
**Author:** Mirza Wahzid  
**Date:** April 6, 2026  
**Stack:** .NET 8 API · React 19 · Kubernetes (Minikube) · Prometheus · Grafana

---

## 1. Project Overview

HyderabadiRestaurant is a full-stack food ordering application deployed on Kubernetes. It allows users to browse a menu of authentic Hyderabadi dishes, add items to a cart, and place an order. The system is containerised with Docker and orchestrated using Kubernetes with full observability via Prometheus and Grafana.

---

## 2. Architecture

```
                        [ Browser ]
                             |
                     [ Ingress (nginx) ]
                    /                   \
          /api/* , /swagger/*          /  (all other paths)
                  |                        |
      [ restaurant-api-service ]   [ restaurant-ui-service ]
                  |                        |
     [ API Deployment x2 pods ]   [ UI Deployment x2 pods ]
      (.NET 8, port 80)            (React/serve, port 3000)
                  |
           [ ConfigMap + Secrets ]
                  |
     [ Prometheus ] ← scrapes metrics
           |
       [ Grafana ] ← visualises dashboards
```

All resources are deployed in the `hydrabadi-restaurant` namespace.

---

## 3. Components

### 3.1 Backend — .NET 8 REST API

| Property | Value |
|---|---|
| Framework | ASP.NET Core 8 |
| Port | 80 (container), 5042 (local dev) |
| Endpoint | `GET /api/Menu` |
| Documentation | Swagger UI at `/` |
| Docker image | `hydrabadi-restaurant-api:latest` |

The API serves a static in-memory menu list of 4 Hyderabadi dishes with name, category, price, and image URL. CORS is enabled for all origins to allow the React frontend to communicate.

### 3.2 Frontend — React SPA

| Property | Value |
|---|---|
| Framework | React 19 |
| Port | 3000 (container + local dev) |
| Docker image | `hydrabadi-restaurant-ui:latest` |
| Served by | `serve` static server |

The UI fetches `/api/Menu` on mount via a relative URL, which is proxied to the API by both the React dev server (via `proxy` in `package.json`) and the Kubernetes Ingress in production.

### 3.3 Kubernetes Resources

| Resource | Kind | Purpose |
|---|---|---|
| `namespace.yaml` | Namespace | Isolates all resources under `hydrabadi-restaurant` |
| `api-deployment.yaml` | Deployment | Runs 2 API pod replicas |
| `ui-deployment.yaml` | Deployment | Runs 2 UI pod replicas |
| `api-service.yaml` | Service (ClusterIP) | Internal load balancer for API pods |
| `ui-service.yaml` | Service (ClusterIP) | Internal load balancer for UI pods |
| `ingress.yaml` | Ingress | Routes external traffic by path |
| `configmap.yaml` | ConfigMap | Environment variables (non-secret) |
| `secrets.yaml` | Secret | Base64-encoded sensitive values |
| `prometheus-*.yaml` | Deployment + Service + RBAC | Metrics collection |
| `grafana-*.yaml` | Deployment + Service + ConfigMap | Metrics visualisation |

### 3.4 ConfigMap values

```yaml
ASPNETCORE_ENVIRONMENT: "Production"
ASPNETCORE_URLS: "http://+:80"
API_BASE_URL: "http://restaurant-api-service.hydrabadi-restaurant.svc.cluster.local/api"
CORS_ORIGIN: "http://hydrabadi-restaurant.local"
APP_NAME: "HyderabadiRestaurant"
```

### 3.5 Secrets

| Key | Decoded Value |
|---|---|
| `APP_SECRET` | `restaurant-secret` |
| `API_KEY` | `hyderabadi-api-key-2026` |

Secrets are injected into the API container via `secretRef` in the deployment spec.

---

## 4. Health Probes

Both deployments implement separate liveness and readiness probes:

| Probe | API path | Initial delay | Period |
|---|---|---|---|
| **Liveness** (API) | `GET /api/Menu` | 15s | 20s |
| **Readiness** (API) | `GET /api/Menu` | 10s | 10s |
| **Liveness** (UI) | `GET /` | 20s | 30s |
| **Readiness** (UI) | `GET /` | 15s | 10s |

- **Liveness probe**: If it fails, Kubernetes restarts the container
- **Readiness probe**: If it fails, Kubernetes removes the pod from the service's endpoint list (stops routing traffic to it) without restarting it

---

## 5. Scaling

Both deployments run `replicas: 2`, ensuring high availability. If one pod crashes, the other continues serving traffic. Kubernetes automatically reschedules the failed pod.

---

## 6. Ingress Routing

| Path pattern | Backend service | Port |
|---|---|---|
| `/api/.*` | `restaurant-api-service` | 80 |
| `/swagger/.*` | `restaurant-api-service` | 80 |
| `/grafana` | `grafana-service` | 80 |
| `/` (all other) | `restaurant-ui-service` | 80 |

Regex matching is enabled via the `nginx.ingress.kubernetes.io/use-regex: "true"` annotation.

---

## 7. Observability — Grafana Dashboard

The Grafana dashboard (`grafana-dashboard-configmap.yaml`) contains 7 tiles:

| # | Title | Type | Metric |
|---|---|---|---|
| 1 | Running Containers | Stat | `container_last_seen` count |
| 2 | Total CPU Usage % | Gauge | `container_cpu_usage_seconds_total` rate |
| 3 | Total Memory Usage MB | Gauge | `container_memory_working_set_bytes` |
| 4 | CPU Usage per Pod | Timeseries | CPU rate per pod |
| 5 | Memory Usage per Pod | Timeseries | Memory per pod |
| 6 | Network Received (bytes/s) | Timeseries | `container_network_receive_bytes_total` |
| 7 | Network Transmitted (bytes/s) | Timeseries | `container_network_transmit_bytes_total` |

Prometheus scrapes the Kubernetes cAdvisor metrics endpoint and Grafana reads from Prometheus as its datasource.

---

## 8. Debug Drills

### Bug 1 — Wrong API URL (localhost hardcoded)

**Broken state:** `App.js` was changed to `fetch("http://localhost:9999/api/Menu")` — URL points to a non-existent port.

**Symptom:** Menu was empty. Browser console showed `ERR_CONNECTION_REFUSED`.

**Fix:** Changed back to relative URL `fetch("/api/Menu")` so the request is correctly proxied through the dev server / Kubernetes Ingress.

**Evidence:** `docs/debug1.png`, `docs/bug 1 fixed.png`

---

### Bug 2 — Wrong Secret Value

**Broken state:** `secrets.yaml` `APP_SECRET` was set to `d3JvbmctcGFzc3dvcmQ=` (base64 of `wrong-password`).

**Symptom:** API would receive the wrong secret value via environment variable injection. In a real app with secret validation, this would cause authentication failures.

**Fix:** Corrected the value back to `cmVzdGF1cmFudC1zZWNyZXQ=` (base64 of `restaurant-secret`) and re-applied the secret with `kubectl apply -f k8s/secrets.yaml`.

**Evidence:** `docs/bug2 broken.png`, `docs/bug 2 fixed.png`

---

## 9. Local Development

```bash
# Start API
cd HyderabadiRestaurant/Api
dotnet run
# Available at http://localhost:5042, Swagger at http://localhost:5042

# Start React UI
cd ui
npm install
npm start
# Available at http://localhost:3000
```

## 10. Kubernetes Deployment

```bash
minikube start --driver=docker
minikube addons enable ingress
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
docker build -t hydrabadi-restaurant-api:latest ./HyderabadiRestaurant/Api
docker build -t hydrabadi-restaurant-ui:latest ./ui
kubectl apply -f k8s/
minikube tunnel   # run in separate elevated terminal
# App at http://hydrabadi-restaurant.local
```
