require("dotenv").config({ path: ".env.local" })
const { google } = require("googleapis")

async function testConnection() {
  console.log("=== TESTING GOOGLE SHEETS CONNECTION ===\n")

  // 1. Verificar variables de entorno
  console.log("1. Checking environment variables...")
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

  console.log("   Client Email:", clientEmail)
  console.log("   Spreadsheet ID:", spreadsheetId)
  console.log("   Private Key:", privateKey ? "Present ✓" : "Missing ✗")

  if (!privateKey || !clientEmail || !spreadsheetId) {
    console.error("\n❌ Missing environment variables!")
    return
  }

  try {
    // 2. Crear cliente de autenticación
    console.log("\n2. Creating auth client...")
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })

    const authClient = await auth.getClient()
    console.log("   Auth client created ✓")

    // 3. Crear cliente de Sheets
    console.log("\n3. Creating Sheets client...")
    const sheets = google.sheets({ version: "v4", auth: authClient })
    console.log("   Sheets client created ✓")

    // 4. Obtener información del spreadsheet
    console.log("\n4. Getting spreadsheet info...")
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    })

    console.log("   Spreadsheet Title:", spreadsheet.data.properties.title)
    console.log("   Sheets found:", spreadsheet.data.sheets.length)
    console.log("   Sheet names:")
    spreadsheet.data.sheets.forEach((sheet) => {
      console.log("     -", sheet.properties.title)
    })

    // 5. Leer datos de cada hoja
    console.log("\n5. Reading data from sheets...")

    const sheetNames = ["Registros", "DMAs", "Naves", "ROVs"]

    for (const sheetName of sheetNames) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A1:Z1000`,
        })

        const rows = response.data.values || []
        console.log(`\n   ${sheetName}:`)
        console.log(`     Total rows: ${rows.length}`)

        if (rows.length > 0) {
          console.log(`     Headers: ${rows[0].join(", ")}`)
          console.log(`     First data row:`, rows[1] || "No data")
        }
      } catch (error) {
        console.error(`   ❌ Error reading ${sheetName}:`, error.message)
      }
    }

    console.log("\n✅ Connection test completed successfully!")
  } catch (error) {
    console.error("\n❌ Error during connection test:")
    console.error("   Message:", error.message)
    if (error.code) console.error("   Code:", error.code)
    if (error.errors) console.error("   Details:", error.errors)
  }
}

testConnection()
