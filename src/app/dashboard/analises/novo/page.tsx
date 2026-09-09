import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import NovaAnaliseForm, { type FieldOption } from "@/components/analises/NovaAnaliseForm";

export default async function NovaAnalisePage({
  searchParams,
}: {
  searchParams: Promise<{ fieldId?: string }>;
}) {
  const { fieldId } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const fields = await prisma.field.findMany({
    where: {
      property: { userId: session.user.id },
    },
    include: { property: true },
    orderBy: [{ property: { name: "asc" } }, { name: "asc" }],
  });

  const fieldOptions: FieldOption[] = fields.map((f) => ({
    id: f.id,
    name: f.name,
    crop: f.crop,
    propertyName: f.property.name,
    city: f.property.city,
    state: f.property.state,
  }));

  return <NovaAnaliseForm fields={fieldOptions} defaultFieldId={fieldId} />;
}
