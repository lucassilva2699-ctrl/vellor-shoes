module.exports = async function handler(req, res) {

    // Permitir requisições do site
    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    // Responder ao preflight
    if (req.method === "OPTIONS") {

        return res
            .status(200)
            .end();

    }


    // Aceitar somente GET
    if (req.method !== "GET") {

        return res
            .status(405)
            .json({
                error:
                    "Método não permitido."
            });

    }


    try {

        const paymentId =
            req.query.id;


        // Verificar se recebeu o ID
        if (!paymentId) {

            return res
                .status(400)
                .json({
                    error:
                        "ID do pagamento não informado."
                });

        }


        // Access Token de produção
        const accessToken =
            process.env.MERCADOPAGO_ACCESS_TOKEN;


        if (!accessToken) {

            return res
                .status(500)
                .json({
                    error:
                        "Access Token do Mercado Pago não configurado."
                });

        }


        /*
         * Consultar o pagamento diretamente
         * na API do Mercado Pago.
         */
        const response =
            await fetch(
                `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`
                {
                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${accessToken}`,

                    }

                }
            );


        const data =
            await response.json();


        console.log(
            "Consulta Mercado Pago:",
            data
        );


        return res
            .status(response.status)
            .json({

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


        return res
            .status(500)
            .json({

                error:
                    "Erro interno ao consultar pagamento.",

                details:
                    error.message

            });

    }

}
