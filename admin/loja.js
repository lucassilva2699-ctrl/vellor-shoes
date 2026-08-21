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
