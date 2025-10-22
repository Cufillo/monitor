import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Cloud, User, Building2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface RegistroSummaryProps {
  data: any
  loading: boolean
}

export function RegistroSummary({ data, loading }: RegistroSummaryProps) {
  const registros = data?.registros || []

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Fecha no disponible"

    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return format(dateValue, "dd MMMM yyyy", { locale: es })
    }

    if (typeof dateValue === "string") {
      const parsedDate = new Date(dateValue)
      if (!isNaN(parsedDate.getTime())) {
        return format(parsedDate, "dd MMMM yyyy", { locale: es })
      }
    }

    if (typeof dateValue === "number" && dateValue > 0) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30))
      const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000)
      if (!isNaN(date.getTime())) {
        return format(date, "dd MMMM yyyy", { locale: es })
      }
    }

    return "Fecha no disponible"
  }

  return (
    <Card className="bg-[#2A2F3A] border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Registros del Día
          </div>
          <Badge variant="secondary" className="bg-blue-600 text-white">
            {registros.length} {registros.length === 1 ? "registro" : "registros"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-6 bg-gray-600 rounded animate-pulse" />
            <div className="h-4 bg-gray-600 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-600 rounded w-1/2 animate-pulse" />
          </div>
        ) : registros.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registros.map((registro: any, index: number) => (
              <div key={index} className="p-4 bg-[#343A47] rounded-lg border border-gray-600 space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-blue-600 text-white">Cliente: {registro.cliente || "N/A"}</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-3 w-3 text-blue-400" />
                    <span className="font-medium text-white">Fecha:</span>
                    {formatDate(registro.fecha)}
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <Building2 className="h-3 w-3 text-blue-400" />
                    <span className="font-medium text-white">Centro:</span>
                    {registro.centro || "No especificado"}
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <User className="h-3 w-3 text-blue-400" />
                    <span className="font-medium text-white">Responsable:</span>
                    {registro.responsable || "No especificado"}
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <Cloud className="h-3 w-3 text-blue-400" />
                    <span className="font-medium text-white">Clima:</span>
                    {registro.condiciones_clima || "No especificado"}
                  </div>

                  <div className="pt-2 border-t border-gray-600">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Bombeando:</span>
                        <span className="ml-1 font-bold text-green-400">{registro.num_equipos_bombeando || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Inoperativos:</span>
                        <span className="ml-1 font-bold text-red-400">{registro.num_equipos_inoperativos || 0}</span>
                      </div>
                    </div>
                  </div>

                  {registro.detalles && (
                    <div className="pt-2 border-t border-gray-600">
                      <span className="font-medium text-white text-xs">Detalles:</span>
                      <p className="text-xs text-gray-300 mt-1 line-clamp-3">{registro.detalles}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No hay registros disponibles para la fecha seleccionada.</p>
            <p className="text-xs text-gray-500 mt-2">
              Datos disponibles: {data?.dmas?.length || 0} DMAs, {data?.naves?.length || 0} Naves,{" "}
              {data?.rovs?.length || 0} ROVs
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
