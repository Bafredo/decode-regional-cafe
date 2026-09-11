import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const result = body?.Body?.stkCallback;

    if (result) {
      if (result.ResultCode === 0) {
        const items = result.CallbackMetadata?.Item ?? [];
        const amount = items.find((i: any) => i.Name === "Amount")?.Value;
        const receipt = items.find(
          (i: any) => i.Name === "MpesaReceiptNumber"
        )?.Value;
        const transactionDate = items.find(
          (i: any) => i.Name === "TransactionDate"
        )?.Value;
        const phoneNumber = items.find(
          (i: any) => i.Name === "PhoneNumber"
        )?.Value;

        console.log(
          `[Daraja Callback] Payment SUCCESS: KES ${amount}, Receipt: ${receipt}, Phone: ${phoneNumber}, Date: ${transactionDate}, CheckoutRequestID: ${result.CheckoutRequestID}`
        );
      } else {
        console.log(
          `[Daraja Callback] Payment NOT COMPLETED: ResultCode ${result.ResultCode} — ${result.ResultDesc}`
        );
      }
    } else {
      console.log("[Daraja Callback] Received empty or unrecognized callback body:", body);
    }
  } catch (err) {
    console.error("[Daraja Callback] Failed to process callback:", err);
  }

  // Always return HTTP 200 so Safaricom does not retry indefinitely
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
