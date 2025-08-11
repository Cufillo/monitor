const { google } = require('googleapis')
require('dotenv').config({ path: '.env.local' })

async function testConnection() {
  console.log('🔧 Probando conexión con Google Sheets...')
  console.log('📧 Email:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL)
  console.log('📊 Spreadsheet ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID)
  
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    
    // Probar acceso al spreadsheet
    console.log('🔍 Probando acceso al spreadsheet...')
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    })
    
    console.log('✅ Conexión exitosa!')
    console.log('📊 Spreadsheet:', response.data.properties?.title)
    console.log('📋 Hojas disponibles:', response.data.sheets?.map(s => s.properties?.title).join(', '))
    
    // Probar lectura de datos de cada hoja
    const hojas = ['Registros', 'DMAs', 'Naves', 'ROVs']
    
    for (const hoja of hojas) {
      try {
        console.log(`\n📄 Probando hoja: ${hoja}`)
        const testData = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
          range: `${hoja}!A1:Z2`
        })
        
        if (testData.data.values && testData.data.values.length > 0) {
          console.log(`✅ ${hoja}: ${testData.data.values.length} filas encontradas`)
          console.log(`   Headers: ${testData.data.values[0]?.slice(0, 5).join(', ')}...`)
        } else {
          console.log(`⚠️  ${hoja}: Sin datos`)
        }
      } catch (error) {
        console.log(`❌ ${hoja}: Error - ${error.message}`)
      }
    }
    
    console.log('\n🎉 ¡Prueba completada!')
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message)
    
    if (error.message.includes('PERMISSION_DENIED')) {
      console.log('\n🔧 SOLUCIÓN:')
      console.log('1. Ve a tu Google Sheet')
      console.log('2. Clic en "Compartir" (botón azul)')
      console.log('3. Agrega: dashboard-sheets-service@operacionesmonitor1.iam.gserviceaccount.com')
      console.log('4. Permiso: "Lector"')
      console.log('5. Clic "Enviar"')
    }
  }
}

testConnection()
