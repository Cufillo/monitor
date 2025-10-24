import { type NextRequest, NextResponse } from "next/server"
import { getAllSheetsData } from "@/lib/google-sheets"

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json()
    console.log("[v0] 📅 API called for REPORT date:", date)
    console.log("[v0] 🔑 Environment check:", {
      hasClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      hasSpreadsheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    })

    const data = await getAllSheetsData(date)

    console.log("[v0] ✅ Data sent to client for report date", date, ":", {
      registros: data.registros.length,
      dmas: data.dmas.length,
      naves: data.naves.length,
      rovs: data.rovs.length,
      lastUpdate: data.lastUpdate,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] ❌ API Error:", error)
    console.error("[v0] ❌ Error stack:", error.stack)
    return NextResponse.json(
      {
        error: `Error al obtener datos: ${error.message}`,
        details: error.stack,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    console.log("[v0] 🧪 Testing Google Sheets connection...")

    const testDate = new Date().toISOString().split("T")[0]
    const data = await getAllSheetsData(testDate)

    return NextResponse.json({
      success: true,
      message: "Google Sheets connection successful",
      testDate,
      dataCount: {
        registros: data.registros.length,
        dmas: data.dmas.length,
        naves: data.naves.length,
        rovs: data.rovs.length,
      },
    })
  } catch (error: any) {
    console.error("[v0] ❌ Connection test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
