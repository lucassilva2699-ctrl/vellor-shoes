import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    updateDoc,
    getDoc,
    serverTimestamp,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyDQdaiVEWUeIFQOMXzI9DluqDkl8ZeMS5o",
    authDomain: "vellor-shoes.firebaseapp.com",
    projectId: "vellor-shoes",
    storageBucket: "vellor-shoes.firebasestorage.app",
    messagingSenderId: "455357493198",
    appId: "1:455357493198:web:f36451b846420b4dfde83f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   ELEMENTOS
========================================================= */

const totalOrders = document.getElementById(
    "sales-total-orders"
);

const pendingPayment = document.getElementById(
    "sales-pending-payment"
);

const paidOrders = document.getElementById(
    "sales-paid"
);

const shippedOrders = document.getElementById(
    "sales-shipped"
);

const completedOrders = document.getElementById(
    "sales-completed"
);

const salesSearch = document.getElementById(
    "sales-search"
);

const salesStatusFilter = document.getElementById(
    "sales-status-filter"
);

const salesTable = document.getElementById(
    "sales-orders"
);


/* =========================================================
   DADOS
========================================================= */

let orders = [];


/* =========================================================
   STATUS
========================================================= */

function getStatusLabel(status) {

    const labels = {

        aguardando_pagamento: "Aguardando pagamento",

        pago: "Pagamento confirmado",

        em_preparacao: "Em preparação",

        enviado: "Enviado",

        concluido: "Concluído",

        cancelado: "Cancelado"
    };

    return labels[status] || "Indefinido";
}


/* =========================================================
   DATA
========================================================= */

function formatDate(timestamp) {

    if (!timestamp) {
        return "-";
    }

    let date;

    if (
        timestamp &&
        typeof timestamp.toDate === "function"
    ) {
        date = timestamp.toDate();
    } else {
        date = new Date(timestamp);
    }

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString(
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}


/* =========================================================
   PREÇO
========================================================= */

function formatPrice(value) {

    return Number(value || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


/* =========================================================
   STATUS VISUAL
========================================================= */

function getStatusClass(status) {

    if (status === "aguardando_pagamento") {
        return "pending";
    }

    if (status === "pago") {
        return "paid";
    }

    if (
        status === "enviado" ||
        status === "em_preparacao"
    ) {
        return "shipped";
    }

    if (status === "concluido") {
        return "completed";
    }

    if (status === "cancelado") {
        return "cancelled";
    }

    return "pending";
}


/* =========================================================
   RESUMO
========================================================= */

function updateSummary() {

    totalOrders.textContent =
        orders.length;

    pendingPayment.textContent =
        orders.filter(
            order =>
                order.status ===
                "aguardando_pagamento"
        ).length;

    paidOrders.textContent =
        orders.filter(
            order =>
                order.status === "pago"
        ).length;

    shippedOrders.textContent =
        orders.filter(
            order =>
                order.status === "enviado" ||
                order.status === "em_preparacao"
        ).length;

    completedOrders.textContent =
        orders.filter(
            order =>
                order.status === "concluido"
        ).length;
}


/* =========================================================
   RENDERIZAR PEDIDOS
========================================================= */

function renderOrders(list = orders) {

    if (!list.length) {

        salesTable.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="sales-empty"
                >
                    Nenhum pedido encontrado.
                </td>
            </tr>
        `;

        return;
    }


    salesTable.innerHTML = list.map(order => {

        const customerName =
            order.customer?.name ||
            "Cliente não informado";

        const paymentMethod =
            order.paymentMethod === "pix"
                ? "Pix"
                : order.paymentMethod === "credit-card"
                    ? "Cartão"
                    : order.paymentMethod || "-";

        const statusClass =
            getStatusClass(order.status);

        return `
            <tr>

                <td>
                    <strong>
                        ${order.orderNumber || "-"}
                    </strong>
                </td>

                <td>
                    ${customerName}
                </td>

                <td>
                    ${formatDate(order.createdAt)}
                </td>

                <td>
                    ${formatPrice(order.total)}
                </td>

                <td>
                    ${paymentMethod}
                </td>

                <td>
                    <span class="sales-status ${statusClass}">
                        ${getStatusLabel(order.status)}
                    </span>
                </td>

                <td>
                    <button
                        type="button"
                        class="sales-view-button"
                        data-order-id="${order.id}"
                    >
                        Ver pedido
                    </button>
                </td>

            </tr>
        `;

    }).join("");
}



/* =========================================================
   CARREGAR PEDIDOS
========================================================= */

async function loadOrders() {

    try {

        salesTable.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="sales-empty"
                >
                    Carregando pedidos...
                </td>
            </tr>
        `;


        const snapshot = await getDocs(
            collection(db, "orders")
        );


      orders = snapshot.docs.map(
    document => {

        const data = document.data();

        let status = data.status;

        /*
         * Se o pagamento já foi aprovado,
         * mas o status operacional ainda não existe,
         * consideramos o pedido como pago.
         */
        if (
            !status &&
            data.paymentStatus === "approved"
        ) {
            status = "pago";
        }

        /*
         * Se ainda não existe status e o pagamento
         * está pendente, mantemos como aguardando pagamento.
         */
        if (
            !status &&
            data.paymentStatus === "pending"
        ) {
            status = "aguardando_pagamento";
        }

        return {
            id: document.id,
            ...data,
            status
        };

    }
);


        orders.sort((a, b) => {

            const dateA =
                a.createdAt?.toDate
                    ? a.createdAt.toDate()
                    : new Date(a.createdAt || 0);

            const dateB =
                b.createdAt?.toDate
                    ? b.createdAt.toDate()
                    : new Date(b.createdAt || 0);

            return dateB - dateA;
        });


        updateSummary();
        renderOrders();


    } catch (error) {

        console.error(
            "Erro ao carregar pedidos:",
            error
        );

        salesTable.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="sales-empty"
                >
                    Não foi possível carregar os pedidos.
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   PESQUISA
========================================================= */

salesSearch.addEventListener(
    "input",
    () => {

        const search =
            salesSearch.value
                .trim()
                .toLowerCase();


        const filteredOrders =
            orders.filter(order => {

                const orderNumber =
                    String(
                        order.orderNumber || ""
                    ).toLowerCase();

                const customerName =
                    String(
                        order.customer?.name || ""
                    ).toLowerCase();

                const email =
                    String(
                        order.customer?.email || ""
                    ).toLowerCase();

                return (
                    orderNumber.includes(search) ||
                    customerName.includes(search) ||
                    email.includes(search)
                );
            });


        renderOrders(filteredOrders);
    }
);


/* =========================================================
   FILTRO DE STATUS
========================================================= */

salesStatusFilter.addEventListener(
    "change",
    () => {

        const selectedStatus =
            salesStatusFilter.value;


        let filteredOrders = orders;


        if (selectedStatus) {

            const statusMap = {

                pending:
                    "aguardando_pagamento",

                paid:
                    "pago",

                shipped:
                    "enviado",

                completed:
                    "concluido",

                cancelled:
                    "cancelado"
            };


            const realStatus =
                statusMap[selectedStatus];


            filteredOrders =
                orders.filter(
                    order =>
                        order.status ===
                        realStatus
                );
        }


        renderOrders(filteredOrders);
    }
);

onAuthStateChanged(auth, (user) => {

    if (!user) {
        console.log("Aguardando autenticação...");
        return;
    }

    console.log("Administrador autenticado:", user.email);

    loadOrders();
});
/* =========================================================
   VER PEDIDO — MODAL
========================================================= */

salesTable.addEventListener("click", (event) => {

    const button = event.target.closest(".sales-view-button");

    if (!button) {
        return;
    }

    const orderId = button.dataset.orderId;

    const order = orders.find(
        item => item.id === orderId
    );

    if (!order) {
        alert("Pedido não encontrado.");
        return;
    }

    const customer = order.customer || {};
    const address = order.address || {};
    const shipping = order.shipping || {};

    const cart = Array.isArray(order.cart)
        ? order.cart
        : [];


    const paymentMethod =
        order.paymentMethod === "pix"
            ? "Pix"
            : order.paymentMethod === "credit-card"
                ? "Cartão"
                : order.paymentMethod || "-";


    const productsHTML = cart.length
        ? cart.map(item => {

            const image = item.image
                ? `
                    <img
                        src="${item.image}"
                        alt="${item.name || "Produto"}"
                    >
                  `
                : `
                    <div class="order-product-no-image">
                        V
                    </div>
                  `;


            return `
                <div class="order-product">

                    <div class="order-product-image">
                        ${image}
                    </div>


                    <div class="order-product-info">

                        <strong>
                            ${item.name || "Produto"}
                        </strong>

                        <span>
                            Tamanho:
                            ${item.size || "-"}
                        </span>

                        <span>
                            Quantidade:
                            ${item.quantity || 1}
                        </span>

                    </div>


                    <strong class="order-product-price">

                        ${formatPrice(
                            Number(item.price || 0) *
                            Number(item.quantity || 1)
                        )}

                    </strong>

                </div>
            `;

        }).join("")
        : `
            <p class="order-empty-message">
                Nenhum produto informado.
            </p>
        `;


    const modal = document.createElement("div");

    modal.id = "order-details-modal";


    modal.innerHTML = `

        <div class="order-modal-overlay"></div>


        <div class="order-modal">

            <!-- CABEÇALHO -->

            <div class="order-modal-header">

                <div>

                    <span class="order-modal-label">
                        PEDIDO
                    </span>

                    <h2>
                        ${order.orderNumber || "-"}
                    </h2>

                    <p>
                        ${formatDate(order.createdAt)}
                    </p>

                </div>


                <button
                    type="button"
                    class="order-modal-close"
                    id="order-modal-close"
                >
                    ×
                </button>

            </div>


            <!-- CONTEÚDO -->

            <div class="order-modal-body">


               <!-- STATUS -->

<section class="order-detail-section">

    <div class="order-section-title">
        Status do pedido
    </div>

    <div class="order-status-editor">

        <select
            id="order-status-select"
            class="order-status-select"
        >

            <option
                value="aguardando_pagamento"
                ${order.status === "aguardando_pagamento" ? "selected" : ""}
            >
                Aguardando pagamento
            </option>

            <option
                value="pago"
                ${order.status === "pago" ? "selected" : ""}
            >
                Pago
            </option>

            <option
                value="em_preparacao"
                ${order.status === "em_preparacao" ? "selected" : ""}
            >
                Em preparação
            </option>

            <option
                value="enviado"
                ${order.status === "enviado" ? "selected" : ""}
            >
                Enviado
            </option>

            <option
                value="concluido"
                ${order.status === "concluido" ? "selected" : ""}
            >
                Concluído
            </option>

            <option
                value="cancelado"
                ${order.status === "cancelado" ? "selected" : ""}
            >
                Cancelado
            </option>

        </select>


        <button
            type="button"
            id="save-order-status"
            class="order-status-save"
        >
            Salvar status
        </button>

    </div>

</section>

<!-- CLIENTE -->
<section class="order-detail-section">

    <div class="order-section-title">
        Dados do cliente
    </div>

    <div class="order-address">

        <strong>
            ${customer.name || "Nome não informado"}
        </strong>

        <span>
            E-mail:
            ${customer.email || "-"}
        </span>

        <span>
            Telefone:
            ${customer.phone || "-"}
        </span>

    </div>

</section>

                <!-- ENDEREÇO -->

                <section class="order-detail-section">

                    <div class="order-section-title">
                        Endereço de entrega
                    </div>


                    <div class="order-address">

                        <strong>

                            ${address.address || "-"},
                            ${address.number || "s/n"}

                        </strong>


                        ${
                            address.complement
                                ? `
                                    <span>
                                        ${address.complement}
                                    </span>
                                  `
                                : ""
                        }


                        <span>
                            ${address.neighborhood || "-"}
                        </span>


                        <span>

                            ${address.city || "-"}
                            /
                            ${address.state || "-"}

                        </span>


                        <span>

                            CEP:
                            ${address.cep || "-"}

                        </span>

                    </div>

                </section>


                <!-- PRODUTOS -->

                <section class="order-detail-section">

                    <div class="order-section-title">
                        Produtos
                    </div>


                    <div class="order-products">

                        ${productsHTML}

                    </div>

                </section>

<!-- HISTÓRICO -->

<section class="order-detail-section">

    <div class="order-section-title">
        Histórico do pedido
    </div>

    <div class="order-history">

        ${
            Array.isArray(order.statusHistory) &&
            order.statusHistory.length
                ? [...order.statusHistory]
                    .reverse()
                    .map(history => `
                        <div class="order-history-item">

                            <div class="order-history-dot"></div>

                            <div class="order-history-content">

                                <strong>
                                    ${
    history.status === "aguardando_pagamento"
        ? "Aguardando pagamento"
        : history.status === "pago"
            ? "Pagamento confirmado"
            : history.status === "em_preparacao"
                ? "Pedido em preparação"
                : history.status === "enviado"
                    ? "Pedido enviado"
                    : history.status === "concluido"
                        ? "Pedido concluído"
                        : history.status === "cancelado"
                            ? "Pedido cancelado"
                            : history.status
}
                                </strong>

                                <span>
                                    ${
                                        history.changedAt
                                            ? formatDate(history.changedAt)
                                            : "-"
                                    }
                                </span>

                            </div>

                        </div>
                    `)
                    .join("")
                : `
                    <div class="order-history-empty">
                        Nenhuma alteração de status registrada.
                    </div>
                `
        }

    </div>

</section>

                <!-- RESUMO -->

                <section class="order-detail-section">

                    <div class="order-section-title">
                        Resumo do pedido
                    </div>


                    <div class="order-summary">


                        <div>

                            <span>
                                Subtotal
                            </span>

                            <strong>
                                ${formatPrice(order.subtotal)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                ${shipping.label || "Frete"}
                            </span>

                            <strong>
                                ${formatPrice(shipping.cost)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Pagamento
                            </span>

                            <strong>
                                ${paymentMethod}
                            </strong>

                        </div>


                        <div class="order-summary-total">

                            <span>
                                Total
                            </span>

                            <strong>
                                ${formatPrice(order.total)}
                            </strong>

                        </div>


                    </div>

                </section>


            </div>


            <!-- RODAPÉ -->

            <div class="order-modal-footer">

                <button
                    type="button"
                    class="order-modal-button"
                    id="order-modal-close-footer"
                >
                    Fechar
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(modal);
    const statusSelect =
    document.getElementById(
        "order-status-select"
    );

const saveStatusButton =
    document.getElementById(
        "save-order-status"
    );


saveStatusButton.addEventListener(
    "click",
    async () => {

        const newStatus =
            statusSelect.value;


        if (newStatus === order.status) {

            alert(
                "O pedido já está com esse status."
            );

            return;
        }
        // =========================================================
// PREPARAÇÃO PARA BAIXA DE ESTOQUE
// =========================================================

const shouldDecreaseStock =
    newStatus === "pago" &&
    order.stockReserved !== true;

const shouldRestoreStock =
    newStatus === "cancelado" &&
    order.stockReserved === true;

        saveStatusButton.disabled = true;

        saveStatusButton.textContent =
            "Salvando...";


        try {

// =========================================================
// CONTROLE DE ESTOQUE — VERIFICAÇÃO E BAIXA SEGURA
// =========================================================

if (shouldDecreaseStock) {

    const stockUpdates = [];

    // -----------------------------------------------------
    // 1. VERIFICAR TODOS OS ITENS PRIMEIRO
    // -----------------------------------------------------

    for (const item of order.cart) {

        const productRef = doc(
            db,
            "products",
            item.id
        );

        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            throw new Error(
                `Produto não encontrado: ${item.name}`
            );
        }

        const product = productSnap.data();

        const sizes = Array.isArray(product.sizes)
            ? product.sizes.map(size => ({
                ...size
            }))
            : [];

        const sizeIndex = sizes.findIndex(
            size =>
                String(size.size) ===
                String(item.size)
        );

        if (sizeIndex === -1) {
            throw new Error(
                `Tamanho ${item.size} não encontrado no produto ${item.name}`
            );
        }

        const currentStock = Number(
            sizes[sizeIndex].stock || 0
        );

        const quantity = Number(
            item.quantity || 0
        );

        if (quantity <= 0) {
            throw new Error(
                `Quantidade inválida para ${item.name}`
            );
        }

        if (currentStock < quantity) {
            throw new Error(
                `Estoque insuficiente para ${item.name} — tamanho ${item.size}. Disponível: ${currentStock}`
            );
        }

        // Guarda tudo para alterar somente depois
        // que TODOS os itens forem validados.

        sizes[sizeIndex].stock =
            currentStock - quantity;

        stockUpdates.push({
            productRef,
            sizes
        });
    }


    // -----------------------------------------------------
    // 2. TODOS OS ITENS ESTÃO DISPONÍVEIS
    // AGORA SIM ALTERAMOS O ESTOQUE
    // -----------------------------------------------------

    for (const update of stockUpdates) {

        await updateDoc(
            update.productRef,
            {
                sizes: update.sizes
            }
        );
    }
}
// =========================================================
// DEVOLUÇÃO DE ESTOQUE — PEDIDO CANCELADO
// =========================================================

if (shouldRestoreStock) {

    for (const item of order.cart) {

        const productRef = doc(
            db,
            "products",
            item.id
        );

        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            throw new Error(
                `Produto não encontrado: ${item.name}`
            );
        }

        const product = productSnap.data();

        const sizes = Array.isArray(product.sizes)
            ? product.sizes.map(size => ({
                ...size
            }))
            : [];

        const sizeIndex = sizes.findIndex(
            size =>
                String(size.size) ===
                String(item.size)
        );

        if (sizeIndex === -1) {
            throw new Error(
                `Tamanho ${item.size} não encontrado no produto ${item.name}`
            );
        }

        const currentStock = Number(
            sizes[sizeIndex].stock || 0
        );

        const quantity = Number(
            item.quantity || 0
        );

        if (quantity <= 0) {
            throw new Error(
                `Quantidade inválida para ${item.name}`
            );
        }

        sizes[sizeIndex].stock =
            currentStock + quantity;

        await updateDoc(
            productRef,
            {
                sizes: sizes
            }
        );
    }
}
     await updateDoc(
    doc(
        db,
        "orders",
        order.id
    ),
   {
    status: newStatus,

    stockReserved:
        shouldDecreaseStock
            ? true
            : shouldRestoreStock
                ? false
                : order.stockReserved === true,

    statusUpdatedAt: serverTimestamp(),

    statusHistory: arrayUnion({
        status: newStatus,
        changedAt: new Date().toISOString()
    })
}
);


            /* Atualiza o pedido localmente */

            order.status = newStatus;


            /* Atualiza o resumo */

            updateSummary();


            /* Atualiza a tabela */

            renderOrders();


            saveStatusButton.textContent =
                "Salvo ✓";


            setTimeout(() => {

                modal.remove();

            }, 700);


        } catch (error) {

            console.error(
                "Erro ao atualizar status:",
                error
            );


                      alert(
                "ERRO AO SALVAR STATUS:\n\n" +
                (error?.message || error)
            );

            saveStatusButton.disabled = false;

            saveStatusButton.textContent =
                "Salvar status";

        }

    }
);


    /* FECHAR NO X */

    document
        .getElementById("order-modal-close")
        .addEventListener(
            "click",
            () => modal.remove()
        );


    /* FECHAR NO BOTÃO */

    document
        .getElementById("order-modal-close-footer")
        .addEventListener(
            "click",
            () => modal.remove()
        );


    /* FECHAR CLICANDO FORA */

    document
        .querySelector(
            "#order-details-modal .order-modal-overlay"
        )
        .addEventListener(
            "click",
            () => modal.remove()
        );

});
