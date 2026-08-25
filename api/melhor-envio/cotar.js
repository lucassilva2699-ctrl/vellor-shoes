import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export default async function handler(req, res) {

    try {

        // =========================================================
        // FIREBASE ADMIN
        // =========================================================

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


        // =========================================================
        // MÉTODO
        // =========================================================

        if (req.method !== "POST") {

            return res.status(405).json({
                error: "Método não permitido."
            });

        }


        // =========================================================
        // CREDENCIAIS
        // =========================================================

        const clientId =
            process.env.MELHOR_ENVIO_CLIENT_ID;

        const clientSecret =
            process.env.MELHOR_ENVIO_CLIENT_SECRET;


        if (!clientId || !clientSecret) {

            console.error(
                "Credenciais do Melhor Envio não configuradas."
            );

            return res.status(500).json({
                error:
                    "Credenciais do Melhor Envio não configuradas."
            });

        }


        // =========================================================
        // DADOS RECEBIDOS
        // =========================================================

        const body = req.body || {};

        const destinationPostalCode =
            String(
                body.postalCode || ""
            ).replace(/\D/g, "");

        const items =
            Array.isArray(body.items)
                ? body.items
                : [];


        // =========================================================
        // VALIDAR CEP
        // =========================================================

        if (
            destinationPostalCode.length !== 8
        ) {

            return res.status(400).json({
                error:
                    "CEP de destino inválido."
            });

        }


        // =========================================================
        // VALIDAR CARRINHO
        // =========================================================

        if (!items.length) {

            return res.status(400).json({
                error:
                    "Nenhum produto informado para calcular o frete."
            });

        }


        // =========================================================
        // ORIGEM DA VELLOR SHOES
        // =========================================================

        const originPostalCode =
            "04829410";


        // =========================================================
        // BUSCAR PRODUTOS NO FIRESTORE
        // =========================================================

        const products = [];


        for (const item of items) {

            const productId =
                String(
                    item.id || ""
                ).trim();

            const quantity =
                Number(
                    item.quantity || 1
                );


            if (!productId) {

                return res.status(400).json({
                    error:
                        "Produto sem identificação."
                });

            }


            if (
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {

                return res.status(400).json({
                    error:
                        "Quantidade de produto inválida."
                });

            }


            const productRef =
                db
                    .collection("products")
                    .doc(productId);


            const productSnap =
                await productRef.get();


            if (!productSnap.exists) {

                return res.status(404).json({
                    error:
                        `Produto não encontrado: ${productId}`
                });

            }


            const product =
                productSnap.data();


            // =====================================================
            // DIMENSÕES
            // =====================================================

            const width =
                Number(product.width || 0);

            const height =
                Number(product.height || 0);

            const length =
                Number(product.length || 0);

            const weight =
                Number(product.weight || 0);


            if (
                width <= 0 ||
                height <= 0 ||
                length <= 0 ||
                weight <= 0
            ) {

                return res.status(400).json({
                    error:
                        `O produto "${product.name || productId}" não possui peso ou dimensões válidas para cálculo do frete.`
                });

            }


            // =====================================================
            // PREÇO
            // =====================================================

            const price =
                Number(
                    product.promotion === true &&
                    Number(product.promotionalPrice || 0) > 0
                        ? product.promotionalPrice
                        : product.price || 0
                );


            if (price <= 0) {

                return res.status(400).json({
                    error:
                        `O produto "${product.name || productId}" não possui preço válido.`
                });

            }


            // =====================================================
            // PRODUTO PARA O MELHOR ENVIO
            // =====================================================

            products.push({

                id:
                    productId,

                width:
                    width,

                height:
                    height,

                length:
                    length,

                weight:
                    weight,

                insurance_value:
                    Number(
                        price.toFixed(2)
                    ),

                quantity:
                    quantity

            });

        }


        // =========================================================
        // BUSCAR TOKEN
        // =========================================================

        const settingsRef =
            db
                .collection("store_settings")
                .doc("melhor_envio");


        const settingsSnap =
            await settingsRef.get();


        if (!settingsSnap.exists) {

            return res.status(500).json({
                error:
                    "A integração com o Melhor Envio ainda não foi autorizada."
            });

        }


        let settings =
            settingsSnap.data();


        let accessToken =
            settings.accessToken;

        let refreshToken =
            settings.refreshToken;


        if (!accessToken) {

            return res.status(500).json({
                error:
                    "Token do Melhor Envio não encontrado."
            });

        }


        // =========================================================
        // FUNÇÃO PARA FAZER A COTAÇÃO
        // =========================================================

        async function calculateShipping(token) {

            return await fetch(
                "https://melhorenvio.com.br/api/v2/me/shipment/calculate",
                {

                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json",

                        "Content-Type":
                            "application/json",

                        "User-Agent":
                            "Vellor Shoes (diogenes.l.silva@hotmail.com)"

                    },

                    body: JSON.stringify({

                        from: {

                            postal_code:
                                originPostalCode

                        },

                        to: {

                            postal_code:
                                destinationPostalCode

                        },

                        products:
                            products,

                        options: {

                            receipt:
                                false,

                            own_hand:
                                false

                        }

                    })

                }
            );

        }


        // =========================================================
        // PRIMEIRA TENTATIVA
        // =========================================================

        let shippingResponse =
            await calculateShipping(
                accessToken
            );


        // =========================================================
        // TOKEN EXPIRADO
        // =========================================================

        if (
            shippingResponse.status === 401
        ) {

            if (!refreshToken) {

                return res.status(401).json({
                    error:
                        "O token do Melhor Envio expirou e não existe refresh token disponível."
                });

            }


            console.log(
                "Token do Melhor Envio expirado. Renovando..."
            );


            const refreshResponse =
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
                                "refresh_token",

                            client_id:
                                Number(clientId),

                            client_secret:
                                clientSecret,

                            refresh_token:
                                refreshToken

                        })

                    }
                );


            const refreshData =
                await refreshResponse.json();


            if (!refreshResponse.ok) {

                console.error(
                    "Erro ao renovar token:",
                    refreshData
                );

                return res.status(401).json({
                    error:
                        "Não foi possível renovar a autorização do Melhor Envio."
                });

            }


            accessToken =
                refreshData.access_token;

            refreshToken =
                refreshData.refresh_token;


            // =====================================================
            // SALVAR NOVOS TOKENS
            // =====================================================

            await settingsRef.set({

                ...settings,

                accessToken:
                    accessToken,

                refreshToken:
                    refreshToken,

                tokenType:
                    refreshData.token_type ||
                    "Bearer",

                expiresIn:
                    refreshData.expires_in ||
                    2592000,

                updatedAt:
                    new Date()

            });


            console.log(
                "Token do Melhor Envio renovado com sucesso."
            );


            // =====================================================
            // TENTAR COTAÇÃO NOVAMENTE
            // =====================================================

            shippingResponse =
                await calculateShipping(
                    accessToken
                );

        }


        // =========================================================
        // LER RESPOSTA
        // =========================================================

        const shippingData =
            await shippingResponse.json();


        // =========================================================
        // ERRO DA API
        // =========================================================

        if (!shippingResponse.ok) {

            console.error(
                "Erro na cotação do Melhor Envio:",
                shippingData
            );

            return res.status(
                shippingResponse.status
            ).json({

                error:
                    "Não foi possível calcular o frete.",

                details:
                    shippingData

            });

        }


        // =========================================================
        // NORMALIZAR RESULTADOS
        // =========================================================

        const results =
            Array.isArray(shippingData)
                ? shippingData
                : [];


        const shippingOptions =
            results
                .filter(
                    option =>
                        option &&
                        (
                            option.custom_price !== undefined ||
                            option.price !== undefined
                        )
                )
                .map(option => ({

                    id:
                        option.id || null,

                    name:
                        option.name ||
                        option.company?.name ||
                        "Transportadora",

                    company:
                        option.company?.name ||
                        null,

                    price:
                        Number(
                            option.custom_price ??
                            option.price ??
                            0
                        ),

                    deliveryTime:
                        Number(
                            option.custom_delivery_time ??
                            option.delivery_time ??
                            0
                        ),

                    deliveryRange:
                        option.delivery_range || null,

                    currency:
                        "BRL"

                }))
                .filter(
                    option =>
                        option.price > 0
                );


        // =========================================================
        // RESPOSTA
        // =========================================================

        return res.status(200).json({

            success:
                true,

            originPostalCode:
                originPostalCode,

            destinationPostalCode:
                destinationPostalCode,

            options:
                shippingOptions

        });


    } catch (error) {

        console.error(
            "Erro interno na cotação do Melhor Envio:",
            error
        );

        return res.status(500).json({
            error:
                "Erro interno ao calcular o frete."
        });

    }

}
