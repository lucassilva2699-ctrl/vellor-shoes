import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export default async function handler(req, res) {

    try {

        /* =========================================================
           FIREBASE ADMIN
        ========================================================= */

        if (getApps().length === 0) {

            const serviceAccount =
                JSON.parse(
                    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
                );

            initializeApp({
                credential: cert(serviceAccount)
            });
        }

        const db = getFirestore();


        /* =========================================================
           MÉTODO
        ========================================================= */

        if (req.method !== "GET") {

            return res.status(405).send(
                "Método não permitido."
            );

        }


        /* =========================================================
           DADOS RECEBIDOS DO MELHOR ENVIO
        ========================================================= */

        const code =
            req.query?.code || null;

        const error =
            req.query?.error || null;


        /* =========================================================
           ERRO DE AUTORIZAÇÃO
        ========================================================= */

        if (error) {

            console.error(
                "Melhor Envio retornou erro:",
                error
            );

            return res.status(400).send(`

                <!DOCTYPE html>

                <html lang="pt-BR">

                <head>

                    <meta charset="UTF-8">

                    <title>
                        Erro — Vellor Shoes
                    </title>

                    <style>

                        body {
                            font-family: Arial, sans-serif;
                            background: #f5f5f7;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                        }

                        .card {
                            background: white;
                            padding: 40px;
                            border-radius: 16px;
                            text-align: center;
                            max-width: 500px;
                            box-shadow:
                                0 10px 30px
                                rgba(0,0,0,.08);
                        }

                        h1 {
                            color: #d93025;
                        }

                        p {
                            color: #666;
                        }

                    </style>

                </head>

                <body>

                    <div class="card">

                        <h1>
                            Autorização não concluída
                        </h1>

                        <p>
                            O Melhor Envio não autorizou
                            a integração.
                        </p>

                        <p>
                            Código:
                            ${String(error)}
                        </p>

                    </div>

                </body>

                </html>

            `);

        }


        /* =========================================================
           CODE OBRIGATÓRIO
        ========================================================= */

        if (!code) {

            return res.status(400).send(`

                <!DOCTYPE html>

                <html lang="pt-BR">

                <head>

                    <meta charset="UTF-8">

                    <title>
                        Erro — Vellor Shoes
                    </title>

                </head>

                <body>

                    <h1>
                        Código de autorização não encontrado.
                    </h1>

                    <p>
                        O Melhor Envio não enviou o parâmetro
                        "code".
                    </p>

                </body>

                </html>

            `);

        }


        /* =========================================================
           CREDENCIAIS
        ========================================================= */

        const clientId =
            process.env.MELHOR_ENVIO_CLIENT_ID;

        const clientSecret =
            process.env.MELHOR_ENVIO_CLIENT_SECRET;


        if (
            !clientId ||
            !clientSecret
        ) {

            console.error(
                "Credenciais do Melhor Envio não configuradas."
            );

            return res.status(500).send(
                "Credenciais do Melhor Envio não configuradas no servidor."
            );

        }


        /* =========================================================
           CALLBACK
        ========================================================= */

        const redirectUri =
            "https://vellor-shoes.vercel.app/api/melhor-envio/callback";


        /* =========================================================
           SOLICITAR TOKEN
        ========================================================= */

        const tokenResponse =
            await fetch(
                "https://melhorenvio.com.br/oauth/token",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "User-Agent":
                            "Vellor Shoes (diogenes.l.silva@hotmail.com)"
                    },

                    body: JSON.stringify({

                        grant_type:
                            "authorization_code",

                        client_id:
                            Number(clientId),

                        client_secret:
                            clientSecret,

                        redirect_uri:
                            redirectUri,

                        code:
                            code

                    })
                }
            );


        const tokenData =
            await tokenResponse.json();


        console.log(
            "Resposta do Melhor Envio:",
            {
                ok: tokenResponse.ok,
                status: tokenResponse.status
            }
        );


        /* =========================================================
           ERRO AO OBTER TOKEN
        ========================================================= */

        if (!tokenResponse.ok) {

            console.error(
                "Erro ao solicitar token:",
                tokenData
            );

            return res.status(500).send(`

                <!DOCTYPE html>

                <html lang="pt-BR">

                <head>

                    <meta charset="UTF-8">

                    <title>
                        Erro — Vellor Shoes
                    </title>

                    <style>

                        body {
                            font-family: Arial, sans-serif;
                            background: #f5f5f7;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                        }

                        .card {
                            background: white;
                            padding: 40px;
                            border-radius: 16px;
                            text-align: center;
                            max-width: 500px;
                            box-shadow:
                                0 10px 30px
                                rgba(0,0,0,.08);
                        }

                        h1 {
                            color: #d93025;
                        }

                        p {
                            color: #666;
                        }

                    </style>

                </head>

                <body>

                    <div class="card">

                        <h1>
                            Erro na autorização
                        </h1>

                        <p>
                            Não foi possível obter o
                            token do Melhor Envio.
                        </p>

                        <p>
                            Verifique as credenciais,
                            callback e configurações
                            do aplicativo.
                        </p>

                    </div>

                </body>

                </html>

            `);

        }


        /* =========================================================
           VALIDAR TOKEN
        ========================================================= */

        if (
            !tokenData.access_token ||
            !tokenData.refresh_token
        ) {

            console.error(
                "Resposta sem tokens:",
                tokenData
            );

            return res.status(500).send(
                "O Melhor Envio não retornou os tokens esperados."
            );

        }


        /* =========================================================
           SALVAR TOKENS NO FIRESTORE
        ========================================================= */

        await db
            .collection("store_settings")
            .doc("melhor_envio")
            .set({

                provider:
                    "melhor_envio",

                accessToken:
                    tokenData.access_token,

                refreshToken:
                    tokenData.refresh_token,

                tokenType:
                    tokenData.token_type || "Bearer",

                expiresIn:
                    tokenData.expires_in || 2592000,

                authorizedAt:
                    new Date(),

                updatedAt:
                    new Date()

            });


        console.log(
            "Melhor Envio autorizado com sucesso."
        );


        /* =========================================================
           SUCESSO
        ========================================================= */

        return res.status(200).send(`

            <!DOCTYPE html>

            <html lang="pt-BR">

            <head>

                <meta charset="UTF-8">

                <meta
                    name="viewport"
                    content="width=device-width,
                             initial-scale=1.0"
                >

                <title>
                    Melhor Envio — Vellor Shoes
                </title>

                <style>

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        margin: 0;
                        min-height: 100vh;

                        display: flex;
                        align-items: center;
                        justify-content: center;

                        background: #f5f5f7;

                        font-family:
                            Arial,
                            sans-serif;

                        color: #0b0b0d;
                    }

                    .card {
                        width: 90%;
                        max-width: 500px;

                        background: #fff;

                        padding: 45px 35px;

                        border-radius: 18px;

                        text-align: center;

                        box-shadow:
                            0 15px 40px
                            rgba(0,0,0,.08);
                    }

                    .icon {
                        width: 70px;
                        height: 70px;

                        margin: 0 auto 20px;

                        border-radius: 50%;

                        display: flex;
                        align-items: center;
                        justify-content: center;

                        background: #eaf3ff;

                        color: #007bff;

                        font-size: 38px;
                        font-weight: bold;
                    }

                    h1 {
                        margin-bottom: 12px;
                    }

                    p {
                        color: #666;
                        line-height: 1.6;
                    }

                    .brand {
                        margin-top: 25px;

                        font-weight: bold;

                        color: #007bff;
                    }

                </style>

            </head>

            <body>

                <div class="card">

                    <div class="icon">
                        ✓
                    </div>

                    <h1>
                        Integração autorizada!
                    </h1>

                    <p>
                        O Melhor Envio foi conectado
                        com sucesso à Vellor Shoes.
                    </p>

                    <p>
                        A integração está pronta
                        para realizar cotações de frete.
                    </p>

                    <div class="brand">
                        Vellor Shoes
                    </div>

                </div>

            </body>

            </html>

        `);

    } catch (error) {

        console.error(
            "Erro no callback do Melhor Envio:",
            error
        );

        return res.status(500).send(
            "Erro interno ao processar a autorização do Melhor Envio."
        );

    }

}
