import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js 16: `params` es asíncrono (Promise).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.reminder.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}
