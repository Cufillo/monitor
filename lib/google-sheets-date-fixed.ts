import { google } from 'googleapis'
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ]
})

export async function getAllSheetsData(date: string) {
  try {
    logger.info('🔍 Starting getAllSheetsData for REPORT date:', date)

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    // Obtener datos de todas las hojas
    const [registrosRes, dmasRes, navesRes, rovsRes] = await Promise.all([
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

    logger.info('📊 Raw data received from sheets:', {
      registrosCount: registrosRes.data.values?.length || 0,
      dmasCount: dmasRes.data.values?.length || 0,
      navesCount: navesRes.data.values?.length || 0,
      rovsCount: rovsRes.data.values?.length || 0,
    })

    // Procesar datos con la lógica de desfase de fechas
    const registros = processRegistros(registrosRes.data.values || [], date)
    const dmas = processDMAs(dmasRes.data.values || [], date)
    const naves = processNaves(navesRes.data.values || [], date)
    const rovs = processROVs(rovsRes.data.values || [], date)

    logger.info('✅ Processed data counts after filtering:', {
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
      lastUpdate: new Date().toISOString()
    }
  } catch (error) {
    logger.error('❌ Error fetching Google Sheets data:', error)
    throw error
  }
}

function processRegistros(values: any[][], reportDate: string) {
  if (!values || values.length < 2) {
    logger.warn('⚠️ No or insufficient data for Registros sheet.')
    return []
  }
  
  // CLAVE: Para encontrar registros del reporte del día X, busco registros ingresados el día X+1
  const reportDateObj = new Date(reportDate)
  const registryDate = new Date(reportDateObj)
  registryDate.setDate(registryDate.getDate() + 1) // Día siguiente
  const registryDateString = registryDate.toISOString().split('T')[0]
  
  logger.info(`📋 Looking for Registros: Report date=${reportDate}, Registry date=${registryDateString}`)
  
  const rows = values.slice(1)
  
  const processed = rows
    .map((row, rowIndex) => {
      const registroData = {
        id_registro: validateString(row[0]),
        fecha: validateDate(row[1]),
        estado_puerto_directemar: validateString(row[2]),
        estado_puerto_concesion: validateString(row[3]),
        dia_operacion: validateNumber(row[4]),
        num_equipos: validateNumber(row[5]),
        num_equipos_inoperativos: validateNumber(row[6]),
        num_equipos_bombeando: validateNumber(row[7]),
        cliente: validateString(row[8]),
        centro: validateString(row[9]),
        responsable: validateString(row[10]),
        condiciones_clima: validateString(row[11]),
        detalles: validateString(row[12]),
        archivos_clima: validateString(row[13])
      }
      
      return registroData
    })
    .filter(row => {
      // Buscar registros ingresados el día siguiente al reporte
      if (row.fecha instanceof Date && !isNaN(row.fecha.getTime())) {
        const rowDate = row.fecha.toISOString().split('T')[0]
        const isMatch = rowDate === registryDateString
        if (isMatch) {
          logger.info(`✅ Registros match found: Registry date ${rowDate} for report date ${reportDate}`)
          logger.info(`   📝 Details: Responsable=${row.responsable}, Cliente=${row.cliente}, Centro=${row.centro}`)
        }
        return isMatch
      }
      
      // También buscar por id_registro que contenga la fecha del reporte
      if (row.id_registro) {
        const reportDateId = reportDate.replace(/-/g, '')
        const isMatch = row.id_registro.includes(reportDateId)
        if (isMatch) {
          logger.info(`✅ Registros match by ID: ${row.id_registro} contains ${reportDateId}`)
        }
        return isMatch
      }
      
      return false
    })
  
  logger.info(`📋 Registros final count for report date ${reportDate}: ${processed.length}`)
  return processed
}

function processDMAs(values: any[][], reportDate: string) {
  if (!values || values.length < 2) {
    logger.warn('⚠️ No or insufficient data for DMAs sheet.')
    return []
  }
  
  const rows = values.slice(1)
  const dateFromId = reportDate.replace(/-/g, '') // "2025-08-04" -> "20250804"
  
  logger.info(`🔧 Processing ${rows.length} DMA rows for REPORT date: ${reportDate} (ID pattern: ${dateFromId})`)
  
  const processed = rows
    .map((row, rowIndex) => {
      const dmaData = {
        id_registro: validateString(row[0]),
        estado_equipo: validateString(row[1]),
        dma_numero: validateString(row[2]),
        plataforma: validateString(row[3]),
        plataforma_estado: validateString(row[4]),
        central: validateString(row[5]),
        central_estado: validateString(row[6]),
        manga: validateString(row[7]),
        manguera: validateString(row[8]),
        tobera: validateString(row[9]),
        tobera_estado: validateString(row[10]),
        estacion: validateString(row[11]),
        punto: validateString(row[12]),
        horas_bombeo: validateNumber(row[13]),
        observaciones: validateString(row[14])
      }
      
      return dmaData
    })
    .filter(row => {
      if (!row.id_registro) {
        return false
      }
      
      // Buscar por el patrón de fecha del reporte en el ID
      const isMatch = row.id_registro.includes(dateFromId)
      if (isMatch) {
        logger.info(`✅ DMA match found: ${row.id_registro} contains ${dateFromId} (DMA ${row.dma_numero}, Estado: ${row.estado_equipo})`)
      }
      return isMatch
    })
    
  logger.info(`🔧 DMAs final count for report date ${reportDate}: ${processed.length}`)
  return processed
}

function processNaves(values: any[][], reportDate: string) {
  if (!values || values.length < 2) {
    logger.warn('⚠️ No or insufficient data for Naves sheet.')
    return []
  }
  
  const rows = values.slice(1)
  const dateFromId = reportDate.replace(/-/g, '')
  
  logger.info(`🚢 Processing ${rows.length} Naves rows for REPORT date: ${reportDate}`)

  const processed = rows
    .map(row => ({
      id_registro: validateString(row[0]),
      nave_nombre: validateString(row[1]),
      nave_observaciones: validateString(row[2])
    }))
    .filter(row => {
      if (!row.id_registro) return false
      const isMatch = row.id_registro.includes(dateFromId)
      if (isMatch) {
        logger.info(`✅ Nave match found: ${row.id_registro} contains ${dateFromId} (${row.nave_nombre})`)
      }
      return isMatch
    })
    
  logger.info(`🚢 Naves final count for report date ${reportDate}: ${processed.length}`)
  return processed
}

function processROVs(values: any[][], reportDate: string) {
  if (!values || values.length < 2) {
    logger.warn('⚠️ No or insufficient data for ROVs sheet.')
    return []
  }
  
  const rows = values.slice(1)
  const dateFromId = reportDate.replace(/-/g, '')
  
  logger.info(`🤖 Processing ${rows.length} ROVs rows for REPORT date: ${reportDate}`)

  const processed = rows
    .map(row => ({
      id_registro: validateString(row[0]),
      rov_numero: validateString(row[1]),
      responsable: validateString(row[2]),
      estado: validateString(row[3]),
      ubicacion: validateString(row[4]),
      observaciones: validateString(row[5])
    }))
    .filter(row => {
      if (!row.id_registro) return false
      const isMatch = row.id_registro.includes(dateFromId)
      if (isMatch) {
        logger.info(`✅ ROV match found: ${row.id_registro} contains ${dateFromId} (${row.rov_numero})`)
      }
      return isMatch
    })
    
  logger.info(`🤖 ROVs final count for report date ${reportDate}: ${processed.length}`)
  return processed
}

// Funciones de validación
function validateString(value: any): string {
  return String(value || '').trim()
}

function validateDate(value: any): Date | null {
  if (typeof value === 'string' || typeof value === 'number') {
    if (typeof value === 'number' && value > 0) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30))
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000)
      return isNaN(date.getTime()) ? null : date
    }
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }
  return null
}

function validateNumber(value: any): number {
  const num = parseFloat(String(value).replace(',', '.'))
  return isNaN(num) ? 0 : num
}
