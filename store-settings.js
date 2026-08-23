import {
    initializeApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


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


/* =========================================================
   INICIALIZAR FIREBASE
========================================================= */

const app =
    getApps().length
        ? getApps()[0]
        : initializeApp(firebaseConfig);

const db =
    getFirestore(app);


/* =========================================================
   FAVICON DA LOJA
========================================================= */

async function loadStoreFavicon() {

    try {

        const settingsRef =
            doc(
                db,
                "store_settings",
                "general"
            );

        const settingsSnap =
            await getDoc(settingsRef);


        if (!settingsSnap.exists()) {
            return;
        }


        const store =
            settingsSnap.data();


        if (!store.faviconUrl) {
            return;
        }


        let favicon =
            document.querySelector(
                'link[rel="icon"]'
            );


        if (!favicon) {

            favicon =
                document.createElement(
                    "link"
                );

            favicon.rel =
                "icon";

            document.head.appendChild(
                favicon
            );

        }


        favicon.href =
            store.faviconUrl;


    } catch (error) {

        console.error(
            "Erro ao carregar favicon da loja:",
            error
        );

    }

}


/* =========================================================
   INICIAR
========================================================= */

loadStoreFavicon();
