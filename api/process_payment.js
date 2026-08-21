export default async function handler(req, res) {
    // Permitir requisições do site
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    // Responder ao preflight do navegador
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // Aceitar somente POST
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método não permitido."
        });
    }

    try {
        const formData = req.body;

        if (!formData) {
            return res.status(400).json({
                error: "Dados do pagamento não recebidos."
            });
        }

        const accessToken =
            process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!accessToken) {
            return res.status(500).json({
                error: "Access Token do Mercado Pago não configurado."
            });
        }

        const response = await fetch(
            "https://api.mercadopago.com/v1/payments",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${accessToken}`,

                    "X-Idempotency-Key":
                        crypto.randomUUID()
                },

                body: JSON.stringify({
                    transaction_amount:
                        Number(formData.transaction_amount),

                    token:
                        formData.token,

                    description:
                        formData.description ||
                        "Pedido Vellor Shoes",

                    installments:
                        Number(formData.installments || 1),

                    payment_method_id:
                        formData.payment_method_id,

                    issuer_id:
                        formData.issuer_id,

                    payer: {
                        email:
                            formData.payer?.email,

                        identification:
                            formData.payer?.identification
                    }
                })
            }
        );

        const data = await response.json();

        return res.status(response.status).json(data);

    } catch (error) {

        console.error(
            "Erro ao processar pagamento:",
            error
        );

        return res.status(500).json({
            error:
                "Erro interno ao processar pagamento."
        });
    }
}