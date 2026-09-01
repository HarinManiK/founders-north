import { GET as getFeed } from "@/app/feed.xml/route";

export const dynamic = "force-dynamic";

export async function GET() {
  return getFeed();
}
