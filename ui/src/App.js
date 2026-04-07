import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
  });

  // Fetch menu
  useEffect(() => {
    fetch("/api/Menu")
      .then((res) => res.json())
      .then((data) => setMenu(data))
      .catch((err) => console.error(err));
  }, []);

  // Add to cart
  const addToCart = (item) => {
    const existing = cart.find((c) => c.id === item.id);

    if (existing) {
      setCart(
        cart.map((c) =>
          c.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  // Increase quantity
  const increaseQty = (id) => {
    setCart(
      cart.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Decrease quantity
  const decreaseQty = (id) => {
    setCart(
      cart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Total
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Place order
  const handleOrder = () => {
    if (!form.name || !form.address) {
      alert("Please fill all details");
      return;
    }

    setOrderPlaced(true);
    setCart([]);
  };

  // Success screen
  if (orderPlaced) {
    return (
      <div className="container">
        <h1>🎉 Order Placed Successfully!</h1>
        <p>Thank you, {form.name}!</p>
      </div>
    );
  }

  return (
    <div>
      <h1><img src="/images/charminar.jpg" alt="Hyderabadi Restaurant Logo" style={{height: "50px", verticalAlign: "middle", marginRight: "12px", borderRadius: "8px"}} />Hyderabadi Restaurant</h1>

      <div className="container">
        {!showCheckout && (
          <>
            <h2>Menu</h2>

            <div className="menu-grid">
              {menu.map((item) => (
                <div className="card" key={item.id}>
                  <img src={item.imageUrl} alt={item.name} />

                  <div className="card-content">
                    <h3>{item.name}</h3>
                    <p>{item.category}</p>
                    <p>${item.price}</p>

                    <button onClick={() => addToCart(item)}>
                      Add to Cart 🛒
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* CART */}
            <div className="cart">
              <h2>🛒 Cart</h2>

              {cart.length === 0 && <p>No items in cart</p>}

              {cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <span>{item.name}</span>

                  <div className="qty-controls">
                    <button onClick={() => decreaseQty(item.id)}>-</button>
                    {item.quantity}
                    <button onClick={() => increaseQty(item.id)}>+</button>
                  </div>
                </div>
              ))}

              <div className="total">Total: ${total}</div>

              {cart.length > 0 && (
                <button
                  className="checkout"
                  onClick={() => setShowCheckout(true)}
                >
                  Go to Checkout →
                </button>
              )}
            </div>
          </>
        )}

        {/* CHECKOUT */}
        {showCheckout && (
          <div className="cart">
            <h2>🧾 Checkout</h2>

            {cart.map((item) => (
              <p key={item.id}>
                {item.name} x {item.quantity}
              </p>
            ))}

            <h3>Total: ${total}</h3>

            <input
              type="text"
              placeholder="Your Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Address"
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
            />

            <button className="checkout" onClick={handleOrder}>
              Place Order ✅
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;