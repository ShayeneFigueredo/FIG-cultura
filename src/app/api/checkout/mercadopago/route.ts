import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MercadoPagoConfig, PreApproval } from "mercadopago";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { message: "Token do Mercado Pago não configurado no servidor (MP_ACCESS_TOKEN)." },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preapproval = new PreApproval(client);

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // Cria requisição de assinatura recorrente no Mercado Pago
    const response = await preapproval.create({
      body: {
        reason: "Cultiva - Plano PRO Mensal (FIG AgroTech)",
        external_reference: session.user.id,
        payer_email: session.user.email || undefined,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 99.9,
          currency_id: "BRL",
        },
        back_url: `${baseUrl}/dashboard/assinatura?status=success`,
        status: "authorized",
      },
    });

    if (!response.init_point) {
      throw new Error("Não foi possível gerar a URL de pagamento do Mercado Pago.");
    }

    return NextResponse.json({ init_point: response.init_point });
  } catch (error: any) {
    console.error("Erro no checkout Mercado Pago:", error);
    return NextResponse.json(
      { message: error?.message || "Erro ao gerar assinatura do Mercado Pago." },
      { status: 500 }
    );
  }
}
