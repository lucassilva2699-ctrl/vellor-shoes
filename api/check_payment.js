export default async function handler(req, res) {

    if (req.method !== "GET") {

        return res.status(405).json({
            error: "Método não permitido."
        });

    }

    try {

        const paymentId = req.query.id;

        if (!paymentId) {

            return res.status(400).json({
                error: "ID do pagamento não informado."
            });

        }

        const accessToken =
            process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!accessToken) {

            return res.status(500).json({
                error:
                    "Access Token do Mercado Pago não configurado."
            });

        }

        const response = await fetch(
            `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${accessToken}`
                }
            }
        );

        const data = await response.json();

        console.log(
            "Mercado Pago - consulta:",
            data.id,
            data.status,
            data.status_detail
        );

        return res.status(response.status).json({

            id:
                data.id || null,

            status:
                data.status || null,

            status_detail:
                data.status_detail || null,

            date_created:
                data.date_created || null,

            date_approved:
                data.date_approved || null

        });

    } catch (error) {

        console.error(
            "Erro ao consultar pagamento:",
            error
        );

        return res.status(500).json({

            error:
                "Erro interno ao consultar pagamento.",

            details:
                error.message

        });

    }

}
