import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function isAuthorizedAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return false;

  const role = (session.user.role || "").toUpperCase();
  const isAdmin = role === "ADMIN" || session.user.isAdmin === true;
  return isAdmin;
}

// GET all popups (admin)
export async function GET() {
  try {
    const isAdmin = await isAuthorizedAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const popups = await prisma.offerPopup.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(Array.isArray(popups) ? popups : []);
  } catch (err) {
    console.error("GET /api/offer-popups error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// CREATE popup
export async function POST(req) {
  try {
    const isAdmin = await isAuthorizedAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { title, imageUrl, link, active, sortOrder } = await req.json();

    if (!title || !imageUrl) {
      return NextResponse.json({ error: "Title and image are required" }, { status: 400 });
    }

    const popup = await prisma.offerPopup.create({
      data: {
        title,
        imageUrl,
        link: link || null,
        active: active ?? true,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    return NextResponse.json(popup, { status: 201 });
  } catch (err) {
    console.error("POST /api/offer-popups error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE popup
export async function DELETE(req) {
  try {
    const isAdmin = await isAuthorizedAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.offerPopup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/offer-popups error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// UPDATE popup (toggle active, edit)
export async function PUT(req) {
  try {
    const isAdmin = await isAuthorizedAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const popup = await prisma.offerPopup.update({
      where: { id },
      data,
    });

    return NextResponse.json(popup);
  } catch (err) {
    console.error("PUT /api/offer-popups error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}