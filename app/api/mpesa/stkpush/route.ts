import { NextRequest, NextResponse } from "next/server";
import {
  getAccessToken,
  darajaTimestamp,
  darajaPassword,
  DARAJA_BASE_URL,
} from "@/lib/daraja";

export async function POST(req: NextRequest) {
  try {
    const { phone, amountKes, goalSummary } = await req.json();

    const shortcode = process.env.MPESA_SHORTCODE || "174379";
    const passkey = process.env.MPESA_PASSKEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!passkey) {
      return NextResponse.json(
        {
          errorCode: "CONFIG_ERROR",
          errorMessage: "Missing MPESA_PASSKEY in environment variables.",
        },
        { status: 500 }
      );
    }

    const token = await getAccessToken();
    const timestamp = darajaTimestamp();
    const password = darajaPassword(shortcode, passkey, timestamp);

    // Format phone: strip spaces and leading +
    const formattedPhone = String(phone || "").replace(/[^0-9]/g, "");

    const callbackUrl =
      process.env.MPESA_CALLBACK_URL ||
      `${appUrl.replace(/\/$/, "")}/api/mpesa/callback`;

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.max(1, Math.round(Number(amountKes) || 1)),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: "PesaBot",
      TransactionDesc: (goalSummary ?? "Savings").slice(0, 20),
    };

    const res = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (error: any) {
    console.error("STK Push error:", error);
    return NextResponse.json(
      {
        errorCode: "STK_PUSH_FAILED",
        errorMessage: error?.message || "Failed to trigger STK Push.",
      },
      { status: 500 }
    );
  }
}
