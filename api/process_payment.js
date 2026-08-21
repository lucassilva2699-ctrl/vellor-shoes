export default async function handler(req, res) {

    // Permitir requisições do site
    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    // Responder ao preflight
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


        // Access Token do Mercado Pago
        const accessToken =
            process.env.MERCADOPAGO_ACCESS_TOKEN;


        if (!accessToken) {
            return res.status(500).json({
                error:
                    "Access Token do Mercado Pago não configurado."
            });
        }


        /*
         * Referência do pedido da Vellor.
         *
         * O pagamento será vinculado ao pedido
         * através deste identificador.
         */
        const externalReference =
            formData.external_reference ||
            null;


        const paymentBody = {

            transaction_amount:
                Number(
                    formData.transaction_amount
                ),


            description:
                formData.description ||
                "Pedido Vellor Shoes",


            payment_method_id:
                formData.payment_method_id,


            payer: {
                email:
                    formData.payer?.email,

                identification:
                    formData.payer?.identification
            }

        };


        /*
         * Vincula o pagamento ao pedido Vellor.
         */
        if (externalReference) {

            paymentBody.external_reference =
                externalReference;

        }


        /*
         * Cartão de crédito/débito.
         *
         * Esses campos só são enviados quando
         * realmente existem no formData.
         */
        if (formData.token) {

            paymentBody.token =
                formData.token;

        }


        if (formData.installments) {

            paymentBody.installments =
                Number(formData.installments);

        }


        if (formData.issuer_id) {

            paymentBody.issuer_id =
                formData.issuer_id;

        }


        /*
         * Criar pagamento no Mercado Pago.
         */
        const response = await fetch(
            "https://api.mercadopago.com/v1/payments",
            {
                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${accessToken}`,

                    "X-Idempotency-Key":
                        crypto.randomUUID()

                },

                body:
                    JSON.stringify(paymentBody)

            }
        );


        const data =
            await response.json();


        console.log(
            "Resposta Mercado Pago:",
            data
        );


        return res
            .status(response.status)
            .json(data);


    } catch (error) {

        console.error(
            "Erro ao processar pagamento:",
            error
        );


        return res.status(500).json({

            error:
                "Erro interno ao processar pagamento.",

            details:
                error.message

        });

    }

}
