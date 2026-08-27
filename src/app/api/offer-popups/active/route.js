import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const popups = await prisma.offerPopup.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(popups);
  } catch (err) {
    console.error("Error fetching offer popups:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}