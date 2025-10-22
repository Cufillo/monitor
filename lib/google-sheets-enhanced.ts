import { google } from "googleapis"

export async function getAllSheetsData(date: string) {
  try {
    console.log("[v0] 🔍 Fetching data for date:", date)

    console.log("[v0] Checking credentials:", {
      hasEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      hasKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      hasSpreadsheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    })

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })

    const sheets = google.sheets({ version: "v4", auth })
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    console.log("[v0] Fetching from spreadsheet:", spreadsheetId)

    // Obtener datos de todas las hojas con manejo de errores individual
    const results = await Promise.allSettled([
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Registros!A:N",
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "DMAs!A:O",
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Naves!A:C",
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "ROVs!A:F",
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      }),
    ])

    // Procesar resultados
    const [registrosRes, dmasRes, navesRes, rovsRes] = results

    const registros =
      registrosRes.status === "fulfilled" ? processRegistros(registrosRes.value.data.values || [], date) : []

    console.log(
      "[v0] Registros raw data:",
      registrosRes.status === "fulfilled" ? registrosRes.value.data.values?.slice(0, 3) : "failed",
    )
    console.log("[v0] Registros processed:", registros)

    const dmas = dmasRes.status === "fulfilled" ? processDMAs(dmasRes.value.data.values || [], date) : []

    console.log(
      "[v0] DMAs raw data:",
      dmasRes.status === "fulfilled" ? dmasRes.value.data.values?.slice(0, 3) : "failed",
    )
    console.log("[v0] DMAs processed:", dmas)

    const naves = navesRes.status === "fulfilled" ? processNaves(navesRes.value.data.values || [], date) : []

    console.log(
      "[v0] Naves raw data:",
      navesRes.status === "fulfilled" ? navesRes.value.data.values?.slice(0, 3) : "failed",
    )
    console.log("[v0] Naves processed:", naves)

    const rovs = rovsRes.status === "fulfilled" ? processROVs(rovsRes.value.data.values || [], date) : []

    console.log(
      "[v0] ROVs raw data:",
      rovsRes.status === "fulfilled" ? rovsRes.value.data.values?.slice(0, 3) : "failed",
    )
    console.log("[v0] ROVs processed:", rovs)

    console.log("[v0] 📊 Data processed:", {
      registros: registros.length,
      dmas: dmas.length,
      naves: naves.length,
      rovs: rovs.length,
      targetDate: date,
    })

    return {
      registros,
      dmas,
      naves,
      rovs,
      lastUpdate: new Date().toISOString(),
      errors: results.filter((r) => r.status === "rejected").map((r) => r.reason?.message),
    }
  } catch (error) {
    console.error("[v0] ❌ Error fetching Google Sheets data:", error)
    throw error
  }
}

function processRegistros(values: any[][], targetDate: string) {
  if (!values || values.length < 2) {
    console.log("[v0] No registros data or insufficient rows")
    return []
  }

  console.log("[v0] Processing registros, total rows:", values.length - 1)
  console.log("[v0] Target date:", targetDate)
  console.log("[v0] First data row:", values[1])

  const rows = values.slice(1)

  const processed = rows
    .map((row) => ({
      id_registro: row[0] || "",
      fecha: row[1] || "",
      estado_puerto_directemar: row[2] || "",
      estado_puerto_concesion: row[3] || "",
      dia_operacion: Number.parseInt(row[4]) || 0,
      num_equipos: Number.parseInt(row[5]) || 0,
      num_equipos_inoperativos: Number.parseInt(row[6]) || 0,
      num_equipos_bombeando: Number.parseInt(row[7]) || 0,
      cliente: row[8] || "",
      centro: row[9] || "",
      responsable: row[10] || "",
      condiciones_clima: row[11] || "",
      detalles: row[12] || "",
      archivos_clima: row[13] || "",
    }))
    .filter((row) => {
      if (row.fecha) {
        try {
          const rowDate = new Date(row.fecha).toISOString().split("T")[0]
          console.log("[v0] Comparing dates:", { rowDate, targetDate, match: rowDate === targetDate })
          return rowDate === targetDate
        } catch (e) {
          console.log("[v0] Error parsing date:", row.fecha, e)
          return false
        }
      }
      return false
    })

  console.log("[v0] Filtered registros:", processed.length)
  return processed
}

function processDMAs(values: any[][], targetDate: string) {
  if (!values || values.length < 2) {
    console.log("[v0] No DMAs data or insufficient rows")
    return []
  }

  console.log("[v0] Processing DMAs, total rows:", values.length - 1)
  console.log("[v0] Target date:", targetDate)
  console.log("[v0] First data row:", values[1])

  const rows = values.slice(1)

  const processed = rows
    .map((row) => ({
      id_registro: row[0] || "",
      estado_equipo: row[1] || "",
      dma_numero: row[2] || "",
      plataforma: row[3] || "",
      plataforma_estado: row[4] || "",
      central: row[5] || "",
      central_estado: row[6] || "",
      manga: row[7] || "",
      manguera: row[8] || "",
      tobera: row[9] || "",
      tobera_estado: row[10] || "",
      estacion: row[11] || "",
      punto: row[12] || "",
      horas_bombeo: Number.parseFloat(row[13]) || 0,
      observaciones: row[14] || "",
    }))
    .filter((row) => {
      if (row.id_registro) {
        const dateFromId = targetDate.replace(/-/g, "")
        console.log("[v0] Comparing id_registro with date:", {
          id_registro: row.id_registro,
          dateFromId,
          match: row.id_registro.includes(dateFromId),
        })
        return row.id_registro.includes(dateFromId)
      }
      return false
    })

  console.log("[v0] Filtered DMAs:", processed.length)
  return processed
}

function processNaves(values: any[][], targetDate: string) {
  if (!values || values.length < 2) {
    console.log("[v0] No Naves data or insufficient rows")
    return []
  }

  console.log("[v0] Processing Naves, total rows:", values.length - 1)
  console.log("[v0] Target date:", targetDate)
  console.log("[v0] First data row:", values[1])

  const rows = values.slice(1)

  const processed = rows
    .map((row) => ({
      id_registro: row[0] || "",
      nave_nombre: row[1] || "",
      nave_observaciones: row[2] || "",
    }))
    .filter((row) => {
      if (row.id_registro) {
        const dateFromId = targetDate.replace(/-/g, "")
        console.log("[v0] Comparing id_registro with date:", {
          id_registro: row.id_registro,
          dateFromId,
          match: row.id_registro.includes(dateFromId),
        })
        return row.id_registro.includes(dateFromId)
      }
      return false
    })

  console.log("[v0] Filtered Naves:", processed.length)
  return processed
}

function processROVs(values: any[][], targetDate: string) {
  if (!values || values.length < 2) {
    console.log("[v0] No ROVs data or insufficient rows")
    return []
  }

  console.log("[v0] Processing ROVs, total rows:", values.length - 1)
  console.log("[v0] Target date:", targetDate)
  console.log("[v0] First data row:", values[1])

  const rows = values.slice(1)

  const processed = rows
    .map((row) => ({
      id_registro: row[0] || "",
      rov_numero: row[1] || "",
      responsable: row[2] || "",
      estado: row[3] || "",
      ubicacion: row[4] || "",
      observaciones: row[5] || "",
    }))
    .filter((row) => {
      if (row.id_registro) {
        const dateFromId = targetDate.replace(/-/g, "")
        console.log("[v0] Comparing id_registro with date:", {
          id_registro: row.id_registro,
          dateFromId,
          match: row.id_registro.includes(dateFromId),
        })
        return row.id_registro.includes(dateFromId)
      }
      return false
    })

  console.log("[v0] Filtered ROVs:", processed.length)
  return processed
}
