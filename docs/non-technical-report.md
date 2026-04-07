# Non-Technical Report — HyderabadiRestaurant

**Project:** HyderabadiRestaurant Online Ordering App  
**Author:** Mirza Wahzid  
**Date:** April 6, 2026

---

## What Is This Project?

HyderabadiRestaurant is an online food ordering web application for a Hyderabadi cuisine restaurant. Customers can open the app in any web browser, browse the full menu with photos of each dish, add items to their cart, and place an order — all without needing to download anything.

---

## What Problem Does It Solve?

Traditionally, customers had to call the restaurant or walk in to place an order. This app lets them:

- Browse the menu from anywhere, at any time
- See photos and prices of every dish
- Add multiple items to a cart and adjust quantities
- Place an order with their name and delivery address in under a minute

---

## What Does the App Look Like?

When a customer opens the app they see:

1. **The menu** — a list of dishes (Chicken Biryani, Mutton Biryani, Haleem, Chicken 65) with photos and prices
2. **Add to cart buttons** — click once to add a dish, click again to add more
3. **A cart** — shows everything selected, the total cost, and lets the customer increase or decrease quantities
4. **A checkout form** — enter name and delivery address, then place the order

---

## Menu

| Dish | Category | Price |
|---|---|---|
| Chicken Biryani | Main Course | $12 |
| Mutton Biryani | Main Course | $15 |
| Haleem | Special | $10 |
| Chicken 65 | Starter | $8 |

---

## How Is It Hosted?

The app is hosted on a system called **Kubernetes** — a modern, industry-standard platform used by companies like Google, Amazon, and Netflix to run applications reliably in the cloud.

Here is what that means in plain language:

- **Always available**: The app runs as two copies at the same time. If one copy has a problem, the other keeps serving customers without any interruption.
- **Automatically recovers**: If the app crashes, Kubernetes detects it and restarts it automatically — no manual action needed.
- **Monitored 24/7**: A monitoring dashboard (Grafana) tracks how the app is performing in real time — including memory usage, CPU, and network traffic.
- **Secure**: Sensitive information (like API keys) is stored in encrypted secrets, not in plain text.

---

## Monitoring Dashboard

The app includes a live dashboard that shows:

- How many parts of the app are currently running
- How much computer power (CPU) is being used
- How much memory is being used
- How much network traffic is coming in and going out

This helps the technical team spot and fix any issues before customers are affected.

---

## Reliability Features

| Feature | What It Means |
|---|---|
| 2 copies of the app | If one fails, the other takes over instantly |
| Health checks | The system automatically checks every 10–20 seconds that the app is working |
| Auto-restart | If a check fails, the app restarts itself |
| Encrypted secrets | Passwords and API keys are never stored as plain text |

---

## Testing and Known Issues Fixed

During development, two problems were intentionally introduced and then fixed as part of quality testing:

**Problem 1 — Wrong website address in code**  
The app was briefly configured to look for the menu at a wrong address. The menu disappeared. This was caught immediately by checking the browser's error console. The fix was changing the address back to the correct one.

**Problem 2 — Wrong password in configuration**  
A wrong password value was put into the app's secure configuration file. In a real restaurant system connected to a database, this would stop the app from logging in. The fix was correcting the password and redeploying the configuration.

Both issues were documented with before-and-after screenshots as part of the project's quality assurance process.

---

## How to Access the App

| Environment | Address |
|---|---|
| Kubernetes (production) | http://hydrabadi-restaurant.local |
| Local development | http://localhost:3000 |
| API documentation | http://localhost:5042 |

---

## Technology Summary (Plain Language)

| Technology | What It Does |
|---|---|
| React | Powers the visual interface customers see in the browser |
| .NET 8 API | The behind-the-scenes engine that provides menu data |
| Docker | Packages the app so it runs the same everywhere |
| Kubernetes | Runs and manages the app reliably in the cloud |
| Prometheus | Collects performance data from the app |
| Grafana | Shows performance data as easy-to-read charts |

---

## Summary

HyderabadiRestaurant is a complete, production-ready online ordering application. It is fast, reliable, automatically monitored, and built using the same standards used by large technology companies. The project demonstrates how a small restaurant can offer a professional digital ordering experience to its customers.
