export default async function handler(req, res) {

    /* =========================================================
       CORS
    ========================================================= */

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


    /* =========================================================
       PREFLIGHT
    ========================================================= */

    if (req.method === "OPTIONS") {

        return res
            .status(200)
            .end();

    }


    /* =========================================================
       SOMENTE POST
    ========================================================= */

    if (req.method !== "POST") {

        return res
            .status(405)
            .json({
                error:
                    "Método não permitido."
            });

    }


    try {

        /* =====================================================
           DADOS RECEBIDOS
        ===================================================== */

        const formData =
            req.body;


        if (
            !formData ||
            typeof formData !== "object"
        ) {

            return res
                .status(400)
                .json({
                    error:
                        "Dados do pagamento não recebidos."
                });

        }


        /* =====================================================
           ACCESS TOKEN
        ===================================================== */

        const accessToken =
            process.env.MERCADOPAGO_ACCESS_TOKEN;


        if (!accessToken) {

            console.error(
                "MERCADOPAGO_ACCESS_TOKEN não configurado."
            );

            return res
                .status(500)
                .json({
                    error:
                        "Access Token do Mercado Pago não configurado."
                });

        }


        /* =====================================================
           DADOS PRINCIPAIS
        ===================================================== */

        const amount =
            Number(
                formData.transaction_amount
            );

        const paymentMethodId =
            formData.payment_method_id;

        const payerEmail =
            formData.payer?.email;

        const externalReference =
            formData.external_reference ||
            null;


        /* =====================================================
           VALIDAÇÕES BÁSICAS
        ===================================================== */

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res
                .status(400)
                .json({
                    error:
                        "Valor do pagamento inválido."
                });

        }


        if (
            !paymentMethodId ||
            typeof paymentMethodId !== "string"
        ) {

            return res
                .status(400)
                .json({
                    error:
                        "Forma de pagamento não informada."
                });

        }


        if (
            !payerEmail ||
            typeof payerEmail !== "string"
        ) {

            return res
                .status(400)
                .json({
                    error:
                        "E-mail do pagador não informado."
                });

        }


        /* =====================================================
           CORPO DO PAGAMENTO
        ===================================================== */

        const paymentBody = {

            transaction_amount:
                amount,

            description:
                formData.description ||
                "Pedido Vellor Shoes",

            payment_method_id:
                paymentMethodId,

            payer: {

                email:
                    payerEmail

            }

        };


        /* =====================================================
           IDENTIFICAÇÃO DO PAGADOR
        ===================================================== */

        if (
            formData.payer?.identification?.type &&
            formData.payer?.identification?.number
        ) {

            paymentBody.payer.identification = {

                type:
                    formData.payer.identification.type,

                number:
                    formData.payer.identification.number

            };

        }


        /* =====================================================
           NOME DO PAGADOR
        ===================================================== */

        if (
            formData.payer?.first_name
        ) {

            paymentBody.payer.first_name =
                formData.payer.first_name;

        }


        if (
            formData.payer?.last_name
        ) {

            paymentBody.payer.last_name =
                formData.payer.last_name;

        }


        /* =====================================================
           REFERÊNCIA DO PEDIDO
        ===================================================== */

        if (externalReference) {

            paymentBody.external_reference =
                String(
                    externalReference
                );

        }


        /* =====================================================
           CARTÃO
        ===================================================== */

        const isCard =
            Boolean(
                formData.token
            ) ||
            (
                paymentMethodId !== "pix" &&
                Boolean(
                    formData.installments
                )
            );


        if (isCard) {

            if (!formData.token) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Token do cartão não recebido."
                    });

            }


            const installments =
                Number(
                    formData.installments
                );


            if (
                !Number.isInteger(
                    installments
                ) ||
                installments < 1
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Número de parcelas inválido."
                    });

            }


            paymentBody.token =
                formData.token;

            paymentBody.installments =
                installments;


            if (
                formData.issuer_id
            ) {

                paymentBody.issuer_id =
                    Number(
                        formData.issuer_id
                    );

            }

        }


        /* =====================================================
           PIX
        ===================================================== */

        if (
            paymentMethodId === "pix"
        ) {

            /*
             * Para Pix não enviamos token,
             * installments ou issuer_id.
             *
             * O Mercado Pago gera os dados
             * do QR Code na resposta.
             */

        }


        /* =====================================================
           LOG
           Não registramos token do cartão.
        ===================================================== */

        console.log(
            "Enviando pagamento ao Mercado Pago:",
            {
                transaction_amount:
                    paymentBody.transaction_amount,

                payment_method_id:
                    paymentBody.payment_method_id,

                external_reference:
                    paymentBody.external_reference || null,

                has_token:
                    Boolean(
                        paymentBody.token
                    )
            }
        );


        /* =====================================================
           CRIAR PAGAMENTO
        ===================================================== */

        const response =
            await fetch(
                "https://api.mercadopago.com/v1/payments",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${accessToken}`,

                        "X-Idempotency-Key":
                            crypto.randomUUID()

                    },

                    body:
                        JSON.stringify(
                            paymentBody
                        )

                }
            );


        const responseText =
            await response.text();


        let data;


        try {

            data =
                JSON.parse(
                    responseText
                );

        } catch {

            data = {

                error:
                    "Resposta inválida do Mercado Pago.",

                details:
                    responseText

            };

        }


        /* =====================================================
           LOG DA RESPOSTA
        ===================================================== */

        console.log(
            "Mercado Pago:",
            {
                statusCode:
                    response.status,

                paymentId:
                    data.id || null,

                paymentStatus:
                    data.status || null,

                statusDetail:
                    data.status_detail || null
            }
        );


        /* =====================================================
           DEVOLVER RESPOSTA ORIGINAL
        ===================================================== */

        return res
            .status(
                response.status
            )
            .json(
                data
            );


    } catch (error) {

        console.error(
            "Erro ao processar pagamento:",
            error
        );


        return res
            .status(500)
            .json({

                error:
                    "Erro interno ao processar pagamento.",

                details:
                    error.message

            });

    }

}
