# HyderabadiRestaurant — User Manual

## About the App

HyderabadiRestaurant is an online food ordering application featuring authentic Hyderabadi cuisine. You can browse the menu, add items to your cart, and place an order — all from your browser.

---

## Accessing the Application

Once the Kubernetes deployment is running (see README.md), open your browser and navigate to:

```
http://hydrabadi-restaurant.local
```

> **Note:** If you are running locally without Kubernetes, the React app runs on `http://localhost:3000` and the API runs on `http://localhost:5042`.

---

## Menu Page

When you open the app you will see the full menu displayed as cards.

### Menu Categories

| Category     | Items Available                |
|--------------|-------------------------------|
| Main Course  | Chicken Biryani, Mutton Biryani|
| Special      | Haleem                        |
| Starter      | Chicken 65                    |

### Each Menu Card Shows

- Dish name
- Category tag
- Price (in USD)
- Dish image

---

## Adding Items to Your Cart

1. Find the dish you want on the menu.
2. Click the **Add to Cart** button on its card.
3. The item is added to your cart in the right panel.
4. You can add the same item multiple times — the quantity increases automatically.

---

## Managing Your Cart

Once items are in the cart you can:

| Action            | How to do it                              |
|-------------------|-------------------------------------------|
| Increase quantity | Click the **+** button next to the item   |
| Decrease quantity | Click the **−** button next to the item   |
| Remove item       | Decrease quantity to 0 OR use remove button|
| View total        | Scroll to the bottom of the cart panel    |

The cart updates the total price in real time.

---

## Placing an Order

1. Review your cart items and total amount.
2. Click **Checkout**.
3. Fill in the order form:
   - **Name** — your full name
   - **Address** — your delivery address
4. Click **Place Order**.
5. A confirmation message will appear: **"Order Placed! Thank you!"**

---

## Frequently Asked Questions

**Q: The menu shows nothing / is blank.**
A: The page is still loading the menu from the API. Wait a few seconds and refresh. If it stays blank, check that all Kubernetes pods are running (`kubectl get pods -n hydrabadi-restaurant`).

**Q: I refreshed the page and my cart is empty.**
A: Cart data is stored in React state (in-memory). Refreshing the browser resets the cart. This is by design for this demo application.

**Q: Can I change my order after clicking Place Order?**
A: Not in the current version. Close the confirmation and start a new order.

**Q: The images on the menu cards are broken.**
A: The app uses Unsplash random image URLs. If Unsplash is unreachable from your network, images will not load. This does not affect ordering functionality.

---

## API / Swagger (For Developers)

The REST API and its interactive documentation are available at:

```
http://hydrabadi-restaurant.local/swagger
```

You can test the `GET /api/Menu` endpoint directly from the Swagger UI without the frontend.

---

## Quick Navigation Summary

| URL                                        | Purpose                    |
|--------------------------------------------|----------------------------|
| http://hydrabadi-restaurant.local          | Main application (menu)    |
| http://hydrabadi-restaurant.local/api/Menu | Raw JSON menu data         |
| http://hydrabadi-restaurant.local/swagger  | API documentation          |
