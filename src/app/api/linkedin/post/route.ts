import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { text, accessToken, linkedinId } = await req.json();

  if (!text || !text.trim()) {
    return NextResponse.json(
      { error: "Post content is required" },
      { status: 400 }
    );
  }

  if (!accessToken || !linkedinId) {
    return NextResponse.json(
      { error: "LinkedIn credentials missing" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: `urn:li:person:${linkedinId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to post to LinkedIn", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to post to LinkedIn" },
      { status: 500 }
    );
  }
}
