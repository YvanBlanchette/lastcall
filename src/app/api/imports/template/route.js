import { buildTemplate } from "@/lib/excel";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Non autorisé", { status: 401 });

  const buffer = buildTemplate();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="modele-lastcall.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
