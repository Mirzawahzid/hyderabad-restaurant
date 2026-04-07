# HyderabadiRestaurant — Debug Drills

Two realistic Kubernetes failure scenarios with step-by-step diagnosis and fixes.

---

## Scenario 1 — API Pods Stuck in `CrashLoopBackOff`

### Symptom

After running `kubectl apply -f k8s/`, you notice the API pods are restarting repeatedly:

```bash
kubectl get pods -n hydrabadi-restaurant
```

```
NAME                              READY   STATUS             RESTARTS   AGE
restaurant-api-7d9f8b-xkp2q      0/1     CrashLoopBackOff   5          3m
restaurant-api-7d9f8b-mnr7t      0/1     CrashLoopBackOff   4          3m
restaurant-ui-6c4fb9-vq8rl       1/1     Running            0          3m
restaurant-ui-6c4fb9-tz2kw       1/1     Running            0          3m
```

### Root Cause Investigation

**Step 1 — Read the pod logs:**

```bash
kubectl logs restaurant-api-7d9f8b-xkp2q -n hydrabadi-restaurant
```

Example error output:
```
Unhandled exception. System.IO.FileNotFoundException: Could not load file or assembly 'Api.dll'.
```
or
```
Error: Failed to bind to address http://+:80: permission denied
```

**Step 2 — Describe the pod for Events section:**

```bash
kubectl describe pod restaurant-api-7d9f8b-xkp2q -n hydrabadi-restaurant
```

Look at the `Events:` section at the bottom for messages like:
```
Back-off restarting failed container
```

**Step 3 — Check if the image exists in Minikube:**

```bash
minikube ssh
docker images | grep hydrabadi-restaurant-api
```

If the image is missing, the container cannot start.

### Fix

**Fix A — Missing Docker image (most common cause):**

```bash
# Re-point Docker to Minikube's daemon
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Rebuild the API image
cd HyderabadiRestaurant\Api
docker build -t hydrabadi-restaurant-api:latest .

# Restart the deployment to pull the new image
kubectl rollout restart deployment/restaurant-api -n hydrabadi-restaurant
```

**Fix B — Wrong DLL name in Dockerfile:**

Open `HyderabadiRestaurant/Api/Dockerfile` and verify the entrypoint:
```dockerfile
ENTRYPOINT ["dotnet", "Api.dll"]
```
The DLL name must match the project's `AssemblyName`. Run `dotnet publish` locally and check the `/out` folder.

**Fix C — Port 80 permission denied (Linux containers):**

Add the following to `api-deployment.yaml` under `securityContext`:

```yaml
securityContext:
  runAsNonRoot: false
```
Or change `ASPNETCORE_URLS` in the ConfigMap to use a non-privileged port:
```yaml
ASPNETCORE_URLS: "http://+:8080"
```
And update `containerPort` and service `targetPort` to `8080`.

**Verify the fix:**

```bash
kubectl get pods -n hydrabadi-restaurant -w
# Wait until READY shows 1/1 and RESTARTS stops increasing
```

---

## Scenario 2 — React UI Shows Blank Page / "Failed to fetch" Menu Items

### Symptom

The app loads at `http://hydrabadi-restaurant.local` but the menu is empty or the browser console shows:

```
GET http://localhost:5042/api/Menu net::ERR_CONNECTION_REFUSED
```

or
```
Access to fetch at 'http://...' from origin '...' has been blocked by CORS policy
```

### Root Cause Investigation

**Step 1 — Verify pods and services are running:**

```bash
kubectl get pods,services -n hydrabadi-restaurant
```

All pods must show `1/1 Running`. If the API service is missing, the UI cannot reach the backend.

**Step 2 — Test API connectivity from inside the cluster:**

```bash
# Open a shell in the UI pod
kubectl exec -it <restaurant-ui-pod-name> -n hydrabadi-restaurant -- sh

# Inside the pod, curl the API via its in-cluster DNS
curl http://restaurant-api-service.hydrabadi-restaurant.svc.cluster.local/api/Menu
```

If `curl` fails, the API Service or Deployment has a problem.

**Step 3 — Test the Ingress path routing:**

```bash
# From your local machine
curl -H "Host: hydrabadi-restaurant.local" http://$(minikube ip)/api/Menu
```

If this returns data but the browser still shows nothing, the issue is in the React code using the hardcoded `localhost` URL instead of the ingress URL.

**Step 4 — Check ingress controller logs:**

```bash
kubectl logs -n ingress-nginx \
  $(kubectl get pods -n ingress-nginx -o name | head -1) \
  | tail -30
```

### Fix

**Fix A — React app has hardcoded `localhost` URL (root cause in this project):**

The file `ui/src/App.js` contains:
```js
fetch("http://localhost:5042/api/Menu")
```

For production/Kubernetes, update it to use a relative URL so the ingress routes the request correctly:

```js
const API_URL = process.env.REACT_APP_API_URL || "/api/Menu";

useEffect(() => {
  fetch(API_URL)
    .then((res) => res.json())
    .then((data) => setMenu(data))
    .catch((err) => console.error(err));
}, []);
```

Then rebuild and redeploy the UI image:

```bash
cd ui
docker build -t hydrabadi-restaurant-ui:latest .
kubectl rollout restart deployment/restaurant-ui -n hydrabadi-restaurant
```

**Fix B — Ingress not enabling the addon:**

```bash
minikube addons enable ingress

# Wait for ingress controller pod to be Ready
kubectl get pods -n ingress-nginx -w
```

**Fix C — Hosts file not updated:**

Confirm the hosts file entry is correct:

```bash
# Windows PowerShell (run as Administrator)
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" `
  -Value "$(minikube ip)   hydrabadi-restaurant.local"
```

Then flush DNS:

```bash
ipconfig /flushdns
```

**Verify the fix:**

Open `http://hydrabadi-restaurant.local` in a private/incognito browser window and confirm menu items load.

---

## Quick Reference — Common Debug Commands

```bash
# See all resources in the namespace
kubectl get all -n hydrabadi-restaurant

# Stream logs in real time
kubectl logs -f -l app=restaurant-api -n hydrabadi-restaurant

# Check events (useful for ImagePullBackOff, OOMKilled, etc.)
kubectl get events -n hydrabadi-restaurant --sort-by='.lastTimestamp'

# Force-delete a stuck pod (Kubernetes will recreate it)
kubectl delete pod <pod-name> -n hydrabadi-restaurant

# Rollback a failed deployment
kubectl rollout undo deployment/restaurant-api -n hydrabadi-restaurant
```
