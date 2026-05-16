import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadUrl = await convex.mutation(api.storage.generateUploadUrl, {});
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!uploadResponse.ok) {
      return NextResponse.json(
        { error: "Upload failed" },
        { status: uploadResponse.status }
      );
    }
    const { storageId } = (await uploadResponse.json()) as {
      storageId: Id<"_storage">;
    };
    const imageUrl = await convex.mutation(api.storage.saveFileUrl, {
      storageId,
    });
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Could not resolve image URL" },
        { status: 500 }
      );
    }
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Upload route error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
