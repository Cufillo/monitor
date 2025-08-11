import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Cloud, User, Info } from 'lucide-react'
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface RegistroSummaryProps {
  data: any
  loading: boolean
}

export function RegistroSummary({ data, loading }: RegistroSummaryProps) {
  const latestRegistro = data?.registros?.[0] // Asumimos que el primer registro es el más reciente o el relevante para el día

  console.log("RegistroSummary - Raw data:", data?.registros)
  console.log("RegistroSummary - Latest registro:", latestRegistro)

  const formatDate = (dateValue: any) => {
    console.log("Formatting date:", dateValue, "Type:", typeof dateValue)
    
    if (!dateValue) return 'Fecha no disponible'
    
    // Si es una instancia de Date válida
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return format(dateValue, "dd MMMM yyyy", { locale: es })
    }
    
    // Si es un string, intentar parsearlo
    if (typeof dateValue === 'string') {
      const parsedDate = new Date(dateValue)
      if (!isNaN(parsedDate.getTime())) {
        return format(parsedDate, "dd MMMM yyyy", { locale: es })
      }
    }
    
    // Si es un número (fecha de Excel)
    if (typeof dateValue === 'number' && dateValue > 0) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30))
      const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000)
      if (!isNaN(date.getTime())) {
        return format(date, "dd MMMM yyyy", { locale: es })
      }
    }
    
    return 'Fecha no disponible'
  }

  return (
    <Card className="bg-[#2A2F3A] border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="h-5 w-5" />
          Resumen del Registro Diario
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-6 bg-gray-600 rounded animate-pulse" />
            <div className="h-4 bg-gray-600 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-600 rounded w-1/2 animate-pulse" />
          </div>
        ) : latestRegistro ? (
          <div className="space-y-3 text-gray-300">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-white">Fecha:</span>
              {formatDate(latestRegistro.fecha)}
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-white">Condiciones Climáticas:</span>
              {latestRegistro.condiciones_clima || 'No especificado'}
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-white">Responsable:</span>
              {latestRegistro.responsable || 'No especificado'}
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-white">Cliente:</span>
              {latestRegistro.cliente || 'No especificado'}
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-white">Centro:</span>
              {latestRegistro.centro || 'No especificado'}
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-white">Equipos Bombeando:</span>
              {latestRegistro.num_equipos_bombeando !== undefined ? latestRegistro.num_equipos_bombeando : 'N/A'}
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-white">Equipos Inoperativos:</span>
              {latestRegistro.num_equipos_inoperativos !== undefined ? latestRegistro.num_equipos_inoperativos : 'N/A'}
            </div>
            {latestRegistro.detalles && (
              <div className="flex items-start gap-2 mt-3">
                <Info className="h-4 w-4 text-blue-400 mt-0.5" />
                <div>
                  <span className="font-medium text-white">Detalles:</span>
                  <p className="text-sm text-gray-300 mt-1">{latestRegistro.detalles}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400">
              No hay registros disponibles para la fecha seleccionada.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Datos disponibles: {data?.registros?.length || 0} registros, {data?.dmas?.length || 0} DMAs
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
