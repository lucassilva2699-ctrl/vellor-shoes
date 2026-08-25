export default async function handler(req, res) {

    // =========================================================
    // CORS
    // =========================================================

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


    // =========================================================
    // PREFLIGHT
    // =========================================================

    if (req.method === "OPTIONS") {

        return res
            .status(200)
            .end();

    }


    // =========================================================
    // SOMENTE POST
    // =========================================================

    if (req.method !== "POST") {

        return res
            .status(405)
            .json({
                error:
                    "Método não permitido."
            });

    }


    try {

        // =====================================================
        // DADOS RECEBIDOS
        // =====================================================

        const formData =
            req.body || {};


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


        // =====================================================
        // ACCESS TOKEN
        // =====================================================

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


        // =====================================================
        // DADOS PRINCIPAIS
        // =====================================================

        const amount =
            Number(
                formData.transaction_amount
            );

        const paymentMethodId =
            String(
                formData.payment_method_id || ""
            ).trim();

        const payer =
            formData.payer || {};

        const payerEmail =
            String(
                payer.email || ""
            ).trim();

        const externalReference =
            formData.external_reference ||
            null;


        // =====================================================
        // LOG DE DIAGNÓSTICO
        // =====================================================

        console.log(
            "Dados recebidos do Payment Brick:",
            {
                transaction_amount:
                    formData.transaction_amount,

                payment_method_id:
                    paymentMethodId,

                payer_email:
                    payerEmail,

                has_identification:
                    Boolean(
                        payer.identification?.type &&
                        payer.identification?.number
                    ),

                identification_type:
                    payer.identification?.type ||
                    null,

                has_token:
                    Boolean(
                        formData.token
                    ),

                installments:
                    formData.installments ||
                    null,

                external_reference:
                    externalReference
            }
        );


        // =====================================================
        // VALIDAÇÃO DO VALOR
        // =====================================================

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


        // =====================================================
        // VALIDAÇÃO DO MÉTODO
        // =====================================================

        if (
            !paymentMethodId
        ) {

            return res
                .status(400)
                .json({
                    error:
                        "Forma de pagamento não informada."
                });

        }


        // =====================================================
        // VALIDAÇÃO DO E-MAIL
        // =====================================================

        if (
            !payerEmail
        ) {

            return res
                .status(400)
                .json({
                    error:
                        "E-mail do pagador não informado."
                });

        }


        // =====================================================
        // CORPO BASE DO PAGAMENTO
        // =====================================================

        const paymentBody = {

            transaction_amount:
                Number(
                    amount.toFixed(2)
                ),

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


        // =====================================================
        // NOME DO PAGADOR
        // =====================================================

        if (
            payer.first_name
        ) {

            paymentBody.payer.first_name =
                String(
                    payer.first_name
                );

        }


        if (
            payer.last_name
        ) {

            paymentBody.payer.last_name =
                String(
                    payer.last_name
                );

        }


        // =====================================================
        // IDENTIFICAÇÃO DO PAGADOR
        // =====================================================

        if (
            payer.identification?.type &&
            payer.identification?.number
        ) {

            paymentBody.payer.identification = {

                type:
                    String(
                        payer.identification.type
                    ),

                number:
                    String(
                        payer.identification.number
                    ).replace(/\D/g, "")

            };

        }


        // =====================================================
        // REFERÊNCIA EXTERNA
        // =====================================================

        if (
            externalReference
        ) {

            paymentBody.external_reference =
                String(
                    externalReference
                );

        }


        // =====================================================
        // CARTÃO
        // =====================================================

        const isCard =
            Boolean(
                formData.token
            );


        if (isCard) {

            if (
                !formData.token
            ) {

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
                formData.issuer_id !== undefined &&
                formData.issuer_id !== null &&
                formData.issuer_id !== ""
            ) {

                paymentBody.issuer_id =
                    Number(
                        formData.issuer_id
                    );

            }

        }


        // =====================================================
        // PIX
        // =====================================================

        if (
            paymentMethodId === "pix"
        ) {

            /*
             * Para Pix não enviamos:
             *
             * token
             * installments
             * issuer_id
             *
             * O Mercado Pago gera o QR Code
             * na resposta do pagamento.
             */

        }


        // =====================================================
        // LOG DO PAGAMENTO
        // =====================================================

        console.log(
            "Enviando pagamento ao Mercado Pago:",
            {
                transaction_amount:
                    paymentBody.transaction_amount,

                payment_method_id:
                    paymentBody.payment_method_id,

                external_reference:
                    paymentBody.external_reference ||
                    null,

                has_token:
                    Boolean(
                        paymentBody.token
                    ),

                has_identification:
                    Boolean(
                        paymentBody.payer?.identification
                    )
            }
        );


        // =====================================================
        // CRIAR PAGAMENTO
        // =====================================================

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


        // =====================================================
        // LER RESPOSTA
        // =====================================================

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


        // =====================================================
        // LOG COMPLETO DO MERCADO PAGO
        // =====================================================

        console.log(
            "Resposta completa do Mercado Pago:",
            data
        );


        // =====================================================
        // LOG RESUMIDO
        // =====================================================

        console.log(
            "Mercado Pago:",
            {

                statusCode:
                    response.status,

                paymentId:
                    data.id ||
                    null,

                paymentStatus:
                    data.status ||
                    null,

                statusDetail:
                    data.status_detail ||
                    null,

                error:
                    data.error ||
                    null,

                message:
                    data.message ||
                    null,

                cause:
                    data.cause ||
                    null

            }
        );


        // =====================================================
        // ERRO
        // =====================================================

        if (
            !response.ok
        ) {

            return res
                .status(
                    response.status
                )
                .json({

                    error:
                        data.message ||
                        data.error ||
                        "Erro ao processar pagamento.",

                    message:
                        data.message ||
                        null,

                    cause:
                        data.cause ||
                        null,

                    status:
                        data.status ||
                        null,

                    status_detail:
                        data.status_detail ||
                        null

                });

        }


        // =====================================================
        // SUCESSO
        // =====================================================

        return res
            .status(
                response.status
            )
            .json(
                data
            );


    } catch (error) {

        console.error(
            "Erro interno ao processar pagamento:",
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
