import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, PreApproval, Payment } from "mercadopago";

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ message: "MP_ACCESS_TOKEN não configurado." }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    const type = body.type || body.action || url.searchParams.get("type") || url.searchParams.get("topic");
    const dataId = body.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id");

    if (!dataId) {
      return NextResponse.json({ message: "ID de notificação ausente." }, { status: 200 });
    }

    if (type === "subscription_preapproval" || type === "preapproval") {
      const preapprovalApi = new PreApproval(client);
      const preapprovalData = await preapprovalApi.get({ id: dataId });

      const userId = preapprovalData.external_reference;
      const mpStatus = preapprovalData.status; // authorized, paused, cancelled

      if (userId) {
        let status = "ACTIVE";
        if (mpStatus === "cancelled") status = "CANCELED";
        else if (mpStatus === "paused") status = "PAST_DUE";

        // Expiração estimada em 30 dias a partir da autorização
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + 30);

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: status,
            mpPreapprovalId: preapprovalData.id,
            mpCustomerId: preapprovalData.payer_id ? String(preapprovalData.payer_id) : undefined,
            subscriptionEndsAt: endsAt,
          },
        });
      }
    } else if (type === "payment") {
      const paymentApi = new Payment(client);
      const paymentData = await paymentApi.get({ id: dataId });

      const userId = paymentData.external_reference;
      const paymentStatus = paymentData.status;

      if (userId && paymentStatus === "approved") {
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + 30);

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionEndsAt: endsAt,
          },
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Erro no webhook Mercado Pago:", error);
    return NextResponse.json({ error: error?.message || "Erro interno" }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Webhook Mercado Pago Ativo" });
}
