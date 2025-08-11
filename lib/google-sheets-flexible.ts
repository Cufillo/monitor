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
    logger.info('Starting getAllSheetsData for date:', date)

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    logger.info('Fetching data from Google Sheets for spreadsheet ID:', spreadsheetId)

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

    logger.info('Raw data received from sheets:', {
      registrosCount: registrosRes.data.values?.length || 0,
      dmasCount: dmasRes.data.values?.length || 0,
      navesCount: navesRes.data.values?.length || 0,
      rovsCount: rovsRes.data.values?.length || 0,
    })

    // Procesar datos con filtrado más flexible
    const registros = processRegistros(registrosRes.data.values || [], date)
    const dmas = processDMAs(dmasRes.data.values || [], date)
    const naves = processNaves(navesRes.data.values || [], date)
    const rovs = processROVs(rovsRes.data.values || [], date)

    logger.info('Processed data counts after filtering:', {
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
    logger.error('Error fetching Google Sheets data:', error)
    throw error
  }
}

function processRegistros(values: any[][], targetDate: string) {
  if (!values || values.length < 2) {
    logger.warn('No or insufficient data for Registros sheet.')
    return []
  }
  
  const rows = values.slice(1)
  
  const processed = rows
    .map((row, rowIndex) => {
      logger.debug(`Raw Registros row ${rowIndex + 1} from sheet: ${JSON.stringify(row)}`)
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
      logger.debug(`Processed Registros data for row ${rowIndex + 1}: ${JSON.stringify(registroData)}`)
      return registroData
    })
    .filter(row => {
      // Filtrado más flexible para registros
      if (row.fecha instanceof Date && !isNaN(row.fecha.getTime())) {
        const rowDate = row.fecha.toISOString().split('T')[0]
        const isMatch = rowDate === targetDate
        logger.debug(`Registros row date check: Raw date '${row.fecha}', Processed date '${rowDate}', Target date '${targetDate}', Match: ${isMatch}`)
        return isMatch
      }
      
      // También buscar por id_registro
      if (row.id_registro) {
        const dateFromId = targetDate.replace(/-/g, '')
        const isMatch = row.id_registro.includes(dateFromId)
        logger.debug(`Registros row id_registro check: ID '${row.id_registro}', Target date part '${dateFromId}', Match: ${isMatch}`)
        return isMatch
      }
      
      logger.debug(`Filtering out Registros row due to invalid date and no id_registro: ${JSON.stringify(row)} for target ${targetDate}`)
      return false
    })
  
  logger.info(`Registros processed for ${targetDate}: ${processed.length} items.`)
  return processed
}

function processDMAs(values: any[][], targetDate: string) {
  if (!values || values.length < 2) {
    logger.warn('No or insufficient data for DMAs sheet.')
    return []
  }
  
  const rows = values.slice(1)
  const dateFromId = targetDate.replace(/-/g, '') // e.g., "20250804"
  
  // También probar con diferentes formatos de fecha
  const targetDateObj = new Date(targetDate)
  const dayOfMonth = targetDateObj.getDate().toString().padStart(2, '0')
  const month = (targetDateObj.getMonth() + 1).toString().padStart(2, '0')
  const year = targetDateObj.getFullYear().toString()

  const processed = rows
    .map((row, rowIndex) => {
      logger.debug(`Raw DMA row ${rowIndex + 1} from sheet: ${JSON.stringify(row)}`)
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
      logger.debug(`Processed DMA data for row ${rowIndex + 1}: ${JSON.stringify(dmaData)}`)
      return dmaData
    })
    .filter(row => {
      if (!row.id_registro) {
        logger.debug(`Filtering out DMA row due to missing id_registro`)
        return false
      }
      
      // Múltiples patrones de búsqueda
      const patterns = [
        dateFromId,           // 20250804
        `${dayOfMonth}${month}${year}`, // 04082025
        `${year}${month}${dayOfMonth}`, // 20250804
        `${dayOfMonth}${month}`,        // 0408
        `${month}${dayOfMonth}`,        // 0804
        dayOfMonth,                     // 04
      ]
      
      const isMatch = patterns.some(pattern => row.id_registro.includes(pattern))
      
      if (isMatch) {
        logger.info(`DMA row matched with pattern for ${targetDate}: ${row.id_registro}`)
      } else {
        logger.debug(`DMA row no match for ${targetDate}: ${row.id_registro}`)
      }
      
      return isMatch
    })
    
  logger.info(`DMAs processed for ${targetDate}: ${processed.length} items. Example DMA_NUMERO: ${processed.length > 0 ? processed[0].dma_numero : 'N/A'}`)
  return processed
}

function processNaves(values: any[][], targetDate: string) {
  if (!values || values.length < 2) {
    logger.warn('No or insufficient data for Naves sheet.')
    return []
  }
  
  const rows = values.slice(1)
  const dateFromId = targetDate.replace(/-/g, '')
  const targetDateObj = new Date(targetDate)
  const dayOfMonth = targetDateObj.getDate().toString().padStart(2, '0')
  const month = (targetDateObj.getMonth() + 1).toString().padStart(2, '0')

  return rows
    .map(row => ({
      id_registro: validateString(row[0]),
      nave_nombre: validateString(row[1]),
      nave_observaciones: validateString(row[2])
    }))
    .filter(row => {
      if (!row.id_registro) return false
      
      const patterns = [dateFromId, `${dayOfMonth}${month}`, dayOfMonth]
      return patterns.some(pattern => row.id_registro.includes(pattern))
    })
}

function processROVs(values: any[][], targetDate: string) {
  if (!values || values.length < 2) {
    logger.warn('No or insufficient data for ROVs sheet.')
    return []
  }
  
  const rows = values.slice(1)
  const dateFromId = targetDate.replace(/-/g, '')
  const targetDateObj = new Date(targetDate)
  const dayOfMonth = targetDateObj.getDate().toString().padStart(2, '0')
  const month = (targetDateObj.getMonth() + 1).toString().padStart(2, '0')

  return rows
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
      
      const patterns = [dateFromId, `${dayOfMonth}${month}`, dayOfMonth]
      return patterns.some(pattern => row.id_registro.includes(pattern))
    })
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
