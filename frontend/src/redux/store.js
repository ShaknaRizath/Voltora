import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";

const CART_KEY = "voltora_cart";

// The cart lives in localStorage too, so it survives signing in (which reloads the page),
// refreshing and closing the tab.
const loadCart = () => {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY));
    if (Array.isArray(items)) {
      return { cart: { cartItems: items.filter((i) => i && i._id && i.qty > 0) } };
    }
  } catch {
    /* storage blocked or corrupted: start with an empty cart */
  }
  return undefined;
};

const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
  preloadedState: loadCart(),
});

let lastItems = store.getState().cart.cartItems;
store.subscribe(() => {
  const items = store.getState().cart.cartItems;
  if (items === lastItems) return;
  lastItems = items;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
});

export default store;
