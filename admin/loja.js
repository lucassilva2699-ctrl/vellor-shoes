import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyDQdaiVEWUeIFQOMXzI9DluqDkl8ZeMS5o",

    authDomain:
        "vellor-shoes.firebaseapp.com",

    projectId:
        "vellor-shoes",

    storageBucket:
        "vellor-shoes.firebasestorage.app",

    messagingSenderId:
        "455357473198",

    appId:
        "1:455357473198:web:f36451b846420b4dfde83f"

};


const app =
    initializeApp(
        firebaseConfig
    );

const auth =
    getAuth(app);

const db =
    getFirestore(app);


/* =========================================================
   ELEMENTOS
========================================================= */

const storeName =
    document.getElementById(
        "store-name"
    );

const storeWhatsapp =
    document.getElementById(
        "store-whatsapp"
    );

const storeInstagram =
    document.getElementById(
        "store-instagram"
    );

const storeEmail =
    document.getElementById(
        "store-email"
    );

const privacyPolicy =
    document.getElementById(
        "privacy-policy"
    );

const exchangePolicy =
    document.getElementById(
        "exchange-policy"
    );

const termsOfUse =
    document.getElementById(
        "terms-of-use"
    );

const saveButton =
    document.getElementById(
        "save-store-button"
    );

const logoFile =
    document.getElementById(
        "logo-file"
    );

const changeLogoButton =
    document.getElementById(
        "change-logo-button"
    );
const faviconFile =
    document.getElementById(
        "favicon-file"
    );

const changeFaviconButton =
    document.getElementById(
        "change-favicon-button"
    );
/* =========================================================
   ALTERAR FAVICON
========================================================= */

if (
    changeFaviconButton &&
    faviconFile
) {

    changeFaviconButton.addEventListener(
        "click",
        () => {

            faviconFile.click();

        }
    );

}


/* =========================================================
   ALTERAR LOGO
========================================================= */

if (changeLogoButton && logoFile) {

    changeLogoButton.addEventListener(
        "click",
        () => {

            logoFile.click();

        }
    );

}


if (logoFile) {

    logoFile.addEventListener(
        "change",
        async () => {

            const file =
                logoFile.files[0];


            if (!file) {

                return;

            }


            try {

                if (changeLogoButton) {

                    changeLogoButton.disabled =
                        true;

                    changeLogoButton.textContent =
                        "Enviando...";

                }


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
                    "vellor-shoes/store"
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
                        "Não foi possível enviar a logo."
                    );

                }


                /* =================================================
                   SALVAR LOGO NO FIREBASE
                ================================================= */

                const settingsRef =
                    doc(
                        db,
                        "store_settings",
                        "general"
                    );


                await setDoc(
                    settingsRef,
                    {

                        logoUrl:
                            uploadData.secure_url,

                        updatedAt:
                            new Date()

                    },
                    {
                        merge: true
                    }
                );


                console.log(
                    "Logo salva no Firebase:",
                    uploadData.secure_url
                );


                alert(
                    "Logo enviada e salva com sucesso!"
                );


            } catch (error) {

                console.error(
                    "Erro ao enviar logo:",
                    error
                );


                alert(
                    "Não foi possível enviar a logo."
                );


            } finally {

                if (changeLogoButton) {

                    changeLogoButton.disabled =
                        false;

                    changeLogoButton.textContent =
                        "Alterar logo";

                }


                logoFile.value = "";

            }

        }
    );

}
/* =========================================================
   ENVIAR FAVICON
========================================================= */

if (faviconFile) {

    faviconFile.addEventListener(
        "change",
        async () => {

            const file =
                faviconFile.files[0];


            if (!file) {

                return;

            }


            try {

                if (changeFaviconButton) {

                    changeFaviconButton.disabled =
                        true;

                    changeFaviconButton.textContent =
                        "Enviando...";

                }


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
                    "vellor-shoes/store"
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
                        "Não foi possível enviar a favicon."
                    );

                }


                /* =================================================
                   SALVAR FAVICON NO FIREBASE
                ================================================= */

                const settingsRef =
                    doc(
                        db,
                        "store_settings",
                        "general"
                    );


                await setDoc(
                    settingsRef,
                    {

                        faviconUrl:
                            uploadData.secure_url,

                        updatedAt:
                            new Date()

                    },
                    {
                        merge: true
                    }
                );


                /* =================================================
                   ATUALIZAR PREVIEW
                ================================================= */

                const faviconPreview =
                    document.getElementById(
                        "favicon-preview"
                    );

                const faviconEmpty =
                    document.getElementById(
                        "favicon-empty"
                    );


                if (faviconPreview) {

                    faviconPreview.src =
                        uploadData.secure_url;

                    faviconPreview.style.display =
                        "block";

                }


                if (faviconEmpty) {

                    faviconEmpty.style.display =
                        "none";

                }


                alert(
                    "Favicon enviada e salva com sucesso!"
                );


            } catch (error) {

                console.error(
                    "Erro ao enviar favicon:",
                    error
                );


                alert(
                    "Não foi possível enviar a favicon."
                );


            } finally {

                if (changeFaviconButton) {

                    changeFaviconButton.disabled =
                        false;

                    changeFaviconButton.textContent =
                        "Alterar favicon";

                }


                faviconFile.value = "";

            }

        }
    );

}

/* =========================================================
   CARREGAR CONFIGURAÇÕES
========================================================= */

async function loadStoreSettings() {

    try {

        const settingsRef =
            doc(
                db,
                "store_settings",
                "general"
            );


        const snapshot =
            await getDoc(
                settingsRef
            );


        if (
            !snapshot.exists()
        ) {

            console.log(
                "Configurações da loja ainda não existem."
            );

            return;

        }


        const data =
            snapshot.data();
        const storeLogoPreview =
    document.getElementById(
        "store-logo-preview"
    );

if (
    storeLogoPreview &&
    data.logoUrl
) {

    storeLogoPreview.src =
        data.logoUrl;

}
        storeName.value =
            data.name || "Vellor Shoes";

        storeWhatsapp.value =
            data.whatsapp || "";

        storeInstagram.value =
            data.instagram || "";

        storeEmail.value =
            data.email || "";

        privacyPolicy.value =
            data.privacyPolicy || "";

        exchangePolicy.value =
            data.exchangePolicy || "";

        termsOfUse.value =
            data.termsOfUse || "";


        console.log(
            "Configurações da loja carregadas."
        );


    } catch (error) {

        console.error(
            "Erro ao carregar configurações:",
            error
        );

    }

}


/* =========================================================
   SALVAR CONFIGURAÇÕES
========================================================= */

if (saveButton) {

    saveButton.addEventListener(
        "click",
        async () => {

            try {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "Salvando...";


                const settingsRef =
                    doc(
                        db,
                        "store_settings",
                        "general"
                    );


                await setDoc(
                    settingsRef,
                    {

                        name:
                            storeName.value.trim(),

                        whatsapp:
                            storeWhatsapp.value.trim(),

                        instagram:
                            storeInstagram.value.trim(),

                        email:
                            storeEmail.value.trim(),

                        privacyPolicy:
                            privacyPolicy.value.trim(),

                        exchangePolicy:
                            exchangePolicy.value.trim(),

                        termsOfUse:
                            termsOfUse.value.trim(),

                        updatedAt:
                            new Date()

                    },
                    {
                        merge: true
                    }
                );


                alert(
                    "Configurações da loja salvas com sucesso."
                );


            } catch (error) {

                console.error(
                    "Erro ao salvar configurações:",
                    error
                );


                alert(
                    "Não foi possível salvar as configurações."
                );


            } finally {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "Salvar alterações";

            }

        }
    );

}


/* =========================================================
   AUTENTICAÇÃO
========================================================= */

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        loadStoreSettings();

    }
);
