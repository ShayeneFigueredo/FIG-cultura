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

      const externalRef = preapprovalData.external_reference;
      const payerEmail = (preapprovalData as any).payer_email || (preapprovalData as any).payer?.email;
      const mpStatus = preapprovalData.status; // authorized, paused, cancelled

      // Buscar usuário pelo ID ou pelo E-mail do pagador
      let targetUser = null;
      if (externalRef) {
        targetUser = await prisma.user.findUnique({ where: { id: externalRef } });
      }
      if (!targetUser && payerEmail) {
        targetUser = await prisma.user.findUnique({ where: { email: payerEmail.toLowerCase().trim() } });
      }

      if (targetUser) {
        let status = "ACTIVE";
        if (mpStatus === "cancelled") status = "CANCELED";
        else if (mpStatus === "paused") status = "PAST_DUE";

        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + 30);

        await prisma.user.update({
          where: { id: targetUser.id },
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

      const externalRef = paymentData.external_reference;
      const payerEmail = paymentData.payer?.email;
      const paymentStatus = paymentData.status;

      let targetUser = null;
      if (externalRef) {
        targetUser = await prisma.user.findUnique({ where: { id: externalRef } });
      }
      if (!targetUser && payerEmail) {
        targetUser = await prisma.user.findUnique({ where: { email: payerEmail.toLowerCase().trim() } });
      }

      if (targetUser && (paymentStatus === "approved" || paymentStatus === "authorized")) {
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + 30);

        await prisma.user.update({
          where: { id: targetUser.id },
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
