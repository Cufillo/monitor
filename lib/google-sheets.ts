import { google } from 'googleapis'
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ]
})

export async function getAllSheetsData(reportDate: string) {
  try {
    logger.info('🔍 Starting getAllSheetsData for REPORT date:', reportDate)

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    // 1. Obtener todos los registros para encontrar el id_registro del día del reporte
    const registrosRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registros!A:N',
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING'
    });

    const allRegistros = processRawRegistros(registrosRes.data.values || []);
    
    // Encontrar el registro que coincide con la fecha del reporte
    const reportDateUTC = new Date(reportDate + 'T00:00:00Z').toISOString().split('T')[0];
    const matchingRegistro = allRegistros.find(r => {
      if (r.fecha instanceof Date && !isNaN(r.fecha.getTime())) {
        return r.fecha.toISOString().split('T')[0] === reportDateUTC;
      }
      return false;
    });

    let targetIdRegistro: string | null = null;
    if (matchingRegistro) {
      targetIdRegistro = matchingRegistro.id_registro;
      logger.info(`✅ Found matching Registro for report date ${reportDate}: id_registro=${targetIdRegistro}`);
    } else {
      logger.warn(`⚠️ No matching Registro found for report date ${reportDate}. Other sheets will be empty.`);
    }

    // 2. Obtener datos de las otras hojas y filtrarlas por el id_registro encontrado
    const [dmasRes, navesRes, rovsRes] = await Promise.all([
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
    ]);

    const dmas = processDMAs(dmasRes.data.values || [], targetIdRegistro);
    const naves = processNaves(navesRes.data.values || [], targetIdRegistro);
    const rovs = processROVs(rovsRes.data.values || [], targetIdRegistro);

    logger.info('✅ Processed data counts after filtering:', {
      registros: matchingRegistro ? 1 : 0, // Solo un registro por día de reporte
      dmas: dmas.length,
      naves: naves.length,
      rovs: rovs.length
    });

    return {
      registros: matchingRegistro ? [matchingRegistro] : [],
      dmas,
      naves,
      rovs,
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    logger.error('❌ Error fetching Google Sheets data:', error);
    throw error;
  }
}

// Nueva función para procesar registros sin filtrar por fecha, solo parsear
function processRawRegistros(values: any[][]) {
  if (!values || values.length < 2) {
    return [];
  }
  const rows = values.slice(1);
  return rows.map(row => ({
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
  }));
}

// Las funciones de procesamiento de DMAs, Naves, ROVs ahora reciben el id_registro a buscar
function processDMAs(values: any[][], targetIdRegistro: string | null) {
  if (!values || values.length < 2 || !targetIdRegistro) {
    logger.warn('⚠️ No or insufficient data for DMAs sheet or no target id_registro.');
    return [];
  }
  
  const rows = values.slice(1);
  logger.info(`🔧 Processing ${rows.length} DMA rows for target id_registro: ${targetIdRegistro}`);
  
  const processed = rows
    .map((row, rowIndex) => ({
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
    }))
    .filter(row => {
      const isMatch = row.id_registro === targetIdRegistro;
      if (isMatch) {
        logger.info(`✅ DMA match found: ${row.id_registro} === ${targetIdRegistro} (DMA ${row.dma_numero}, Estado: ${row.estado_equipo})`);
      }
      return isMatch;
    });
    
  logger.info(`🔧 DMAs final count for id_registro ${targetIdRegistro}: ${processed.length}`);
  return processed;
}

function processNaves(values: any[][], targetIdRegistro: string | null) {
  if (!values || values.length < 2 || !targetIdRegistro) {
    logger.warn('⚠️ No or insufficient data for Naves sheet or no target id_registro.');
    return [];
  }
  
  const rows = values.slice(1);
  logger.info(`🚢 Processing ${rows.length} Naves rows for target id_registro: ${targetIdRegistro}`);

  const processed = rows
    .map(row => ({
      id_registro: validateString(row[0]),
      nave_nombre: validateString(row[1]),
      nave_observaciones: validateString(row[2])
    }))
    .filter(row => {
      const isMatch = row.id_registro === targetIdRegistro;
      if (isMatch) {
        logger.info(`✅ Nave match found: ${row.id_registro} === ${targetIdRegistro} (${row.nave_nombre})`);
      }
      return isMatch;
    });
    
  logger.info(`🚢 Naves final count for id_registro ${targetIdRegistro}: ${processed.length}`);
  return processed;
}

function processROVs(values: any[][], targetIdRegistro: string | null) {
  if (!values || values.length < 2 || !targetIdRegistro) {
    logger.warn('⚠️ No or insufficient data for ROVs sheet or no target id_registro.');
    return [];
  }
  
  const rows = values.slice(1);
  logger.info(`🤖 Processing ${rows.length} ROVs rows for target id_registro: ${targetIdRegistro}`);

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
      const isMatch = row.id_registro === targetIdRegistro;
      if (isMatch) {
        logger.info(`✅ ROV match found: ${row.id_registro} === ${targetIdRegistro} (${row.rov_numero})`);
      }
      return isMatch;
    });
    
  logger.info(`🤖 ROVs final count for id_registro ${targetIdRegistro}: ${processed.length}`);
  return processed;
}

// Funciones de validación (sin cambios)
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
