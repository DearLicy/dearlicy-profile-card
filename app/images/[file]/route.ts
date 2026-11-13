import { isAdmin } from "@/lib/auth";
import { getImage, readImageBytes, validImageId } from "@/lib/images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const match = String(file).match(/^([0-9a-f-]{36})\.webp$/i);
  const id = match ? validImageId(match[1]) : "";
  if (!id) return new Response("Not found", { status: 404 });
  const admin = await isAdmin();
  const image = getImage(id, admin);
  if (!image) return new Response("Not found", { status: 404 });
  try {
    const buffer = await readImageBytes(image);
    return new Response(buffer, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": image.published
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
        "X-Content-Type-Options": "nosniff",
        ...(image.published ? { "Access-Control-Allow-Origin": "*" } : {}),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
