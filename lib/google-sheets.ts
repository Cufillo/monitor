import { google } from "googleapis"

export async function getAllSheetsData(reportDate: string) {
  try {
    console.log("[v0] 🔍 Getting data for date:", reportDate)

    if (
      !process.env.GOOGLE_SHEETS_CLIENT_EMAIL ||
      !process.env.GOOGLE_SHEETS_PRIVATE_KEY ||
      !process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    ) {
      throw new Error("Missing Google Sheets credentials. Check environment variables.")
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })

    const sheets = google.sheets({ version: "v4", auth })
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    console.log("[v0] 📊 Fetching data from spreadsheet:", spreadsheetId)

    const [registrosRes, dmasRes, navesRes, rovsRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Registros!A:N",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "DMAs!A:O",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Naves!A:C",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "ROVs!A:F",
      }),
    ])

    console.log("[v0] ✅ Data fetched successfully")
    console.log("[v0] 📊 Rows:", {
      registros: registrosRes.data.values?.length || 0,
      dmas: dmasRes.data.values?.length || 0,
      naves: navesRes.data.values?.length || 0,
      rovs: rovsRes.data.values?.length || 0,
    })

    const allRegistros = processRawRegistros(registrosRes.data.values || [])
    const reportDateObj = new Date(reportDate + "T00:00:00")
    const reportDateStr = reportDateObj.toISOString().split("T")[0]

    console.log("[v0] 🔍 Looking for date:", reportDateStr)

    const matchingRegistros = allRegistros.filter((r) => {
      if (r.fecha && r.fecha instanceof Date && !isNaN(r.fecha.getTime())) {
        const registroDateStr = r.fecha.toISOString().split("T")[0]
        return registroDateStr === reportDateStr
      }
      return false
    })

    console.log("[v0] ✅ Found", matchingRegistros.length, "matching registros")

    const targetIdRegistros = matchingRegistros.map((r) => r.id_registro)

    const dmas = processDMAs(dmasRes.data.values || [], targetIdRegistros)
    const naves = processNaves(navesRes.data.values || [], targetIdRegistros)
    const rovs = processROVs(rovsRes.data.values || [], targetIdRegistros)

    console.log("[v0] ✅ Final counts:", {
      registros: matchingRegistros.length,
      dmas: dmas.length,
      naves: naves.length,
      rovs: rovs.length,
    })

    return {
      registros: matchingRegistros,
      dmas,
      naves,
      rovs,
      lastUpdate: new Date().toISOString(),
    }
  } catch (error: any) {
    console.error("[v0] ❌ Error:", error.message)
    console.error("[v0] ❌ Stack:", error.stack)
    throw error
  }
}

function processRawRegistros(values: any[][]) {
  if (!values || values.length < 2) {
    console.log("[v0] ⚠️ No registros data")
    return []
  }

  const rows = values.slice(1)
  console.log("[v0] 📝 Processing", rows.length, "registros")

  return rows.map((row) => ({
    id_registro: String(row[0] || "").trim(),
    fecha: parseDate(row[1]),
    estado_puerto_directemar: String(row[2] || "").trim(),
    estado_puerto_concesion: String(row[3] || "").trim(),
    dia_operacion: Number(row[4]) || 0,
    num_equipos: Number(row[5]) || 0,
    num_equipos_inoperativos: Number(row[6]) || 0,
    num_equipos_bombeando: Number(row[7]) || 0,
    cliente: String(row[8] || "").trim(),
    centro: String(row[9] || "").trim(),
    responsable: String(row[10] || "").trim(),
    condiciones_clima: String(row[11] || "").trim(),
    detalles: String(row[12] || "").trim(),
    archivos_clima: String(row[13] || "").trim(),
  }))
}

function processDMAs(values: any[][], targetIds: string[]) {
  if (!values || values.length < 2 || targetIds.length === 0) return []

  const rows = values.slice(1)
  return rows
    .map((row) => ({
      id_registro: String(row[0] || "").trim(),
      estado_equipo: String(row[1] || "").trim(),
      dma_numero: String(row[2] || "").trim(),
      plataforma: String(row[3] || "").trim(),
      plataforma_estado: String(row[4] || "").trim(),
      central: String(row[5] || "").trim(),
      central_estado: String(row[6] || "").trim(),
      manga: String(row[7] || "").trim(),
      manguera: String(row[8] || "").trim(),
      tobera: String(row[9] || "").trim(),
      tobera_estado: String(row[10] || "").trim(),
      estacion: String(row[11] || "").trim(),
      punto: String(row[12] || "").trim(),
      horas_bombeo: Number(row[13]) || 0,
      observaciones: String(row[14] || "").trim(),
    }))
    .filter((row) => targetIds.includes(row.id_registro))
}

function processNaves(values: any[][], targetIds: string[]) {
  if (!values || values.length < 2 || targetIds.length === 0) return []

  const rows = values.slice(1)
  return rows
    .map((row) => ({
      id_registro: String(row[0] || "").trim(),
      nave_nombre: String(row[1] || "").trim(),
      nave_observaciones: String(row[2] || "").trim(),
    }))
    .filter((row) => targetIds.includes(row.id_registro))
}

function processROVs(values: any[][], targetIds: string[]) {
  if (!values || values.length < 2 || targetIds.length === 0) return []

  const rows = values.slice(1)
  return rows
    .map((row) => ({
      id_registro: String(row[0] || "").trim(),
      rov_numero: String(row[1] || "").trim(),
      responsable: String(row[2] || "").trim(),
      estado: String(row[3] || "").trim(),
      ubicacion: String(row[4] || "").trim(),
      observaciones: String(row[5] || "").trim(),
    }))
    .filter((row) => targetIds.includes(row.id_registro))
}

function parseDate(value: any): Date | null {
  if (!value) return null

  // Excel serial number
  if (typeof value === "number" && value > 0) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000)
    return isNaN(date.getTime()) ? null : date
  }

  // String date
  if (typeof value === "string") {
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }

  return null
}
