import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/* =========================================================
   FIREBASE
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyDQdaiVEWUeIFQOMXzI9DluqDkl8ZeMS5o",
    authDomain: "vellor-shoes.firebaseapp.com",
    projectId: "vellor-shoes",
    storageBucket: "vellor-shoes.firebasestorage.app",
    messagingSenderId: "455357473198",
    appId: "1:455357473198:web:f36451b846420b4dfde83f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   VARIÁVEIS
   ========================================================= */

let products = [];
let storeMenuItems = [];
let selectedProductImages = [];
let productModalCreated = false;
let editingProductId = null;


/* =========================================================
   ELEMENTOS
   ========================================================= */

const $ = (id) => document.getElementById(id);

const tableBody = $("products-table-body");
const emptyState = $("products-empty");
const feedback = $("products-feedback");
const loadingLabel = $("products-loading-label");

const searchInput = $("product-search");
const statusFilter = $("product-status-filter");

const totalElement = $("products-total");
const activeElement = $("products-active");
const lowStockElement = $("products-low-stock");

const newProductButton = $("new-product-button");
const logoutButton = $("admin-logout-button");


/* =========================================================
   AUTENTICAÇÃO
   ========================================================= */

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    loadProducts();

});


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Erro ao sair:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   UTILITÁRIOS
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


function getStock(product) {

    if (Array.isArray(product.sizes)) {

        return product.sizes.reduce(
            (total, item) => {

                return total +
                    Number(item.stock || 0);

            },
            0
        );

    }

    return Number(
        product.stock || 0
    );

}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   PRODUTOS
   ========================================================= */

async function loadProducts() {

    if (loadingLabel) {

        loadingLabel.textContent =
            "Carregando...";

    }

    try {

        const productsQuery = query(
            collection(
                db,
                "products"
            ),
            where(
                "active",
                "==",
                true
            )
        );

        const snapshot =
            await getDocs(
                productsQuery
            );


        products =
            snapshot.docs.map(
                (doc) => ({

                    id: doc.id,

                    ...doc.data()

                })
            );


        renderProducts();


        if (loadingLabel) {

            loadingLabel.textContent =
                `${products.length} produto${
                    products.length === 1
                        ? ""
                        : "s"
                }`;

        }


    } catch (error) {

        console.error(
            "Erro ao carregar produtos:",
            error
        );


        if (loadingLabel) {

            loadingLabel.textContent =
                "Erro ao carregar";

        }


        if (feedback) {

            feedback.hidden = false;

            feedback.textContent =
                "Não foi possível carregar os produtos.";

        }

    }

}


/* =========================================================
   FILTROS
   ========================================================= */

function getFilteredProducts() {

    const search =
        searchInput?.value
            .trim()
            .toLowerCase() || "";


    const status =
        statusFilter?.value ||
        "all";


    return products.filter(
        (product) => {

            const name =
                String(
                    product.name || ""
                ).toLowerCase();


            const brand =
                String(
                    product.brand || ""
                ).toLowerCase();


            const sku =
                String(
                    product.sku || ""
                ).toLowerCase();


            const matchesSearch =
                !search ||
                name.includes(search) ||
                brand.includes(search) ||
                sku.includes(search);


            const active =
                product.active === true;


            const matchesStatus =
                status === "all" ||
                (
                    status === "active" &&
                    active
                ) ||
                (
                    status === "inactive" &&
                    !active
                );


            return (
                matchesSearch &&
                matchesStatus
            );

        }
    );

}


/* =========================================================
   RENDERIZAR PRODUTOS
   ========================================================= */

function renderProducts() {

    if (!tableBody) {
        return;
    }


    const filtered =
        getFilteredProducts();


    tableBody.innerHTML =
        "";


    if (totalElement) {

        totalElement.textContent =
            filtered.length;

    }


    if (activeElement) {

        activeElement.textContent =
            products.filter(
                (product) =>
                    product.active === true
            ).length;

    }


    if (lowStockElement) {

        lowStockElement.textContent =
            products.filter(
                (product) => {

                    const stock =
                        getStock(product);

                    return (
                        stock > 0 &&
                        stock <= 3
                    );

                }
            ).length;

    }


    if (!filtered.length) {

        if (emptyState) {

            emptyState.hidden =
                false;

        }

        return;

    }


    if (emptyState) {

        emptyState.hidden =
            true;

    }


    filtered.forEach(
        (product) => {

            const row =
                document.createElement(
                    "tr"
                );


            const stock =
                getStock(product);


            const active =
                product.active === true;


            const price =
                product.promotion &&
                Number(
                    product.promotionalPrice
                ) > 0

                    ? Number(
                        product.promotionalPrice
                    )

                    : Number(
                        product.price || 0
                    );


            row.innerHTML = `

                <td>

                    <div class="product-table-name">

                        <div class="product-table-image">

                            ${
                                product.image

                                    ? `
                                        <img
                                            src="${escapeHtml(
                                                product.image
                                            )}"
                                            alt=""
                                        >
                                      `

                                    : "◈"
                            }

                        </div>


                        <div>

                            <strong>
                                ${escapeHtml(
                                    product.name ||
                                    "Sem nome"
                                )}
                            </strong>

                            <small>
                                ${escapeHtml(
                                    product.category ||
                                    "Sem categoria"
                                )}
                            </small>

                        </div>

                    </div>

                </td>


                <td>

                    <span class="product-table-brand">
                        ${escapeHtml(
                            product.brand ||
                            "—"
                        )}
                    </span>

                </td>


                <td>

                    <span class="product-table-sku">
                        ${escapeHtml(
                            product.sku ||
                            "—"
                        )}
                    </span>

                </td>


                <td>

                    <strong class="product-table-price">
                        ${formatPrice(price)}
                    </strong>

                </td>


                <td>

                    <span class="product-stock ${
                        stock <= 3
                            ? "low"
                            : ""
                    }">

                        ${stock}

                    </span>

                </td>


                <td>

                    <span class="product-status ${
                        active
                            ? "active"
                            : "inactive"
                    }">

                        ${
                            active
                                ? "Ativo"
                                : "Inativo"
                        }

                    </span>

                </td>


                <td>

                   <button
    type="button"
    class="product-more-button"
    title="Editar produto"
    data-product-id="${product.id}"
>
    ✏️
</button>

                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );

}


if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderProducts
    );

}


if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        renderProducts
    );

}


/* =========================================================
   MENU DA LOJA
   ========================================================= */

async function loadStoreMenu() {

    try {

        const menuQuery =
            query(
                collection(
                    db,
                    "store_menu"
                ),
                where(
                    "active",
                    "==",
                    true
                )
            );


        const snapshot =
            await getDocs(
                menuQuery
            );


        storeMenuItems =
            snapshot.docs.map(
                (doc) => ({

                    id: doc.id,

                    ...doc.data()

                })
            );


        populateGenderSelect();


    } catch (error) {

        console.error(
            "Erro ao carregar Menu da Loja:",
            error
        );


        showMenuError();

    }

}


function getChildren(parentId) {

    return storeMenuItems.filter(
        (item) => {

            return String(
                item.parentId || ""
            ) === String(
                parentId || ""
            );

        }
    );

}


function getRootItems() {

    return storeMenuItems.filter(
        (item) => {

            return (
                item.parentId == null ||
                item.parentId === ""
            );

        }
    );

}


function findMenuItem(id) {

    return (
        storeMenuItems.find(
            (item) =>
                item.id === id
        ) || null
    );

}


function sortItems(items) {

    return [...items].sort(
        (a, b) => {

            return String(
                a.name || ""
            ).localeCompare(
                String(
                    b.name || ""
                ),
                "pt-BR"
            );

        }
    );

}


/* =========================================================
   GÊNERO
   ========================================================= */

function populateGenderSelect() {

    const select =
        $("product-gender");


    if (!select) {
        return;
    }


    select.innerHTML =
        `
            <option value="">
                Selecionar gênero
            </option>
        `;


    sortItems(
        getRootItems()
    ).forEach(
        (item) => {

            select.insertAdjacentHTML(
                "beforeend",
                `
                    <option
                        value="${escapeHtml(
                            item.id
                        )}"
                    >
                        ${escapeHtml(
                            item.name
                        )}
                    </option>
                `
            );

        }
    );


    select.onchange =
        () => {

            populateCategorySelect(
                select.value
            );


            clearSubcategorySelect();

            clearLeafSelect();

            clearAutomaticBrand();

        };

}


/* =========================================================
   CATEGORIA
   ========================================================= */

function populateCategorySelect(
    genderId
) {

    const select =
        $("product-category");


    if (!select) {
        return;
    }


    select.innerHTML =
        `
            <option value="">
                Selecionar categoria
            </option>
        `;


    if (!genderId) {
        return;
    }


    sortItems(
        getChildren(
            genderId
        )
    ).forEach(
        (item) => {

            select.insertAdjacentHTML(
                "beforeend",
                `
                    <option
                        value="${escapeHtml(
                            item.id
                        )}"
                    >
                        ${escapeHtml(
                            item.name
                        )}
                    </option>
                `
            );

        }
    );


    select.onchange =
        () => {

            populateSubcategorySelect(
                select.value
            );


            clearLeafSelect();

            clearAutomaticBrand();

        };

}


/* =========================================================
   SUBCATEGORIA
   ========================================================= */

function populateSubcategorySelect(
    categoryId
) {

    const select =
        $("product-subcategory");


    if (!select) {
        return;
    }


    select.innerHTML =
        `
            <option value="">
                Selecionar subcategoria
            </option>
        `;


    if (!categoryId) {
        return;
    }


    sortItems(
        getChildren(
            categoryId
        )
    ).forEach(
        (item) => {

            select.insertAdjacentHTML(
                "beforeend",
                `
                    <option
                        value="${escapeHtml(
                            item.id
                        )}"
                    >
                        ${escapeHtml(
                            item.name
                        )}
                    </option>
                `
            );

        }
    );


    select.onchange =
        () => {

            populateLeafSelect(
                select.value
            );


            clearAutomaticBrand();

        };

}


/* =========================================================
   NÍVEL FINAL / MARCA
   ========================================================= */

function populateLeafSelect(
    subcategoryId
) {

    const select =
        $("product-leaf");


    if (!select) {
        return;
    }


    select.innerHTML =
        `
            <option value="">
                Selecionar marca
            </option>
        `;


    if (!subcategoryId) {
        return;
    }


    sortItems(
        getChildren(
            subcategoryId
        )
    ).forEach(
        (item) => {

            select.insertAdjacentHTML(
                "beforeend",
                `
                    <option
                        value="${escapeHtml(
                            item.id
                        )}"
                    >
                        ${escapeHtml(
                            item.name
                        )}
                    </option>
                `
            );

        }
    );


    select.onchange =
        () => {

            const item =
                findMenuItem(
                    select.value
                );


            const brand =
                $("product-brand");


            if (brand) {

                brand.value =
                    item?.name || "";


                brand.readOnly =
                    true;


                brand.dataset.autoFilled =
                    "true";

            }

        };

}


function clearSubcategorySelect() {

    const element =
        $("product-subcategory");


    if (element) {

        element.innerHTML =
            `
                <option value="">
                    Primeiro selecione a categoria
                </option>
            `;

    }

}


function clearLeafSelect() {

    const element =
        $("product-leaf");


    if (element) {

        element.innerHTML =
            `
                <option value="">
                    Primeiro selecione a subcategoria
                </option>
            `;

    }

}


function clearAutomaticBrand() {

    const brand =
        $("product-brand");


    if (!brand) {
        return;
    }


    brand.value =
        "";


    brand.readOnly =
        true;


    brand.placeholder =
        "Selecione a marca no menu acima";


    brand.dataset.autoFilled =
        "false";

}


function showMenuError() {

    [
        "product-gender",
        "product-category",
        "product-subcategory",
        "product-leaf"
    ].forEach(
        (id) => {

            const element =
                $(id);


            if (element) {

                element.innerHTML =
                    `
                        <option value="">
                            Erro ao carregar Menu da Loja
                        </option>
                    `;

            }

        }
    );

}


/* =========================================================
   ESTILOS DO MODAL
   ========================================================= */

function injectProductStyles() {

    if (
        $("vellor-product-modal-style")
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "vellor-product-modal-style";


    style.textContent = `

        #product-modal {
            position: fixed !important;
            inset: 0 !important;
            z-index: 999999 !important;
            display: none !important;
        }

        #product-modal.open {
            display: block !important;
        }

        #product-modal-overlay {
            position: fixed !important;
            inset: 0 !important;
            background: rgba(0,0,0,.76) !important;
            z-index: 0 !important;
        }

        #product-modal .product-modal-content {
            position: relative !important;
            z-index: 1 !important;
            max-height: 96vh !important;
            overflow-y: auto !important;
        }

        body.modal-open {
            overflow: hidden !important;
        }

        .product-promo-control {
            display: flex;
            align-items: center;
            gap: 14px;
            cursor: pointer;
            min-height: 48px;
        }

        .product-promo-switch {
            position: relative;
            width: 52px;
            height: 30px;
            display: inline-block;
            flex: none;
        }

        .product-promo-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .product-promo-track {
            position: absolute;
            inset: 0;
            border-radius: 30px;
            background: #292d35;
            border: 1px solid #3a404a;
            transition: .2s;
        }

        .product-promo-track:after {
            content: "";
            position: absolute;
            width: 22px;
            height: 22px;
            left: 3px;
            top: 3px;
            background: #fff;
            border-radius: 50%;
            transition: .2s;
        }

        .product-promo-switch input:checked
        + .product-promo-track {
            background: #007bff;
            border-color: #007bff;
        }

        .product-promo-switch input:checked
        + .product-promo-track:after {
            transform: translateX(22px);
        }

        .product-promo-copy strong,
        .product-promo-copy small {
            display: block;
        }

        .product-promo-copy small {
            opacity: .65;
            margin-top: 3px;
        }

        .product-photo-upload {
            display: block;
            border: 1px dashed #3b424d;
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            background: #15181d;
            cursor: pointer;
        }

        .product-photo-upload:hover {
            border-color: #007bff;
        }

        .product-photo-upload input {
            display: none;
        }

        .product-photo-upload strong,
        .product-photo-upload span {
            display: block;
        }

        .product-photo-upload span {
            opacity: .65;
            font-size: 13px;
            margin-top: 5px;
        }

        .product-photo-grid {
            display: grid;
            grid-template-columns:
                repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-top: 16px;
        }

        .product-photo-card {
            position: relative;
            min-height: 150px;
            border: 1px solid #2b313a;
            border-radius: 14px;
            overflow: hidden;
            background: #101216;
        }

        .product-photo-card.is-main {
            border: 2px solid #007bff;
        }

        .product-photo-card img {
            width: 100%;
            height: 150px;
            object-fit: cover;
            display: block;
        }

        .product-photo-main {
            position: absolute;
            left: 9px;
            top: 9px;
            background: #007bff;
            color: #fff;
            border-radius: 999px;
            padding: 5px 9px;
            font-size: 11px;
            font-weight: 700;
        }

        .product-photo-remove {
            position: absolute;
            right: 8px;
            top: 8px;
            width: 28px;
            height: 28px;
            border: 0;
            border-radius: 50%;
            background: rgba(0,0,0,.72);
            color: #fff;
            cursor: pointer;
            font-size: 17px;
        }

        .product-photo-select-main {
            position: absolute;
            left: 8px;
            right: 8px;
            bottom: 8px;
            border: 0;
            border-radius: 8px;
            padding: 7px;
            background: rgba(0,0,0,.75);
            color: #fff;
            cursor: pointer;
            font-size: 11px;
        }

        @media(max-width:800px) {

            .product-photo-grid {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   MODAL
   ========================================================= */

function createProductModal() {

    if (productModalCreated) {

        loadStoreMenu();

        return;

    }


    injectProductStyles();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "product-modal";


    modal.className =
        "product-modal";


    modal.innerHTML = `

        <div
            class="product-modal-overlay"
            id="product-modal-overlay"
        ></div>


        <div class="product-modal-content">

            <div class="product-modal-header">

                <div>

                    <span class="admin-panel-label">
                        CATÁLOGO
                    </span>

                    <h2>
                        Novo produto
                    </h2>

                    <p>
                        Cadastre um novo produto na Vellor Shoes.
                    </p>

                </div>


                <button
                    type="button"
                    class="product-modal-close"
                    id="product-modal-close"
                >
                    ×
                </button>

            </div>


            <form
                id="new-product-form"
                class="product-form"
            >


                <!-- 01 -->

                <div class="product-form-section">

                    <div class="product-form-section-title">

                        <span>01</span>

                        <div>

                            <h3>
                                Informações do produto
                            </h3>

                            <p>
                                Dados principais do produto.
                            </p>

                        </div>

                    </div>


                    <div class="product-form-grid">

                        <div class="product-form-field full">

                            <label for="product-name">
                                Nome do produto
                            </label>

                            <input
                                type="text"
                                id="product-name"
                                placeholder="Ex.: Nike Air Force 1"
                                required
                            >

                        </div>


                        <div class="product-form-field">

                            <label for="product-brand">
                                Marca
                            </label>

                            <input
                                type="text"
                                id="product-brand"
                                placeholder="Selecione a marca no menu acima"
                                readonly
                                required
                            >

                        </div>


                        <div class="product-form-field">

                            <label for="product-sku">
                                SKU
                            </label>

                            <input
                                type="text"
                                id="product-sku"
                                placeholder="Ex.: NIKE-AF1-001"
                                required
                            >

                        </div>


                        <div class="product-form-field full">

                            <label for="product-description">
                                Descrição
                            </label>

                            <textarea
                                id="product-description"
                                rows="5"
                                placeholder="Descreva o produto..."
                            ></textarea>

                        </div>

                    </div>

                </div>


                <!-- 02 -->

                <div class="product-form-section">

                    <div class="product-form-section-title">

                        <span>02</span>

                        <div>

                            <h3>
                                Classificação
                            </h3>

                            <p>
                                Defina onde o produto ficará no Menu da Loja.
                            </p>

                        </div>

                    </div>


                    <div class="product-form-grid">

                        <div class="product-form-field">

                            <label for="product-gender">
                                Gênero
                            </label>

                            <select
                                id="product-gender"
                                required
                            >

                                <option value="">
                                    Carregando gêneros...
                                </option>

                            </select>

                        </div>


                        <div class="product-form-field">

                            <label for="product-category">
                                Categoria
                            </label>

                            <select
                                id="product-category"
                                required
                            >

                                <option value="">
                                    Primeiro selecione o gênero
                                </option>

                            </select>

                        </div>


                        <div class="product-form-field">

                            <label for="product-subcategory">
                                Subcategoria
                            </label>

                            <select
                                id="product-subcategory"
                                required
                            >

                                <option value="">
                                    Primeiro selecione a categoria
                                </option>

                            </select>

                        </div>


                        <div class="product-form-field">

                            <label for="product-leaf">
                                Marca / nível final
                            </label>

                            <select
                                id="product-leaf"
                                required
                            >

                                <option value="">
                                    Primeiro selecione a subcategoria
                                </option>

                            </select>

                        </div>

                    </div>

                </div>


                <!-- 03 -->

                <div class="product-form-section">

                    <div class="product-form-section-title">

                        <span>03</span>

                        <div>

                            <h3>
                                Preços
                            </h3>

                            <p>
                                Defina o preço de venda do produto.
                            </p>

                        </div>

                    </div>


                    <div class="product-form-grid">

                        <div class="product-form-field">

                            <label for="product-price">
                                Preço normal
                            </label>

                            <div class="product-input-money">

                                <span>R$</span>

                                <input
                                    type="number"
                                    id="product-price"
                                    placeholder="0,00"
                                    min="0"
                                    step="0.01"
                                    required
                                >

                            </div>

                        </div>


                        <div class="product-form-field">

                            <label>
                                Promoção
                            </label>


                            <label
                                class="product-promo-control"
                            >

                                <span
                                    class="product-promo-switch"
                                >

                                    <input
                                        type="checkbox"
                                        id="product-promotion"
                                    >

                                    <span
                                        class="product-promo-track"
                                    ></span>

                                </span>


                                <span
                                    class="product-promo-copy"
                                >

                                    <strong>
                                        Produto em promoção
                                    </strong>

                                    <small>
                                        Ative para exibir um preço promocional.
                                    </small>

                                </span>

                            </label>

                        </div>


                        <div
                            class="product-form-field"
                            id="promotional-price-field"
                            style="display:none"
                        >

                            <label for="product-promotional-price">
                                Preço promocional
                            </label>


                            <div
                                class="product-input-money"
                            >

                                <span>R$</span>

                                <input
                                    type="number"
                                    id="product-promotional-price"
                                    placeholder="0,00"
                                    min="0"
                                    step="0.01"
                                >

                            </div>

                        </div>

                    </div>

                </div>


                <!-- 04 -->

                <div class="product-form-section">

                    <div class="product-form-section-title">

                        <span>04</span>

                        <div>

                            <h3>
                                Estoque por tamanho
                            </h3>

                            <p>
                                Informe a quantidade disponível de cada tamanho.
                            </p>

                        </div>

                    </div>


                    <div
                        id="product-sizes-list"
                        class="product-sizes-list"
                    >

                        <div class="product-size-row">

                            <input
                                type="text"
                                placeholder="Tamanho"
                                class="product-size-input"
                            >

                            <input
                                type="number"
                                placeholder="Quantidade"
                                class="product-stock-input"
                                min="0"
                            >

                            <button
                                type="button"
                                class="product-size-remove"
                            >
                                ×
                            </button>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="product-add-size"
                        id="product-add-size"
                    >
                        + Adicionar tamanho
                    </button>

                </div>


                <!-- 05 -->

                <div class="product-form-section">

                    <div class="product-form-section-title">

                        <span>05</span>

                        <div>

                            <h3>
                                Configurações
                            </h3>

                            <p>
                                Defina como o produto aparecerá na loja.
                            </p>

                        </div>

                    </div>


                    <div class="product-options">

                        <label class="product-check-option">

                            <input
                                type="checkbox"
                                id="product-active"
                                checked
                            >

                            <span>

                                <strong>
                                    Produto ativo
                                </strong>

                                <small>
                                    Disponível para os clientes na loja.
                                </small>

                            </span>

                        </label>


                        <label class="product-check-option">

                            <input
                                type="checkbox"
                                id="product-featured"
                            >

                            <span>

                                <strong>
                                    Produto em destaque
                                </strong>

                                <small>
                                    Pode aparecer na área de destaques.
                                </small>

                            </span>

                        </label>


                        <label class="product-check-option">

                            <input
                                type="checkbox"
                                id="product-best-seller"
                            >

                            <span>

                                <strong>
                                    Mais vendido
                                </strong>

                                <small>
                                    Identifica o produto como best seller.
                                </small>

                            </span>

                        </label>

                    </div>

                </div>


                <!-- 06 -->

                <div
                    class="product-form-section product-photo-section"
                >

                    <div class="product-form-section-title">

                        <span>06</span>

                        <div>

                            <h3>
                                Fotos do produto
                            </h3>

                            <p>
                                Adicione as imagens que serão utilizadas na página do produto.
                            </p>

                        </div>

                    </div>


                    <label
                        class="product-photo-upload"
                        for="product-images"
                    >

                        <input
                            type="file"
                            id="product-images"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                        >

                        <strong>
                            + Adicionar fotos
                        </strong>

                        <span>
                            JPG, PNG ou WEBP. A primeira imagem será a principal.
                        </span>

                    </label>


                    <div
                        id="product-photo-grid"
                        class="product-photo-grid"
                    ></div>

                </div>


        <!-- =========================================================
             07 — INFORMAÇÕES DE ENVIO
        ========================================================= -->

<!-- =========================================================
     07 — INFORMAÇÕES DE ENVIO
========================================================= -->

<div class="product-form-section">

    <div class="product-form-section-header">

        <div>
            <span class="product-form-section-number">
                07
            </span>

            <h3>
                Informações de envio
            </h3>

            <p>
                Dados da embalagem utilizados para calcular o frete.
            </p>
        </div>

    </div>


    <div class="product-form-grid">

        <!-- PESO -->

        <div class="product-form-group">

            <label for="product-weight">
                Peso da embalagem (kg)
            </label>

            <input
                type="number"
                id="product-weight"
                name="weight"
                min="0.01"
                step="0.01"
                placeholder="Ex.: 0.90"
            >

            <small>
                Informe o peso aproximado do produto já embalado.
            </small>

        </div>


        <!-- ALTURA -->

        <div class="product-form-group">

            <label for="product-height">
                Altura (cm)
            </label>

            <input
                type="number"
                id="product-height"
                name="height"
                min="1"
                step="0.1"
                placeholder="Ex.: 15"
            >

        </div>


        <!-- LARGURA -->

        <div class="product-form-group">

            <label for="product-width">
                Largura (cm)
            </label>

            <input
                type="number"
                id="product-width"
                name="width"
                min="1"
                step="0.1"
                placeholder="Ex.: 25"
            >

        </div>


        <!-- COMPRIMENTO -->

        <div class="product-form-group">

            <label for="product-length">
                Comprimento (cm)
            </label>

            <input
                type="number"
                id="product-length"
                name="length"
                min="1"
                step="0.1"
                placeholder="Ex.: 35"
            >

        </div>

    </div>

</div>

                <!-- RODAPÉ -->

                <div class="product-form-footer">

                    <button
                        type="button"
                        class="product-cancel-button"
                        id="product-cancel-button"
                    >
                        Cancelar
                    </button>


                    <button
                        type="submit"
                        class="products-new-button"
                    >
                        Continuar cadastro
                    </button>

                </div>


            </form>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    productModalCreated =
        true;


    setupProductModal();

    loadStoreMenu();

}


/* =========================================================
   CONFIGURAÇÃO DO MODAL
   ========================================================= */

function setupProductModal() {

    const modal =
        $("product-modal");


    const closeButton =
        $("product-modal-close");


    const overlay =
        $("product-modal-overlay");


    const cancelButton =
        $("product-cancel-button");


    const form =
        $("new-product-form");


    const promotion =
        $("product-promotion");


    const promotionalField =
        $("promotional-price-field");


    const promotionalPrice =
        $("product-promotional-price");


    const price =
        $("product-price");


    const imageInput =
        $("product-images");


    const openModal = () => {

        modal.classList.add(
            "open"
        );


        document.body.classList.add(
            "modal-open"
        );


        setTimeout(
            () => {

                $("product-name")
                    ?.focus();

            },
            100
        );

    };


    const closeModal = () => {

        modal.classList.remove(
            "open"
        );


        document.body.classList.remove(
            "modal-open"
        );

    };


    closeButton.addEventListener(
        "click",
        closeModal
    );


    overlay.addEventListener(
        "click",
        closeModal
    );


    cancelButton.addEventListener(
        "click",
        closeModal
    );


    promotion.addEventListener(
        "change",
        () => {

            promotionalField.style.display =
                promotion.checked
                    ? "block"
                    : "none";


            if (
                !promotion.checked
            ) {

                promotionalPrice.value =
                    "";

            }

        }
    );


    $("product-add-size")
        .addEventListener(
            "click",
            addSizeRow
        );


    const firstRemoveButton =
        document.querySelector(
            "#product-sizes-list .product-size-remove"
        );


    if (firstRemoveButton) {

        firstRemoveButton.addEventListener(
            "click",
            () => {

                firstRemoveButton
                    .closest(
                        ".product-size-row"
                    )
                    ?.remove();

            }
        );

    }


    /* FOTOS */

    imageInput.addEventListener(
        "change",
        () => {

            addSelectedImages(
                Array.from(
                    imageInput.files || []
                )
            );


            imageInput.value =
                "";

        }
    );


    /* =====================================================
       FORMULÁRIO
       ===================================================== */

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const gender =
                $("product-gender");


            const category =
                $("product-category");


            const subcategory =
                $("product-subcategory");


            const leaf =
                $("product-leaf");


            const name =
                $("product-name")
                    .value
                    .trim();


            const brand =
                $("product-brand")
                    .value
                    .trim();


            const sku =
                $("product-sku")
                    .value
                    .trim();


            const description =
                $("product-description")
                    .value
                    .trim();


            const normalPrice =
                Number(
                    price.value || 0
                );


            const promoPrice =
                Number(
                    promotionalPrice.value || 0
                );


            /* VALIDAÇÕES */

            if (
                !name ||
                !brand ||
                !sku
            ) {

                alert(
                    "Preencha nome, marca e SKU."
                );

                return;

            }


            if (
                !gender.value ||
                !category.value ||
                !subcategory.value ||
                !leaf.value
            ) {

                alert(
                    "Selecione Gênero, Categoria, Subcategoria e Marca / nível final."
                );

                return;

            }


            if (
                normalPrice <= 0
            ) {

                alert(
                    "Informe um preço normal válido."
                );

                return;

            }


            if (
                promotion.checked &&
                promoPrice <= 0
            ) {

                alert(
                    "Informe o preço promocional."
                );

                return;

            }


            if (
                promotion.checked &&
                promoPrice >= normalPrice
            ) {

                alert(
                    "O preço promocional precisa ser menor que o preço normal."
                );

                return;

            }


            if (
    !editingProductId &&
    !selectedProductImages.length
) {
    alert(
        "Adicione pelo menos uma foto do produto."
    );

    return;
}


            const sizes =
                collectSizes();


            if (!sizes.length) {

                alert(
                    "Adicione pelo menos um tamanho com estoque."
                );

                return;

            }


            /* MENU */

            const genderItem =
                findMenuItem(
                    gender.value
                );


            const categoryItem =
                findMenuItem(
                    category.value
                );


            const subcategoryItem =
                findMenuItem(
                    subcategory.value
                );


            const leafItem =
                findMenuItem(
                    leaf.value
                );


            /* BOTÃO */

            const submitButton =
                form.querySelector(
                    'button[type="submit"]'
                );


            const originalButtonText =
                submitButton?.textContent ||
                "Continuar cadastro";


            try {

                /* =================================================
                   CLOUDINARY
                   ================================================= */

                if (submitButton) {

                    submitButton.disabled =
                        true;


                    submitButton.textContent =
                        "Enviando fotos...";

                }


                const uploadedImages =
                    await uploadProductImages(
                        selectedProductImages,
                        (
                            current,
                            total
                        ) => {

                            if (
                                submitButton
                            ) {

                                submitButton.textContent =
                                    `Enviando foto ${current} de ${total}...`;

                            }

                        }
                    );
const finalImages =
    editingProductId && !selectedProductImages.length
        ? products.find(
            product => product.id === editingProductId
        )?.images || []
        : uploadedImages;

                const mainImage =
                    finalImages.find(
                        (image) =>
                            image.main
                    ) ||
                    finalImages[0];


                if (submitButton) {

                    submitButton.textContent =
                        "Salvando produto...";

                }


                /* =================================================
                   OBJETO DO PRODUTO
                   ================================================= */

                const productData = {

                    name,

                    brand,

                    sku,

                    description,
    /* DADOS DE ENVIO */

    weight:
        Number(
            $("product-weight")?.value || 0
        ),

    height:
        Number(
            $("product-height")?.value || 0
        ),

    width:
        Number(
            $("product-width")?.value || 0
        ),

    length:
        Number(
            $("product-length")?.value || 0
        ),

                    menu: {

                        genderId:
                            gender.value,

                        gender:
                            genderItem?.name ||
                            "",


                        categoryId:
                            category.value,

                        category:
                            categoryItem?.name ||
                            "",


                        subcategoryId:
                            subcategory.value,

                        subcategory:
                            subcategoryItem?.name ||
                            "",


                        leafId:
                            leaf.value,

                        leaf:
                            leafItem?.name ||
                            ""

                    },


                    price:
                        normalPrice,


                    promotion:
                        promotion.checked,


                    promotionalPrice:
                        promotion.checked
                            ? promoPrice
                            : 0,


                    sizes,

images:
    finalImages,

                    /* FOTO PRINCIPAL */

                    image:
                        mainImage?.url ||
                        "",


                    active:
                        $("product-active")
                            .checked,


                    featured:
                        $("product-featured")
                            .checked,


                    bestSeller:
                        $("product-best-seller")
                            .checked,


                    createdAt:
                        serverTimestamp(),


                    updatedAt:
                        serverTimestamp()

                };


                console.log(
                    "CADASTRO PREPARADO:",
                    productData
                );


                /* =================================================
                   FIRESTORE
                   ================================================= */

               if (editingProductId) {

    await updateDoc(
        doc(db, "products", editingProductId),
        {
            ...productData,
            updatedAt: serverTimestamp()
        }
    );

} else {

    await addDoc(
        collection(db, "products"),
        productData
    );

}


                alert(
                    "Produto cadastrado com sucesso! As fotos foram enviadas ao Cloudinary e os dados foram salvos no Firebase."
                );


                /* =================================================
                   LIMPAR FORMULÁRIO
                   ================================================= */

                form.reset();


                $("product-active")
                    .checked =
                    true;


                $("promotional-price-field")
                    .style.display =
                    "none";


                clearAutomaticBrand();

                clearSubcategorySelect();

                clearLeafSelect();


                $("product-category")
                    .innerHTML =
                    `
                        <option value="">
                            Primeiro selecione o gênero
                        </option>
                    `;


                selectedProductImages =
                    [];


                renderPhotoPreview();


                const sizeRows =
                    document.querySelectorAll(
                        "#product-sizes-list .product-size-row"
                    );


                sizeRows.forEach(
                    (
                        row,
                        index
                    ) => {

                        if (
                            index > 0
                        ) {

                            row.remove();

                            return;

                        }


                        const sizeInput =
                            row.querySelector(
                                ".product-size-input"
                            );


                        const stockInput =
                            row.querySelector(
                                ".product-stock-input"
                            );


                        if (
                            sizeInput
                        ) {

                            sizeInput.value =
                                "";

                        }


                        if (
                            stockInput
                        ) {

                            stockInput.value =
                                "";

                        }

                    }
                );


                modal.classList.remove(
                    "open"
                );


                document.body.classList.remove(
                    "modal-open"
                );


                await loadProducts();


            } catch (error) {

                console.error(
                    "Erro ao cadastrar produto:",
                    error
                );


                alert(
                    getProductSaveErrorMessage(
                        error
                    )
                );


            } finally {

                if (
                    submitButton
                ) {

                    submitButton.disabled =
                        false;


                    submitButton.textContent =
                        originalButtonText;

                }

            }

        }
    );


    window.openProductModal =
        openModal;

}


/* =========================================================
   CLOUDINARY
   ========================================================= */

async function uploadProductImages(
    images,
    onProgress
) {

    const cloudName =
        "mvxldxuz";


    const uploadPreset =
        "vellor_products";


    const endpoint =
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;


    const uploaded = [];


    for (
        let index = 0;
        index < images.length;
        index += 1
    ) {

        const item =
            images[index];


        const formData =
            new FormData();


        formData.append(
            "file",
            item.file
        );


        formData.append(
            "upload_preset",
            uploadPreset
        );


        formData.append(
            "folder",
            "vellor-shoes/products"
        );


        const response =
            await fetch(
                endpoint,
                {
                    method: "POST",
                    body: formData
                }
            );


        let data =
            null;


        try {

            data =
                await response.json();

        } catch (_) {

            data =
                null;

        }


        if (
            !response.ok
        ) {

            const message =
                data?.error?.message ||
                "O Cloudinary recusou o upload.";


            throw new Error(
                `Cloudinary: ${message}`
            );

        }


        uploaded.push({

            url:
                data.secure_url,

            publicId:
                data.public_id ||
                "",

            width:
                data.width ||
                0,

            height:
                data.height ||
                0,

            format:
                data.format ||
                "",

            originalName:
                item.file.name,

            main:
                item.main === true

        });


        if (
            typeof onProgress ===
            "function"
        ) {

            onProgress(
                index + 1,
                images.length
            );

        }

    }


    return uploaded;

}


/* =========================================================
   ERROS
   ========================================================= */

function getProductSaveErrorMessage(
    error
) {

    const message =
        String(
            error?.message ||
            ""
        );


    if (
        message.includes(
            "Cloudinary"
        )
    ) {

        return `
Não foi possível enviar as fotos.

${message}
        `.trim();

    }


    if (
        message.includes(
            "permission-denied"
        )
    ) {

        return `
As fotos foram enviadas ao Cloudinary, mas o Firestore recusou a gravação.

Precisamos ajustar as regras da coleção products.
        `.trim();

    }


    return `
Não foi possível cadastrar o produto.

${message || "Erro desconhecido."}
    `.trim();

}


/* =========================================================
   TAMANHOS
   ========================================================= */

function addSizeRow() {

    const list =
        $("product-sizes-list");


    if (!list) {
        return;
    }


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "product-size-row";


    row.innerHTML = `

        <input
            type="text"
            placeholder="Tamanho"
            class="product-size-input"
        >

        <input
            type="number"
            placeholder="Quantidade"
            class="product-stock-input"
            min="0"
        >

        <button
            type="button"
            class="product-size-remove"
        >
            ×
        </button>

    `;


    row.querySelector(
        ".product-size-remove"
    ).addEventListener(
        "click",
        () => {

            row.remove();

        }
    );


    list.appendChild(
        row
    );

}


/* =========================================================
   COLETAR TAMANHOS
   ========================================================= */

function collectSizes() {

    return Array.from(
        document.querySelectorAll(
            "#product-sizes-list .product-size-row"
        )
    )

        .map(
            (row) => ({

                size:
                    row.querySelector(
                        ".product-size-input"
                    )?.value
                        .trim() ||
                    "",


                stock:
                    Number(
                        row.querySelector(
                            ".product-stock-input"
                        )?.value ||
                        0
                    )

            })
        )

        .filter(
            (item) => {

                return (
                    item.size &&
                    item.stock >= 0
                );

            }
        );

}


/* =========================================================
   FOTOS
   ========================================================= */

function addSelectedImages(
    files
) {

    files

        .filter(
            (file) => {

                return file.type.startsWith(
                    "image/"
                );

            }
        )

        .forEach(
            (file) => {

                if (
                    selectedProductImages.length >=
                    8
                ) {

                    return;

                }


                const alreadyExists =
                    selectedProductImages.some(
                        (item) => {

                            return (
                                item.file.name ===
                                file.name &&
                                item.file.size ===
                                file.size
                            );

                        }
                    );


                if (
                    alreadyExists
                ) {

                    return;

                }


                selectedProductImages.push({

                    id:
                        `${Date.now()}-${Math.random()
                            .toString(36)
                            .slice(2)}`,

                    file,

                    main:
                        selectedProductImages.length ===
                        0

                });

            }
        );


    renderPhotoPreview();

}


/* =========================================================
   PREVIEW DAS FOTOS
   ========================================================= */

function renderPhotoPreview() {

    const grid =
        $("product-photo-grid");


    if (!grid) {
        return;
    }


    grid.innerHTML =
        "";


    selectedProductImages.forEach(
        (item) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                `product-photo-card ${
                    item.main
                        ? "is-main"
                        : ""
                }`;


            const url =
                URL.createObjectURL(
                    item.file
                );


            card.innerHTML = `

                <img
                    src="${url}"
                    alt="Pré-visualização"
                >


                <span
                    class="product-photo-main"
                    style="
                        display:
                        ${
                            item.main
                                ? "block"
                                : "none"
                        };
                    "
                >
                    PRINCIPAL
                </span>


                <button
                    type="button"
                    class="product-photo-remove"
                >
                    ×
                </button>


                ${
                    !item.main

                        ? `
                            <button
                                type="button"
                                class="product-photo-select-main"
                            >
                                Definir como principal
                            </button>
                          `

                        : ""
                }

            `;


            card.querySelector(
                ".product-photo-remove"
            ).addEventListener(
                "click",
                () => {

                    selectedProductImages =
                        selectedProductImages.filter(
                            (photo) => {

                                return (
                                    photo.id !==
                                    item.id
                                );

                            }
                        );


                    if (
                        selectedProductImages.length &&
                        !selectedProductImages.some(
                            (photo) =>
                                photo.main
                        )
                    ) {

                        selectedProductImages[0]
                            .main =
                            true;

                    }


                    renderPhotoPreview();

                }
            );


            const mainButton =
                card.querySelector(
                    ".product-photo-select-main"
                );


            if (mainButton) {

                mainButton.addEventListener(
                    "click",
                    () => {

                        selectedProductImages
                            .forEach(
                                (photo) => {

                                    photo.main =
                                        photo.id ===
                                        item.id;

                                }
                            );


                        renderPhotoPreview();

                    }
                );

            }


            grid.appendChild(
                card
            );

        }
    );

}

document.addEventListener("click", async (event) => {

    const editButton =
        event.target.closest(".product-more-button");

    if (!editButton) {
        return;
    }

    const productId =
        editButton.dataset.productId;

    const product =
        products.find(
            item => item.id === productId
        );

    if (!product) {
        return;
    }

    editingProductId =
        product.id;

    /*
     * CRIA O MODAL
     */
    createProductModal();

    /*
     * GARANTE QUE O MENU ESTEJA
     * CARREGADO ANTES DE PREENCHER
     */
    await loadStoreMenu();

    const menu =
        product.menu || {};

    const gender =
        document.querySelector(
            "#product-gender"
        );

    const category =
        document.querySelector(
            "#product-category"
        );

    const subcategory =
        document.querySelector(
            "#product-subcategory"
        );

    const leaf =
        document.querySelector(
            "#product-leaf"
        );

    /*
     * DADOS BÁSICOS
     */
    document.querySelector(
        "#product-name"
    ).value =
        product.name || "";

    document.querySelector(
        "#product-brand"
    ).value =
        product.brand || "";

    document.querySelector(
        "#product-sku"
    ).value =
        product.sku || "";

    document.querySelector(
        "#product-description"
    ).value =
        product.description || "";

    document.querySelector(
        "#product-price"
    ).value =
        product.price || "";

    /*
     * PROMOÇÃO
     */
    const promotion =
        document.querySelector(
            "#product-promotion"
        );

    const promotionalPrice =
        document.querySelector(
            "#product-promotional-price"
        );

    const promotionalField =
        document.querySelector(
            "#promotional-price-field"
        );

    promotion.checked =
        product.promotion === true;

    promotionalPrice.value =
        product.promotionalPrice || "";

    promotionalField.style.display =
        promotion.checked
            ? "block"
            : "none";

    /*
     * STATUS
     */
    document.querySelector(
        "#product-active"
    ).checked =
        product.active !== false;

    document.querySelector(
        "#product-featured"
    ).checked =
        product.featured === true;

    document.querySelector(
        "#product-best-seller"
    ).checked =
        product.bestSeller === true;

    /*
     * CLASSIFICAÇÃO
     */

    if (gender) {

        gender.value =
            menu.genderId || "";

        populateCategorySelect(
            menu.genderId || ""
        );
    }

    if (category) {

        category.value =
            menu.categoryId || "";

        populateSubcategorySelect(
            menu.categoryId || ""
        );
    }

    if (subcategory) {

        subcategory.value =
            menu.subcategoryId || "";

        populateLeafSelect(
            menu.subcategoryId || ""
        );
    }

    if (leaf) {

        leaf.value =
            menu.leafId || "";
    }

    /*
     * TAMANHOS E ESTOQUE
     */
    const sizesList =
        document.querySelector(
            "#product-sizes-list"
        );

    if (sizesList) {

        sizesList.innerHTML = "";

        (product.sizes || [])
            .forEach(item => {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "product-size-row";

                row.innerHTML = `
                    <input
                        type="text"
                        placeholder="Tamanho"
                        class="product-size-input"
                        value="${item.size || ""}"
                    >

                    <input
                        type="number"
                        placeholder="Quantidade"
                        class="product-stock-input"
                        min="0"
                        value="${Number(item.stock || 0)}"
                    >

                    <button
                        type="button"
                        class="product-size-remove"
                    >
                        ×
                    </button>
                `;

                row.querySelector(
                    ".product-size-remove"
                ).addEventListener(
                    "click",
                    () => row.remove()
                );

                sizesList.appendChild(
                    row
                );
            });
    }

    /*
     * ABRE O MODAL POR ÚLTIMO
     */
    window.openProductModal();

});
/* =========================================================
   NOVO PRODUTO
   ========================================================= */

if (newProductButton) {

    newProductButton.addEventListener(
        "click",
        () => {

            createProductModal();


            selectedProductImages =
                [];


            renderPhotoPreview();


            window.openProductModal();

        }
    );

}
