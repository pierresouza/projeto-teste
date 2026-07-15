import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId, targetUserId, sessionid, csrftoken } = await req.json();

    if (!userId || !targetUserId || !sessionid) {
      return NextResponse.json(
        { error: "Parâmetros de autenticação ou ID de destino ausentes." },
        { status: 400 }
      );
    }

    const url = `https://www.instagram.com/api/v1/friendships/destroy/${targetUserId}/`;
    
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRFToken": csrftoken || "",
      "X-IG-App-ID": "936619743392459",
      "X-Requested-With": "XMLHttpRequest",
      "Cookie": `ds_user_id=${userId}; sessionid=${sessionid}; csrftoken=${csrftoken || ""}`
    };

    const body = new URLSearchParams();
    body.append("user_id", targetUserId);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: body.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Erro na API do Instagram (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Erro no proxy de unfollow do Instagram:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
