// utilities/recalculateCart.js
export const recalculateCart = (cart) => {
  let totalQuantity = 0;
  let totalPrice = 0;

  cart.items.forEach(item => {
    totalQuantity += item.quantity;
    totalPrice += item.quantity * item.price;
  });

  cart.totalQuantity = totalQuantity;
  cart.totalPrice = totalPrice;

  return cart;
};
