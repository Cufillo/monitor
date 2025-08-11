import { NextRequest, NextResponse } from 'next/server'
import { getAllSheetsData } from '@/lib/google-sheets'

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json()
    console.log('📅 API called for REPORT date:', date)
    
    const data = await getAllSheetsData(date)
    
    console.log('✅ Data sent to client for report date', date, ':', {
      registros: data.registros.length,
      dmas: data.dmas.length,
      naves: data.naves.length,
      rovs: data.rovs.length,
      lastUpdate: data.lastUpdate
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { 
        error: `Error al obtener datos: ${error.message}`,
        details: error.stack?.split('\n')[0]
      },
      { status: 500 }
    )
  }
}
