import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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
   VARIÁVEIS
   ========================================================= */

let products = [];


/* =========================================================
   ELEMENTOS
   ========================================================= */

const productsTable = document.getElementById("stock-products");

const totalProducts = document.getElementById("total-products");
const productsInStock = document.getElementById("products-in-stock");
const productsLowStock = document.getElementById("products-low-stock");
const productsOutStock = document.getElementById("products-out-stock");


/* =========================================================
   CARREGAR PRODUTOS
   ========================================================= */

async function loadStock() {

    try {

        productsTable.innerHTML = `
            <tr>
                <td colspan="6" class="stock-loading">
                    Carregando estoque...
                </td>
            </tr>
        `;


        const productsQuery = query(
            collection(db, "products"),
            where("active", "==", true)
        );


        const snapshot = await getDocs(productsQuery);


        products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));


        console.log("Produtos carregados:", products);


        updateSummary();

        renderProducts();


    } catch (error) {

        console.error("Erro ao carregar estoque:", error);

        productsTable.innerHTML = `
            <tr>
                <td colspan="6" class="stock-empty">
                    Erro ao carregar estoque.
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   RESUMO
   ========================================================= */

function updateSummary() {

    const total = products.length;

    let inStock = 0;
    let lowStock = 0;
    let outStock = 0;


    products.forEach(product => {

        const totalStock = getProductStock(product);


        if (totalStock <= 0) {

            outStock++;

        } else if (totalStock <= 3) {

            lowStock++;

        } else {

            inStock++;

        }

    });


    totalProducts.textContent = total;
    productsInStock.textContent = inStock;
    productsLowStock.textContent = lowStock;
    productsOutStock.textContent = outStock;
}


/* =========================================================
   CALCULAR ESTOQUE DO PRODUTO
   ========================================================= */

function getProductStock(product) {

    if (!Array.isArray(product.sizes)) {
        return 0;
    }


    return product.sizes.reduce(
        (total, size) => {

            return total + Number(size.stock || 0);

        },
        0
    );
}


/* =========================================================
   RENDERIZAR PRODUTOS
   ========================================================= */

function renderProducts(list = products) {

    if (!list.length) {

        productsTable.innerHTML = `
            <tr>
                <td colspan="6" class="stock-empty">
                    Nenhum produto encontrado.
                </td>
            </tr>
        `;

        return;
    }


    productsTable.innerHTML = list.map(product => {
        const stock = getProductStock(product);


        let statusClass = "";
        let statusText = "";
        let quantityClass = "";


        if (stock <= 0) {

            statusClass = "out-stock";
            statusText = "Sem estoque";
            quantityClass = "empty";

        } else if (stock <= 3) {

            statusClass = "low-stock";
            statusText = "Estoque baixo";
            quantityClass = "low";

        } else {

            statusClass = "in-stock";
            statusText = "Em estoque";
        }


        const image =
            product.image ||
            product.images?.[0]?.url ||
            "";


        return `
            <tr>

                <td>

                    <div class="stock-product">

                        <div class="stock-product-image">

                            ${
                                image
                                    ? `<img src="${image}" alt="${product.name || ""}">`
                                    : ""
                            }

                        </div>


                        <div class="stock-product-info">

                            <strong>
                                ${product.name || "Produto sem nome"}
                            </strong>

                            <small>
                                ${product.brand || ""}
                            </small>

                        </div>

                    </div>

                </td>


                <td>

                    <span class="stock-sku">
                        ${product.sku || "-"}
                    </span>

                </td>


                <td>

                    <span class="stock-category">
                        ${product.menu?.category || "-"}
                    </span>

                </td>


                <td>

                    <span class="stock-quantity ${quantityClass}">
                        ${stock}
                    </span>

                </td>


                <td>

                    <span class="stock-status ${statusClass}">
                        ${statusText}
                    </span>

                </td>


                <td>

                    <button
                        type="button"
                        class="stock-edit-button"
                        data-product-id="${product.id}"
                    >
                        Editar
                    </button>

                </td>

            </tr>
        `;

    }).join("");
}


/* =========================================================
   INICIAR
   ========================================================= */

/* =========================================================
   EDITAR ESTOQUE
   ========================================================= */

const stockModal = document.getElementById("stock-modal");
const stockModalBody = document.getElementById("stock-modal-body");
const stockModalTitle = document.getElementById("stock-modal-title");
const stockModalSubtitle = document.getElementById("stock-modal-subtitle");
const stockModalClose = document.getElementById("stock-modal-close");
const stockModalCancel = document.getElementById("stock-modal-cancel");


function openStockModal(productId) {
stockModal.dataset.productId = productId;
    const product = products.find(
        product => product.id === productId
    );

    if (!product) {
        return;
    }


    stockModalTitle.textContent =
        `Estoque — ${product.name || "Produto"}`;

    stockModalSubtitle.textContent =
        "Gerencie a quantidade disponível por tamanho.";


    const sizes = Array.isArray(product.sizes)
        ? product.sizes
        : [];


    if (!sizes.length) {

        stockModalBody.innerHTML = `
            <div class="stock-empty">
                Este produto não possui tamanhos cadastrados.
            </div>
        `;

    } else {

        stockModalBody.innerHTML = sizes.map((size, index) => {

            return `
                <div class="stock-size-row">

                    <div class="stock-size-info">

                        <span class="stock-size-label">
                            Tamanho ${size.size || "-"}
                        </span>

                        <span class="stock-size-stock">
                            Estoque atual: ${Number(size.stock || 0)}
                        </span>

                    </div>


                    <input
                        type="number"
                        min="0"
                        class="stock-size-input"
                        data-size-index="${index}"
                        value="${Number(size.stock || 0)}"
                    >

                </div>
            `;

        }).join("");
    }


    stockModal.classList.add("open");
    document.body.classList.add("modal-open");
}


/* =========================================================
   FECHAR MODAL
   ========================================================= */

function closeStockModal() {

    stockModal.classList.remove("open");
    document.body.classList.remove("modal-open");
}


stockModalClose.addEventListener(
    "click",
    closeStockModal
);


stockModalCancel.addEventListener(
    "click",
    closeStockModal
);


document
    .querySelector(".stock-modal-overlay")
    .addEventListener(
        "click",
        closeStockModal
    );


/* =========================================================
   BOTÕES EDITAR
   ========================================================= */

productsTable.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".stock-edit-button"
            );


        if (!button) {
            return;
        }


        const productId =
            button.dataset.productId;


        openStockModal(productId);
    }
);
/* =========================================================
   SALVAR ESTOQUE
   ========================================================= */

const stockModalSave = document.getElementById("stock-modal-save");

stockModalSave.addEventListener(
    "click",
    async () => {

        const productId =
            stockModal.dataset.productId;

        if (!productId) {
            alert("Produto não identificado.");
            return;
        }

        const product = products.find(
            product => product.id === productId
        );

        if (!product) {
            alert("Produto não encontrado.");
            return;
        }

        const inputs =
            stockModalBody.querySelectorAll(
                ".stock-size-input"
            );

        const updatedSizes =
            Array.isArray(product.sizes)
                ? product.sizes.map(size => ({
                    ...size
                }))
                : [];


        inputs.forEach(input => {

            const index =
                Number(input.dataset.sizeIndex);

            let quantity =
                Number(input.value);

            if (!Number.isFinite(quantity) || quantity < 0) {
                quantity = 0;
            }

            updatedSizes[index].stock = quantity;
        });


        try {

            stockModalSave.disabled = true;
            stockModalSave.textContent = "Salvando...";


            await updateDoc(
                doc(db, "products", productId),
                {
                    sizes: updatedSizes,
                    updatedAt: serverTimestamp()
                }
            );


            alert("Estoque atualizado com sucesso!");


            closeStockModal();

            await loadStock();


        } catch (error) {

            console.error(
                "Erro ao salvar estoque:",
                error
            );

            alert(
                "Não foi possível salvar o estoque."
            );

        } finally {

            stockModalSave.disabled = false;
            stockModalSave.textContent = "Salvar estoque";
        }

    }
);
onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadStock();

});
/* =========================================================
   PESQUISA DE ESTOQUE
   ========================================================= */

const stockSearch = document.getElementById("stock-search");

stockSearch.addEventListener(
    "input",
    () => {

        const search =
            stockSearch.value
                .trim()
                .toLowerCase();

        const filteredProducts =
            products.filter(product => {

                const name =
                    String(product.name || "")
                        .toLowerCase();

                const brand =
                    String(product.brand || "")
                        .toLowerCase();

                const sku =
                    String(product.sku || "")
                        .toLowerCase();

                return (
                    name.includes(search) ||
                    brand.includes(search) ||
                    sku.includes(search)
                );
            });

renderProducts(filteredProducts);
    }
);