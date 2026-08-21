
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(200).json({
            received: true
        });
    }

    try {

        // Inicializar Firebase Admin
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

        /*
         * O Mercado Pago pode enviar diferentes
         * formatos de notificação.
         *
         * Para pagamentos, precisamos do ID.
         */
        const paymentId =
            req.body?.data?.id ||
            req.body?.id ||
            null;

        if (!paymentId) {

            console.log(
                "Webhook recebido sem paymentId:",
                req.body
            );

            return res.status(200).json({
                received: true
            });
        }

        /*
         * Consultar o pagamento diretamente
         * na API do Mercado Pago.
         */
        const accessToken =
            process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!accessToken) {

            console.error(
                "MERCADOPAGO_ACCESS_TOKEN não configurado."
            );

            return res.status(500).json({
                error:
                    "Access Token do Mercado Pago não configurado."
            });
        }

        const response = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${accessToken}`
                }
            }
        );

        const payment =
            await response.json();

        if (!response.ok) {

            console.error(
                "Erro ao consultar pagamento:",
                payment
            );

            return res.status(500).json({
                error:
                    "Não foi possível consultar o pagamento."
            });
        }

        console.log(
            "Pagamento recebido:",
            payment
        );

        /*
         * O external_reference é o número
         * do pedido da Vellor.
         */
        const orderNumber =
            payment.external_reference;

        if (!orderNumber) {

            console.log(
                "Pagamento sem external_reference."
            );

            return res.status(200).json({
                received: true
            });
        }

        /*
         * Localizar o pedido no Firestore.
         */
        const snapshot = await db
            .collection("orders")
            .where(
                "orderNumber",
                "==",
                orderNumber
            )
            .limit(1)
            .get();

        if (snapshot.empty) {

            console.log(
                "Pedido não encontrado:",
                orderNumber
            );

            return res.status(200).json({
                received: true
            });
        }

        const orderDoc =
            snapshot.docs[0];

        /*
         * Mapear o status do Mercado Pago
         * para o status utilizado pela Vellor.
         */
        let orderStatus =
            "aguardando_pagamento";

        if (payment.status === "approved") {

            orderStatus =
                "pago";

        } else if (
            payment.status === "rejected"
        ) {

            orderStatus =
                "pagamento_recusado";

        } else if (
            payment.status === "cancelled"
        ) {

            orderStatus =
                "cancelado";

        } else if (
            payment.status === "refunded"
        ) {

            orderStatus =
                "reembolsado";

        }

        /*
         * Atualizar histórico do pedido.
         */
        const currentOrder =
            orderDoc.data();

        const currentHistory =
            Array.isArray(
                currentOrder.statusHistory
            )
                ? currentOrder.statusHistory
                : [];

        const newHistory = [
            ...currentHistory,
            {
                status:
                    orderStatus,

                paymentStatus:
                    payment.status || null,

                paymentId:
                    String(payment.id),

                date:
                    new Date().toISOString()
            }
        ];

        /*
         * Atualizar pedido.
         */
        await orderDoc.ref.update({

            status:
                orderStatus,

            paymentId:
                String(payment.id),

            paymentStatus:
                payment.status || null,

            statusHistory:
                newHistory,

            updatedAt:
                new Date().toISOString()

        });

        console.log(
            "Pedido atualizado:",
            orderNumber,
            orderStatus
        );

        return res.status(200).json({
            received: true,
            orderNumber,
            status: orderStatus
        });

    } catch (error) {

        console.error(
            "Erro no webhook Mercado Pago:",
            error
        );

        return res.status(500).json({
            error:
                "Erro interno no webhook."
        });
    }
}
