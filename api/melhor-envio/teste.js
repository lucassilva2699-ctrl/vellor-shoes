export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Método não permitido."
        });
    }

    try {

        const response = await fetch(
            "https://vellor-shoes.vercel.app/api/melhor-envio/cotar",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    postalCode: "01001000",

                    items: [
                        {
                            id: "rn40Gp7qWya5iU2MvTzB",
                            quantity: 1
                        }
                    ]

                })
            }
        );


        const data = await response.json();


        return res.status(
            response.status
        ).json(data);


    } catch (error) {

        console.error(
            "Erro no teste:",
            error
        );

        return res.status(500).json({

            success: false,

            error:
                "Erro ao executar teste.",

            details:
                error.message

        });

    }

}
