/* =========================================================
   VELLOR SHOES — ADMIN
   LOGIN + PROTEÇÃO + MENU DA LOJA
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
/* =========================================================
   CONFIGURAÇÃO FIREBASE
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyDQdaiVEWUeIFQOMXzI9DluqDkl8ZeMS5o",
    authDomain: "vellor-shoes.firebaseapp.com",
    projectId: "vellor-shoes",
    storageBucket: "vellor-shoes.firebasestorage.app",
    messagingSenderId: "455357473198",
    appId: "1:455357473198:web:f36451b846420b4dfde83f"
};


/* =========================================================
   INICIALIZA FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================================
   IDENTIFICA A PÁGINA
========================================================= */

const isLoginPage =
    document.getElementById("admin-login-form") !== null;

const isMenuPage =
    document.getElementById("store-menu-tree") !== null;


/* =========================================================
   LOGIN
========================================================= */

if (isLoginPage) {

    const loginForm =
        document.getElementById("admin-login-form");

    const emailInput =
        document.getElementById("admin-email");

    const passwordInput =
        document.getElementById("admin-password");

    const errorMessage =
        document.getElementById("admin-login-error");


    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            errorMessage.hidden = true;

            errorMessage.textContent = "";


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                window.location.href =
                    "dashboard.html";


            } catch (error) {

                console.error(
                    "Erro no login:",
                    error
                );


                errorMessage.hidden = false;


                if (
                    error.code ===
                    "auth/invalid-credential"
                ) {

                    errorMessage.textContent =
                        "E-mail ou senha incorretos.";

                }

                else if (
                    error.code ===
                    "auth/too-many-requests"
                ) {

                    errorMessage.textContent =
                        "Muitas tentativas. Aguarde alguns minutos e tente novamente.";

                }

                else {

                    errorMessage.textContent =
                        "Não foi possível realizar o login. Tente novamente.";

                }

            }

        }
    );

}


/* =========================================================
   PROTEÇÃO DAS PÁGINAS ADMIN
========================================================= */

if (!isLoginPage) {

    onAuthStateChanged(
        auth,
        (user) => {

            if (!user) {

                window.location.href =
                    "login.html";

                return;

            }


            console.log(
                "Administrador autenticado:",
                user.email
            );

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

const logoutButton =
    document.getElementById(
        "admin-logout-button"
    );


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
   MENU DA LOJA
========================================================= */

if (isMenuPage) {
/* =====================================================
   BANNER DA HOME
===================================================== */

const addHomeBannerButton =
    document.getElementById("add-home-banner-button");

const homeBannerModal =
    document.getElementById("home-banner-modal");

const closeHomeBannerModal =
    document.getElementById("close-home-banner-modal");

const cancelHomeBanner =
    document.getElementById("cancel-home-banner");

const homeBannerFile =
    document.getElementById("home-banner-file");

const saveHomeBanner =
    document.getElementById("save-home-banner");

const homeBannerPreview =
    document.getElementById("home-banner-preview");


function openHomeBannerModal() {

    homeBannerModal.hidden = false;

    homeBannerFile.value = "";

    homeBannerPreview.innerHTML = "";

}


function closeHomeBanner() {

    homeBannerModal.hidden = true;

}


if (addHomeBannerButton) {

    addHomeBannerButton.addEventListener(
        "click",
        openHomeBannerModal
    );

}


if (closeHomeBannerModal) {

    closeHomeBannerModal.addEventListener(
        "click",
        closeHomeBanner
    );

}


if (cancelHomeBanner) {

    cancelHomeBanner.addEventListener(
        "click",
        closeHomeBanner
    );

}


if (homeBannerFile) {

    homeBannerFile.addEventListener(
        "change",
        () => {

            const file =
                homeBannerFile.files[0];

            if (!file) return;

            const reader =
                new FileReader();

            reader.onload = () => {

                homeBannerPreview.innerHTML = `
                    <img
                        src="${reader.result}"
                        style="
                            width:100%;
                            max-height:260px;
                            object-fit:cover;
                            border-radius:10px;
                            display:block;
                        "
                    >
                `;

            };

            reader.readAsDataURL(file);

        }
    );

}


if (saveHomeBanner) {

    saveHomeBanner.addEventListener(
        "click",
        async () => {

            const file =
                homeBannerFile.files[0];

            if (!file) {

                alert(
                    "Selecione uma imagem para o banner."
                );

                return;

            }

            saveHomeBanner.disabled = true;

            saveHomeBanner.textContent =
                "Enviando...";


            try {

                /* =========================================
                   CLOUDINARY
                ========================================= */

                const formData =
                    new FormData();

                formData.append(
                    "file",
                    file
                );

                formData.append(
                    "upload_preset",
                    "vellor_products"
                );

                formData.append(
                    "folder",
                    "vellor-shoes/home"
                );


                const uploadResponse =
                    await fetch(
                        "https://api.cloudinary.com/v1_1/mvxldxuz/image/upload",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const uploadData =
                    await uploadResponse.json();


                if (!uploadData.secure_url) {

                    throw new Error(
                        "Não foi possível enviar a imagem."
                    );

                }


                /* =========================================
                   FIRESTORE
                ========================================= */

                await setDoc(
                    doc(
                        db,
                        "home_banners",
                        "main"
                    ),
                    {
                        imageUrl:
                            uploadData.secure_url,

                        active:
                            true,

                        updatedAt:
                            serverTimestamp()
                    }
                );


                alert(
                    "Banner da Home salvo com sucesso!"
                );

                closeHomeBanner();


            } catch (error) {

                console.error(
                    "Erro ao salvar banner:",
                    error
                );

                alert(
                    "Não foi possível salvar o banner."
                );

            } finally {

                saveHomeBanner.disabled = false;

                saveHomeBanner.textContent =
                    "Salvar banner";

            }

        }
    );

}

    /* =====================================================
       ELEMENTOS
    ===================================================== */

    const modal =
        document.getElementById(
            "menu-modal"
        );

    const openButton =
        document.getElementById(
            "add-menu-item-button"
        );

    const closeButton =
        document.getElementById(
            "close-menu-modal"
        );

    const cancelButton =
        document.getElementById(
            "cancel-menu-item"
        );

    const form =
        document.getElementById(
            "menu-item-form"
        );

    const nameInput =
        document.getElementById(
            "menu-item-name"
        );

    const parentSelect =
        document.getElementById(
            "menu-item-parent"
        );

    const tree =
        document.getElementById(
            "store-menu-tree"
        );


    /* =====================================================
       DADOS
    ===================================================== */

    let menuItems = [];

    let editingItemId = null;


    /* =====================================================
       ESTILOS DOS BOTÕES DE AÇÃO
    ===================================================== */

    const actionStyles = document.createElement(
        "style"
    );

    actionStyles.textContent = `

        .menu-tree-row {
            position: relative;
        }

        .menu-tree-actions {
            margin-left: auto;
            position: relative;
        }

        .menu-tree-action-button {
            width: 36px;
            height: 36px;
            border: 1px solid #303036;
            border-radius: 8px;
            background: #1a1a1d;
            color: #ffffff;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
        }

        .menu-tree-action-button:hover {
            border-color: #007BFF;
            color: #007BFF;
        }

        .menu-tree-action-menu {
            position: absolute;
            top: 42px;
            right: 0;
            z-index: 100;
            width: 210px;
            padding: 6px;
            background: #1b1b1f;
            border: 1px solid #303036;
            border-radius: 10px;
            box-shadow: 0 15px 40px rgba(0,0,0,.35);
        }

        .menu-tree-action-menu button {
            width: 100%;
            border: 0;
            background: transparent;
            color: #ffffff;
            padding: 11px 12px;
            text-align: left;
            border-radius: 7px;
            cursor: pointer;
            font-size: 13px;
        }

        .menu-tree-action-menu button:hover {
            background: #26262b;
        }

        .menu-tree-action-menu .danger {
            color: #ff5c5c;
        }

        .menu-tree-inactive {
            opacity: .55;
        }

        .menu-tree-status {
            margin-left: 10px;
            font-size: 11px;
            color: #888;
        }

    `;

    document.head.appendChild(
        actionStyles
    );


    /* =====================================================
       MODAL
    ===================================================== */

    function openMenuModal(
        parentId = null,
        itemToEdit = null
    ) {

        if (!modal) {
            return;
        }


        modal.hidden = false;


        editingItemId =
            itemToEdit
                ? itemToEdit.id
                : null;


        if (nameInput) {

            nameInput.value =
                itemToEdit
                    ? itemToEdit.name
                    : "";

        }


        updateParentOptions();


        if (parentSelect) {

            parentSelect.value =
                itemToEdit
                    ? (
                        itemToEdit.parentId ||
                        ""
                    )
                    : (
                        parentId ||
                        ""
                    );

        }


        if (nameInput) {

            nameInput.focus();

        }


        const saveButton =
            form?.querySelector(
                ".menu-save-button"
            );


        if (saveButton) {

            saveButton.textContent =
                editingItemId
                    ? "Salvar alterações"
                    : "Salvar item";

        }

    }


    /* =====================================================
       FECHAR MODAL
    ===================================================== */

    function closeMenuModal() {

        if (!modal) {
            return;
        }


        modal.hidden = true;

        editingItemId = null;


        if (nameInput) {

            nameInput.value = "";

        }


        const saveButton =
            form?.querySelector(
                ".menu-save-button"
            );


        if (saveButton) {

            saveButton.textContent =
                "Salvar item";

        }

    }


    /* =====================================================
       BOTÃO PRINCIPAL
    ===================================================== */

    if (openButton) {

        openButton.addEventListener(
            "click",
            () => {

                openMenuModal();

            }
        );

    }


    /* =====================================================
       FECHAR
    ===================================================== */

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeMenuModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeMenuModal
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === modal
                ) {

                    closeMenuModal();

                }

            }
        );

    }


    /* =====================================================
       CARREGAR MENU
    ===================================================== */

    async function loadMenu() {

        try {

            /*
             * Neste momento carregamos somente
             * os itens ativos.
             */

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


            menuItems =
                snapshot.docs.map(
                    (document) => {

                        return {

                            id:
                                document.id,

                            ...document.data()

                        };

                    }
                );


            menuItems.sort(
                (a, b) => {

                    const timeA =
                        a.createdAt &&
                        typeof a.createdAt.toMillis ===
                        "function"
                            ? a.createdAt.toMillis()
                            : 0;


                    const timeB =
                        b.createdAt &&
                        typeof b.createdAt.toMillis ===
                        "function"
                            ? b.createdAt.toMillis()
                            : 0;


                    return timeA - timeB;

                }
            );


            renderMenu();


            console.log(
                "Menu carregado:",
                menuItems
            );


        } catch (error) {

            console.error(
                "Erro ao carregar menu:",
                error
            );


            if (tree) {

                tree.innerHTML = `
                    <div class="menu-empty-state">

                        <div class="menu-empty-icon">
                            !
                        </div>

                        <h3>
                            Não foi possível carregar o menu
                        </h3>

                        <p>
                            Ocorreu um erro ao buscar
                            a estrutura da loja.
                        </p>

                    </div>
                `;

            }

        }

    }


    /* =====================================================
       OPÇÕES DE PAI
    ===================================================== */

    function updateParentOptions() {

        if (!parentSelect) {
            return;
        }


        parentSelect.innerHTML = `
            <option value="">
                Categoria principal
            </option>
        `;


        menuItems.forEach(
            (item) => {

                /*
                 * Durante a edição não permitimos
                 * escolher o próprio item como pai.
                 */

                if (
                    editingItemId &&
                    item.id === editingItemId
                ) {

                    return;

                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    item.id;


                option.textContent =
                    getItemPath(item);


                parentSelect.appendChild(
                    option
                );

            }
        );

    }


    /* =====================================================
       CAMINHO
    ===================================================== */

    function getItemPath(item) {

        const path = [];

        let current = item;

        const safety = new Set();


        while (
            current &&
            !safety.has(current.id)
        ) {

            safety.add(
                current.id
            );


            path.unshift(
                current.name
            );


            if (!current.parentId) {

                break;

            }


            current =
                menuItems.find(
                    (parent) =>
                        parent.id ===
                        current.parentId
                );

        }


        return path.join(
            " → "
        );

    }


    /* =====================================================
       RENDERIZAR MENU
    ===================================================== */

    function renderMenu() {

        if (!tree) {
            return;
        }


        if (!menuItems.length) {

            tree.innerHTML = `
                <div class="menu-empty-state">

                    <div class="menu-empty-icon">
                        +
                    </div>

                    <h3>
                        Nenhum item configurado
                    </h3>

                    <p>
                        Comece adicionando uma categoria
                        para construir o menu da sua loja.
                    </p>

                    <button
                        type="button"
                        class="menu-empty-button"
                        id="empty-add-menu-button"
                    >
                        Adicionar primeira categoria
                    </button>

                </div>
            `;


            const newButton =
                document.getElementById(
                    "empty-add-menu-button"
                );


            if (newButton) {

                newButton.addEventListener(
                    "click",
                    () => openMenuModal()
                );

            }


            return;

        }


        tree.innerHTML = "";


        const roots =
            menuItems.filter(
                (item) =>
                    !item.parentId
            );


        roots.forEach(
            (root) => {

                tree.appendChild(
                    createTreeItem(root)
                );

            }
        );


        updateParentOptions();

    }


    /* =====================================================
       CRIAR ITEM DA ÁRVORE
    ===================================================== */

    function createTreeItem(item) {

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "menu-tree-item";


        if (item.active === false) {

            wrapper.classList.add(
                "menu-tree-inactive"
            );

        }


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "menu-tree-row";


        const left =
            document.createElement(
                "div"
            );


        left.className =
            "menu-tree-left";


        const arrow =
            document.createElement(
                "span"
            );


        arrow.className =
            "menu-tree-arrow";

        arrow.textContent =
            "›";


        const name =
            document.createElement(
                "span"
            );


        name.className =
            "menu-tree-name";

        name.textContent =
            item.name;


        left.appendChild(
            arrow
        );

        left.appendChild(
            name
        );


        if (item.active === false) {

            const status =
                document.createElement(
                    "span"
                );

            status.className =
                "menu-tree-status";

            status.textContent =
                "Inativo";

            left.appendChild(
                status
            );

        }


        row.appendChild(
            left
        );


        /* =================================================
           AÇÕES
        ================================================= */

        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "menu-tree-actions";


        const actionButton =
            document.createElement(
                "button"
            );


        actionButton.type =
            "button";

        actionButton.className =
            "menu-tree-action-button";

        actionButton.textContent =
            "⋮";

        actionButton.title =
            "Ações";


        const actionMenu =
            document.createElement(
                "div"
            );


        actionMenu.className =
            "menu-tree-action-menu";

        actionMenu.hidden =
            true;


        /* ===============================================
           EDITAR
        =============================================== */

        const editButton =
            document.createElement(
                "button"
            );

        editButton.type =
            "button";

        editButton.textContent =
            "✏️  Editar";


        editButton.addEventListener(
            "click",
            () => {

                actionMenu.hidden =
                    true;

                openMenuModal(
                    null,
                    item
                );

            }
        );


        /* ===============================================
           ADICIONAR FILHO
        =============================================== */

        const childButton =
            document.createElement(
                "button"
            );

        childButton.type =
            "button";

        childButton.textContent =
            "➕  Adicionar subcategoria";


        childButton.addEventListener(
            "click",
            () => {

                actionMenu.hidden =
                    true;

                openMenuModal(
                    item.id
                );

            }
        );


        /* ===============================================
           ATIVAR / DESATIVAR
        =============================================== */

        const toggleButton =
            document.createElement(
                "button"
            );

        toggleButton.type =
            "button";

        toggleButton.textContent =
            item.active === false
                ? "🟢  Ativar"
                : "🔴  Desativar";


        toggleButton.addEventListener(
            "click",
            async () => {

                actionMenu.hidden =
                    true;

                await toggleMenuItem(
                    item
                );

            }
        );


        /* ===============================================
           EXCLUIR
        =============================================== */

        const deleteButton =
            document.createElement(
                "button"
            );

        deleteButton.type =
            "button";

        deleteButton.className =
            "danger";

        deleteButton.textContent =
            "🗑️  Excluir";


        deleteButton.addEventListener(
            "click",
            async () => {

                actionMenu.hidden =
                    true;

                await deleteMenuItem(
                    item
                );

            }
        );


        actionMenu.appendChild(
            editButton
        );

        actionMenu.appendChild(
            childButton
        );

        actionMenu.appendChild(
            toggleButton
        );

        actionMenu.appendChild(
            deleteButton
        );


        actions.appendChild(
            actionButton
        );

        actions.appendChild(
            actionMenu
        );


        actionButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                document
                    .querySelectorAll(
                        ".menu-tree-action-menu"
                    )
                    .forEach(
                        (menu) => {

                            if (
                                menu !==
                                actionMenu
                            ) {

                                menu.hidden =
                                    true;

                            }

                        }
                    );


                actionMenu.hidden =
                    !actionMenu.hidden;

            }
        );


        row.appendChild(
            actions
        );


        wrapper.appendChild(
            row
        );


        /* =================================================
           FILHOS
        ================================================= */

        const children =
            menuItems.filter(
                (child) =>
                    child.parentId ===
                    item.id
            );


        if (children.length) {

            const childrenContainer =
                document.createElement(
                    "div"
                );


            childrenContainer.className =
                "menu-tree-children";


            children.forEach(
                (child) => {

                    childrenContainer.appendChild(
                        createTreeItem(child)
                    );

                }
            );


            wrapper.appendChild(
                childrenContainer
            );

        }


        return wrapper;

    }


    /* =====================================================
       EDITAR ITEM
    ===================================================== */

    async function updateMenuItem(
        itemId,
        name,
        parentId
    ) {

        try {

            await updateDoc(
                doc(
                    db,
                    "store_menu",
                    itemId
                ),
                {

                    name:
                        name,

                    parentId:
                        parentId || null,

                    updatedAt:
                        serverTimestamp()

                }
            );


            const item =
                menuItems.find(
                    (menuItem) =>
                        menuItem.id ===
                        itemId
                );


            if (item) {

                item.name =
                    name;

                item.parentId =
                    parentId || null;

            }


            renderMenu();


            closeMenuModal();


            alert(
                "Item atualizado com sucesso."
            );


        } catch (error) {

            console.error(
                "Erro ao editar item:",
                error
            );


            alert(
                "Não foi possível atualizar o item."
            );

        }

    }


    /* =====================================================
       ATIVAR / DESATIVAR
    ===================================================== */

    async function toggleMenuItem(item) {

        const newStatus =
            item.active === false;


        const actionText =
            newStatus
                ? "ativar"
                : "desativar";


        const confirmed =
            confirm(
                `Deseja ${actionText} "${item.name}"?`
            );


        if (!confirmed) {
            return;
        }


        try {

            await updateDoc(
                doc(
                    db,
                    "store_menu",
                    item.id
                ),
                {

                    active:
                        newStatus,

                    updatedAt:
                        serverTimestamp()

                }
            );


            /*
             * Como a leitura atual do admin busca
             * somente ativos, quando desativarmos
             * removemos o item da lista local.
             */

            if (!newStatus) {

                menuItems =
                    menuItems.filter(
                        (menuItem) =>
                            menuItem.id !==
                            item.id
                    );

            }

            else {

                item.active =
                    true;

            }


            renderMenu();


        } catch (error) {

            console.error(
                "Erro ao alterar status:",
                error
            );


            alert(
                "Não foi possível alterar o status."
            );

        }

    }


    /* =====================================================
       EXCLUIR ITEM
    ===================================================== */

    async function deleteMenuItem(item) {

        const children =
            menuItems.filter(
                (child) =>
                    child.parentId ===
                    item.id
            );


        /*
         * Não permitimos excluir um item que
         * ainda possui filhos.
         */

        if (children.length) {

            alert(
                `Não é possível excluir "${item.name}" porque ele possui ${children.length} subcategoria(s).\n\nExclua ou mova as subcategorias primeiro.`
            );

            return;

        }


        const confirmed =
            confirm(
                `Tem certeza que deseja excluir "${item.name}"?`
            );


        if (!confirmed) {
            return;
        }


        try {

            await deleteDoc(
                doc(
                    db,
                    "store_menu",
                    item.id
                )
            );


            menuItems =
                menuItems.filter(
                    (menuItem) =>
                        menuItem.id !==
                        item.id
                );


            renderMenu();


            alert(
                "Item excluído com sucesso."
            );


        } catch (error) {

            console.error(
                "Erro ao excluir item:",
                error
            );


            alert(
                "Não foi possível excluir o item."
            );

        }

    }


    /* =====================================================
       SALVAR / EDITAR
    ===================================================== */

    if (form) {

        form.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const name =
                    nameInput
                        ? nameInput.value.trim()
                        : "";


                const parentId =
                    parentSelect
                        ? parentSelect.value || null
                        : null;


                if (!name) {

                    alert(
                        "Digite o nome do item."
                    );

                    return;

                }


                const saveButton =
                    form.querySelector(
                        ".menu-save-button"
                    );


                if (saveButton) {

                    saveButton.disabled =
                        true;

                    saveButton.textContent =
                        "Salvando...";

                }


                try {

                    /* =====================================
                       EDIÇÃO
                    ===================================== */

                    if (editingItemId) {

                        await updateMenuItem(
                            editingItemId,
                            name,
                            parentId
                        );


                        return;

                    }


                    /* =====================================
                       NOVO ITEM
                    ===================================== */

                    const docRef =
                        await addDoc(
                            collection(
                                db,
                                "store_menu"
                            ),
                            {

                                name:
                                    name,

                                parentId:
                                    parentId,

                                active:
                                    true,

                                createdAt:
                                    serverTimestamp()

                            }
                        );


                    menuItems.push({

                        id:
                            docRef.id,

                        name:
                            name,

                        parentId:
                            parentId,

                        active:
                            true,

                        createdAt:
                            null

                    });


                    renderMenu();


                    closeMenuModal();


                    console.log(
                        "Item criado:",
                        docRef.id
                    );


                } catch (error) {

                    console.error(
                        "Erro ao salvar item:",
                        error
                    );


                    alert(
                        "Não foi possível salvar o item no Firebase."
                    );

                } finally {

                    if (saveButton) {

                        saveButton.disabled =
                            false;

                        saveButton.textContent =
                            editingItemId
                                ? "Salvar alterações"
                                : "Salvar item";

                    }

                }

            }
        );

    }


    /* =====================================================
       FECHAR MENUS AO CLICAR FORA
    ===================================================== */

    document.addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    ".menu-tree-action-menu"
                )
                .forEach(
                    (menu) => {

                        menu.hidden =
                            true;

                    }
                );

        }
    );


    /* =====================================================
       INICIA
    ===================================================== */

    loadMenu();

}
/* =========================================================
   DASHBOARD — DADOS DA LOJA
========================================================= */

if (
    document.getElementById("total-products")
) {

    const totalProductsElement =
        document.getElementById(
            "total-products"
        );

    const activeProductsElement =
        document.getElementById(
            "active-products"
        );

    const lowStockProductsElement =
        document.getElementById(
            "low-stock-products"
        );

    const totalOrdersElement =
        document.getElementById(
            "total-orders"
        );

    const recentProductsElement =
        document.getElementById(
            "recent-products"
        );

    const recentOrdersElement =
        document.getElementById(
            "recent-orders"
        );


    function getDashboardStock(product) {

        if (Array.isArray(product.sizes)) {

            return product.sizes.reduce(
                (total, size) => {

                    return (
                        total +
                        Number(
                            size.stock || 0
                        )
                    );

                },
                0
            );
        }

        return Number(
            product.stock || 0
        );
    }


    function formatDashboardPrice(value) {

        return Number(
            value || 0
        ).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
    }


    function formatDashboardDate(timestamp) {

        if (!timestamp) {
            return "-";
        }

        let date;

        if (
            timestamp &&
            typeof timestamp.toDate ===
                "function"
        ) {

            date =
                timestamp.toDate();

        } else {

            date =
                new Date(timestamp);
        }

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "-";
        }

        return date.toLocaleDateString(
            "pt-BR"
        );
    }


    function getDashboardStatus(status) {

        const labels = {

            aguardando_pagamento:
                "Aguardando pagamento",

            pago:
                "Pagamento confirmado",

            em_preparacao:
                "Em preparação",

            enviado:
                "Enviado",

            concluido:
                "Concluído",

            cancelado:
                "Cancelado"

        };

        return (
            labels[status] ||
            status ||
            "Indefinido"
        );
    }


    async function loadDashboard() {

        try {

            /* =================================================
               PRODUTOS
            ================================================= */

            const productsQuery =
                query(
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


            const productsSnapshot =
                await getDocs(
                    productsQuery
                );


            const products =
                productsSnapshot.docs.map(
                    document => ({
                        id:
                            document.id,
                        ...document.data()
                    })
                );


            const lowStockProducts =
                products.filter(
                    product => {

                        const stock =
                            getDashboardStock(
                                product
                            );

                        return (
                            stock > 0 &&
                            stock <= 3
                        );
                    }
                );


            totalProductsElement.textContent =
                products.length;


            activeProductsElement.textContent =
                products.filter(
                    product =>
                        product.active === true
                ).length;


            lowStockProductsElement.textContent =
                lowStockProducts.length;


            /* =================================================
               PRODUTOS RECENTES
            ================================================= */

            const recentProducts =
                [...products]
                    .sort(
                        (a, b) => {

                            const dateA =
                                a.createdAt?.toMillis
                                    ? a.createdAt.toMillis()
                                    : 0;

                            const dateB =
                                b.createdAt?.toMillis
                                    ? b.createdAt.toMillis()
                                    : 0;

                            return (
                                dateB -
                                dateA
                            );
                        }
                    )
                    .slice(0, 5);


            if (
                recentProducts.length
            ) {

                recentProductsElement.innerHTML =
                    recentProducts
                        .map(
                            product => {

                                const stock =
                                    getDashboardStock(
                                        product
                                    );

                                const price =
                                    product.promotion &&
                                    Number(
                                        product.promotionalPrice
                                    ) > 0
                                        ? product.promotionalPrice
                                        : product.price;


                                return `
                                    <div
                                        style="
                                            display:flex;
                                            align-items:center;
                                            justify-content:space-between;
                                            gap:15px;
                                            padding:14px 0;
                                            border-bottom:1px solid #25252a;
                                        "
                                    >

                                        <div>
                                            <strong
                                                style="
                                                    display:block;
                                                    color:#fff;
                                                    font-size:13px;
                                                    margin-bottom:4px;
                                                "
                                            >
                                                ${product.name || "Produto sem nome"}
                                            </strong>

                                            <span
                                                style="
                                                    color:#777;
                                                    font-size:11px;
                                                "
                                            >
                                                ${product.brand || ""}
                                                ${product.brand ? " • " : ""}
                                                Estoque: ${stock}
                                            </span>
                                        </div>

                                        <strong
                                            style="
                                                color:#007BFF;
                                                font-size:13px;
                                                white-space:nowrap;
                                            "
                                        >
                                            ${formatDashboardPrice(price)}
                                        </strong>

                                    </div>
                                `;
                            }
                        )
                        .join("");

            } else {

                recentProductsElement.innerHTML = `
                    <div class="admin-empty-state">

                        <div class="admin-empty-icon">
                            ◈
                        </div>

                        <h3>
                            Nenhum produto cadastrado
                        </h3>

                        <p>
                            Cadastre seu primeiro produto para começar.
                        </p>

                    </div>
                `;
            }


            /* =================================================
               PEDIDOS
            ================================================= */

            const ordersSnapshot =
                await getDocs(
                    collection(
                        db,
                        "orders"
                    )
                );


            const orders =
                ordersSnapshot.docs.map(
                    document => ({
                        id:
                            document.id,
                        ...document.data()
                    })
                );


            totalOrdersElement.textContent =
                orders.length;


            /* =================================================
               PEDIDOS RECENTES
            ================================================= */

            const recentOrders =
                [...orders]
                    .sort(
                        (a, b) => {

                            const dateA =
                                a.createdAt?.toMillis
                                    ? a.createdAt.toMillis()
                                    : 0;

                            const dateB =
                                b.createdAt?.toMillis
                                    ? b.createdAt.toMillis()
                                    : 0;

                            return (
                                dateB -
                                dateA
                            );
                        }
                    )
                    .slice(0, 5);


            if (
                recentOrders.length
            ) {

                recentOrdersElement.innerHTML =
                    recentOrders
                        .map(
                            order => {

                                return `
                                    <div
                                        style="
                                            display:flex;
                                            align-items:center;
                                            justify-content:space-between;
                                            gap:15px;
                                            padding:14px 0;
                                            border-bottom:1px solid #25252a;
                                        "
                                    >

                                        <div>

                                            <strong
                                                style="
                                                    display:block;
                                                    color:#fff;
                                                    font-size:13px;
                                                    margin-bottom:4px;
                                                "
                                            >
                                                ${order.orderNumber || "Pedido"}
                                            </strong>

                                            <span
                                                style="
                                                    color:#777;
                                                    font-size:11px;
                                                "
                                            >
                                                ${order.customer?.name || "Cliente"}
                                                •
                                                ${formatDashboardDate(order.createdAt)}
                                            </span>

                                        </div>

                                        <div
                                            style="
                                                text-align:right;
                                            "
                                        >

                                            <strong
                                                style="
                                                    display:block;
                                                    color:#007BFF;
                                                    font-size:13px;
                                                "
                                            >
                                                ${formatDashboardPrice(order.total)}
                                            </strong>

                                            <span
                                                style="
                                                    color:#999;
                                                    font-size:10px;
                                                "
                                            >
                                                ${getDashboardStatus(order.status)}
                                            </span>

                                        </div>

                                    </div>
                                `;
                            }
                        )
                        .join("");

            } else {

                recentOrdersElement.innerHTML = `
                    <div class="admin-empty-state">

                        <div class="admin-empty-icon">
                            ▣
                        </div>

                        <h3>
                            Nenhum pedido ainda
                        </h3>

                        <p>
                            Os pedidos dos seus clientes aparecerão aqui.
                        </p>

                    </div>
                `;
            }


            console.log(
                "Dashboard carregada:",
                {
                    produtos:
                        products.length,

                    estoqueBaixo:
                        lowStockProducts.length,

                    pedidos:
                        orders.length
                }
            );


        } catch (error) {

            console.error(
                "Erro ao carregar Dashboard:",
                error
            );

        }

    }


    onAuthStateChanged(
        auth,
        user => {

            if (!user) {
                return;
            }

            loadDashboard();

        }
    );

}
