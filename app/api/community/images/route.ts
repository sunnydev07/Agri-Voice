import { NextRequest, NextResponse } from "next/server";
import { getImages, addImage, toggleLike, addComment, getUser } from "@/lib/community-store";

export async function GET() {
  const images = getImages();
  return NextResponse.json({ images });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "upload") {
    const { userId, imageUrl, caption } = body;
    const user = getUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const post = addImage({
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      imageUrl,
      caption: caption || "",
    });

    return NextResponse.json({ post });
  }

  if (action === "like") {
    const { imageId, userId } = body;
    const img = toggleLike(imageId, userId);
    if (!img) {
      return NextResponse.json({ error: "Image not found" }, { status: 400 });
    }
    return NextResponse.json({ image: img });
  }

  if (action === "comment") {
    const { imageId, userId, text } = body;
    const user = getUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const img = addComment(imageId, { userId, userName: user.name, text });
    if (!img) {
      return NextResponse.json({ error: "Image not found" }, { status: 400 });
    }
    return NextResponse.json({ image: img });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
