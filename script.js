/* =========================================================
   VELLOR SHOES — SCRIPT GLOBAL
   ========================================================= */


/* =========================================================
   CARRINHO
   ========================================================= */

function getCart() {
    return JSON.parse(
        localStorage.getItem("vellorCart")
    ) || [];
}


/* =========================================================
   ATUALIZAR CONTADOR DO CARRINHO
   ========================================================= */

function updateCartCount() {

    const cart = getCart();

    const total = cart.reduce(
        (sum, item) => {
            return sum + Number(item.quantity || 0);
        },
        0
    );

    document
        .querySelectorAll(".cart-count")
        .forEach(counter => {
            counter.textContent = total;
        });
}


/* =========================================================
   INICIAR
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateCartCount();

    }
);