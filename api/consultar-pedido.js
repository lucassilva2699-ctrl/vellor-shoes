import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export default async function handler(req, res) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método não permitido."
        });
    }

    try {

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

        const {
            orderNumber,
            phone
        } = req.body || {};

        if (!orderNumber || !phone) {
            return res.status(400).json({
                error:
                    "Número do pedido e celular são obrigatórios."
            });
        }

        const normalizedOrder =
            String(orderNumber)
                .trim()
                .toUpperCase();

        const normalizedPhone =
            String(phone)
                .replace(/\D/g, "");

        const snapshot = await db
            .collection("orders")
            .where(
                "orderNumber",
                "==",
                normalizedOrder
            )
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({
                error:
                    "Pedido não encontrado."
            });
        }

        const order =
            snapshot.docs[0].data();

        const storedPhone =
            String(
                order.customer?.phone || ""
            ).replace(/\D/g, "");

        if (storedPhone !== normalizedPhone) {
            return res.status(404).json({
                error:
                    "Pedido não encontrado."
            });
        }

        return res.status(200).json({

            success: true,

            order: {
                orderNumber:
                    order.orderNumber,

               status:
    order.status ||
    (
        order.paymentStatus === "approved"
            ? "pagamento_confirmado"
            : "aguardando_pagamento"
    ),
                statusHistory:
                    Array.isArray(
                        order.statusHistory
                    )
                        ? order.statusHistory
                        : [],

                createdAt:
                    order.createdAt || null,

                shipping: {
                    type:
                        order.shipping?.type || null,

                    label:
                        order.shipping?.label || null
                }
            }
        });

    } catch (error) {

        console.error(
            "Erro ao consultar pedido:",
            error
        );

        return res.status(500).json({
            error:
                "Erro interno ao consultar pedido."
        });
    }
}
