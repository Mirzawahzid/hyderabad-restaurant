# HyderabadiRestaurant — System Design

## 1. High-Level Architecture

The application follows a **3-tier architecture** deployed on Kubernetes:

```
Tier 1 (Presentation)   →   React SPA
Tier 2 (Application)    →   .NET 8 REST API
Tier 3 (Config/Secret)  →   ConfigMap + Secrets (no external DB; menu data is in-memory)
```

---

## 2. Component Breakdown

### 2.1 Frontend — React SPA

| Property      | Value                          |
|---------------|--------------------------------|
| Framework     | React 18                       |
| Runtime       | Node 18 + `serve` static server|
| Container port| 3000                           |
| Docker image  | `hydrabadi-restaurant-ui:latest`|

**Responsibilities:**
- Fetches menu items from the API on mount (`useEffect`)
- Manages cart state (add, increase, decrease, remove)
- Renders checkout form and places order

---

### 2.2 Backend — .NET 8 Web API

| Property      | Value                              |
|---------------|------------------------------------|
| Framework     | ASP.NET Core 8                     |
| Container port| 80                                 |
| Docker image  | `hydrabadi-restaurant-api:latest`  |

**Endpoints:**

| Method | Path        | Description             |
|--------|-------------|-------------------------|
| GET    | /api/Menu   | Returns menu item list  |
| *      | /swagger    | Interactive API docs    |

**CORS:** Configured with `AllowAll` policy to permit the React frontend to call the API.

---

### 2.3 ConfigMap — `restaurant-config`

Stores non-sensitive environment configuration injected into containers at runtime:

| Key                    | Purpose                                |
|------------------------|----------------------------------------|
| `ASPNETCORE_ENVIRONMENT` | Sets .NET runtime mode to `Production`|
| `ASPNETCORE_URLS`      | Binds API to port 80 inside container  |
| `API_BASE_URL`         | Full in-cluster DNS URL for the API    |
| `CORS_ORIGIN`          | Allowed origin for CORS                |

---

### 2.4 Secrets — `restaurant-secrets`

Stores sensitive values as base64-encoded opaque data:

| Key          | Purpose                          |
|--------------|----------------------------------|
| `APP_SECRET` | Application signing secret       |
| `API_KEY`    | Internal API authentication key  |

> Secrets are **never** stored in plaintext in source code or ConfigMaps.

---

## 3. Kubernetes Object Model

```
Namespace: hydrabadi-restaurant
│
├── ConfigMap: restaurant-config
├── Secret:    restaurant-secrets
│
├── Deployment: restaurant-api       (2 replicas)
│     └── Pod → container: restaurant-api (port 80)
│           ├── envFrom: configmap + secret
│           ├── livenessProbe:  GET /api/Menu
│           └── readinessProbe: GET /api/Menu
│
├── Service: restaurant-api-service  (ClusterIP, port 80)
│
├── Deployment: restaurant-ui        (2 replicas)
│     └── Pod → container: restaurant-ui (port 3000)
│           ├── env: REACT_APP_API_URL from configmap
│           ├── livenessProbe:  GET /
│           └── readinessProbe: GET /
│
├── Service: restaurant-ui-service   (ClusterIP, port 80 → 3000)
│
└── Ingress: restaurant-ingress (nginx)
      ├── /api/*     → restaurant-api-service:80
      ├── /swagger/* → restaurant-api-service:80
      └── /          → restaurant-ui-service:80
```

---

## 4. Networking Flow

```
User Request
    │
    ▼
[ Ingress Controller (nginx) ]
    │  Host: hydrabadi-restaurant.local
    │
    ├─ path /api/*     ──► ClusterIP: restaurant-api-service:80
    │                              │
    │                       Pod 1 (API) ─┐
    │                       Pod 2 (API) ─┘  (round-robin load balance)
    │
    └─ path /          ──► ClusterIP: restaurant-ui-service:80
                                   │
                            Pod 1 (UI) ─┐
                            Pod 2 (UI) ─┘  (round-robin load balance)
```

---

## 5. Scaling Design

Both deployments are configured with `replicas: 2`:

- Ensures **high availability** — if one pod crashes, the other continues serving traffic
- Kubernetes **Service** load-balances traffic across healthy pods (kube-proxy)
- **Readiness probes** prevent traffic from reaching a pod until it is ready
- **Liveness probes** automatically restart pods that become unhealthy

To scale further:
```bash
kubectl scale deployment restaurant-api --replicas=4 -n hydrabadi-restaurant
kubectl scale deployment restaurant-ui  --replicas=4 -n hydrabadi-restaurant
```

---

## 6. Health Probes

### API Probes

| Probe      | Endpoint   | Initial Delay | Period |
|------------|------------|---------------|--------|
| Liveness   | GET /api/Menu | 15s        | 20s    |
| Readiness  | GET /api/Menu | 10s        | 10s    |

### UI Probes

| Probe      | Endpoint | Initial Delay | Period |
|------------|----------|---------------|--------|
| Liveness   | GET /    | 20s           | 30s    |
| Readiness  | GET /    | 15s           | 10s    |

---

## 7. Resource Limits

| Component | CPU Request | CPU Limit | Mem Request | Mem Limit |
|-----------|-------------|-----------|-------------|-----------|
| API       | 250m        | 500m      | 128Mi       | 256Mi     |
| UI        | 100m        | 250m      | 64Mi        | 128Mi     |

Resource limits prevent any single pod from starving the node and ensure fair scheduling.

---

## 8. Security Considerations

- Secrets are stored as Kubernetes `Secret` objects (base64-encoded, not plaintext)
- CORS is restricted to the known ingress origin in production
- Services use `ClusterIP` — no direct external exposure of pods
- All external traffic is routed exclusively through the Ingress controller
- `imagePullPolicy: IfNotPresent` prevents accidental image substitution in dev

---

## 9. Technology Stack Summary

| Layer          | Technology          |
|----------------|---------------------|
| Frontend       | React 18, CSS       |
| Backend        | ASP.NET Core 8      |
| Containerization | Docker            |
| Orchestration  | Kubernetes (Minikube)|
| Ingress        | NGINX Ingress Controller |
| Config/Secrets | Kubernetes ConfigMap + Secret |
