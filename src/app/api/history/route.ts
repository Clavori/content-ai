import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const history = await db.contentHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ history });
  } catch (error: unknown) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      await db.contentHistory.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Item removido." });
    }

    await db.contentHistory.deleteMany();
    return NextResponse.json({ success: true, message: "Histórico limpo." });
  } catch (error: unknown) {
    console.error("Error deleting history:", error);
    return NextResponse.json(
      { error: "Erro ao deletar histórico." },
      { status: 500 }
    );
  }
}
