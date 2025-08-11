import { google } from 'googleapis'

export async function getAllSheetsData(date: string) {
  try {
    console.log('🔍 Fetching data for date:', date)
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    // Obtener datos de todas las hojas con manejo de errores individual
    const results = await Promise.allSettled([
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Registros!A:N',
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'DMAs!A:O',
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Naves!A:C',
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'ROVs!A:F',
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      })
    ])

    // Procesar resultados
    const [registrosRes, dmasRes, navesRes, rovsRes] = results

    const registros = registrosRes.status === 'fulfilled' 
      ? processRegistros(registrosRes.value.data.values || [], date)
      : []
      
    const dmas = dmasRes.status === 'fulfilled'
      ? processDMAs(dmasRes.value.data.values || [], date)
      : []
      
    const naves = navesRes.status === 'fulfilled'
      ? processNaves(navesRes.value.data.values || [], date)
      : []
      
    const rovs = rovsRes.status === 'fulfilled'
      ? processROVs(rovsRes.value.data.values || [], date)
      : []

    console.log('📊 Data processed:', { 
      registros: registros.length, 
      dmas: dmas.length, 
      naves: naves.length, 
      rovs: rovs.length 
    })

    return {
      registros,
      dmas,
      naves,
      rovs,
      lastUpdate: new Date().toISOString(),
      errors: results.filter(r => r.status === 'rejected').map(r => r.reason?.message)
    }
  } catch (error) {
    console.error('❌ Error fetching Google Sheets data:', error)
    throw error
  }
}

function processRegistros(values: any[][], targetDate: string) {
  if (!values || values.length < 2) return []
  
  const rows = values.slice(1)
  
  return rows
    .map(row => ({
      id_registro: row[0] || '',
      fecha: row[1] || '',
      estado_puerto_directemar: row[2] || '',
      estado_puerto_concesion: row[3] || '',
      dia_operacion: parseInt(row[4]) || 0,
      num_equipos: parseInt(row[5]) || 0,
      num_equipos_inoperativos: parseInt(row[6]) || 0,
      num_equipos_bombeando: parseInt(row[7]) || 0,
      cliente: row[8] || '',
      centro: row[9] || '',
      responsable: row[10] || '',
      condiciones_clima: row[11] || '',
      detalles: row[12] || '',
      archivos_clima: row[13] || ''
    }))
    .filter(row => {
      if (row.fecha) {
        try {
          const rowDate = new Date(row.fecha).toISOString().split('T')[0]
          return rowDate === targetDate
        } catch {
          return false
        }
      }
      return false
    })
}

function processDMAs(values: any[][], targetDate: string) {
  if (!values || values.length < 2) return []
  
  const rows = values.slice(1)
  
  return rows
    .map(row => ({
      id_registro: row[0] || '',
      estado_equipo: row[1] || '',
      dma_numero: row[2] || '',
      plataforma: row[3] || '',
      plataforma_estado: row[4] || '',
      central: row[5] || '',
      central_estado: row[6] || '',
      manga: row[7] || '',
      manguera: row[8] || '',
      tobera: row[9] || '',
      tobera_estado: row[10] || '',
      estacion: row[11] || '',
      punto: row[12] || '',
      horas_bombeo: parseFloat(row[13]) || 0,
      observaciones: row[14] || ''
    }))
    .filter(row => {
      if (row.id_registro) {
        const dateFromId = targetDate.replace(/-/g, '')
        return row.id_registro.includes(dateFromId)
      }
      return false
    })
}

function processNaves(values: any[][], targetDate: string) {
  if (!values || values.length < 2) return []
  
  const rows = values.slice(1)
  
  return rows
    .map(row => ({
      id_registro: row[0] || '',
      nave_nombre: row[1] || '',
      nave_observaciones: row[2] || ''
    }))
    .filter(row => {
      if (row.id_registro) {
        const dateFromId = targetDate.replace(/-/g, '')
        return row.id_registro.includes(dateFromId)
      }
      return false
    })
}

function processROVs(values: any[][], targetDate: string) {
  if (!values || values.length < 2) return []
  
  const rows = values.slice(1)
  
  return rows
    .map(row => ({
      id_registro: row[0] || '',
      rov_numero: row[1] || '',
      responsable: row[2] || '',
      estado: row[3] || '',
      ubicacion: row[4] || '',
      observaciones: row[5] || ''
    }))
    .filter(row => {
      if (row.id_registro) {
        const dateFromId = targetDate.replace(/-/g, '')
        return row.id_registro.includes(dateFromId)
      }
      return false
    })
}
