import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wrench, Clock, MapPin } from 'lucide-react'

interface EquipmentStatusProps {
  data: any
  loading: boolean
}

export function EquipmentStatus({ data, loading }: EquipmentStatusProps) {
  const getStatusColor = (estado: string) => {
    const estadoUpper = estado?.toUpperCase()
    if (estadoUpper === 'INOPERATIVO') return 'bg-red-600 text-white hover:bg-red-700'
    if (estadoUpper === 'BOMBEANDO') return 'bg-green-600 text-white hover:bg-green-700'
    return 'bg-yellow-600 text-white hover:bg-yellow-700'
  }

  const getStatusIcon = (estado: string) => {
    const estadoUpper = estado?.toUpperCase()
    if (estadoUpper === 'INOPERATIVO') return '🔴'
    if (estadoUpper === 'BOMBEANDO') return '🟢'
    return '🟡'
  }

  return (
    <Card className="bg-[#2A2F3A] border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Wrench className="h-5 w-5" />
          Estado de Equipos DMA
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data?.dmas.map((dma: any, index: number) => {
              console.log(`Rendering DMA ${index}: dma_numero = ${dma.dma_numero}, estado_equipo = ${dma.estado_equipo}`); // Nuevo log
              return (
                <div key={index} className="border border-gray-600 rounded-lg p-4 hover:bg-[#343A47] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getStatusIcon(dma.estado_equipo)}</span>
                      <div>
                        <h3 className="font-semibold text-white">DMA {dma.dma_numero}</h3>
                        <Badge className={getStatusColor(dma.estado_equipo)}>
                          {dma.estado_equipo}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dma.horas_bombeo || '0'}h
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Plataforma:</span>
                      <div className="font-medium text-white">{dma.plataforma}</div>
                      <div className="text-xs text-gray-500">{dma.plataforma_estado}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Central:</span>
                      <div className="font-medium text-white">{dma.central}</div>
                      <div className="text-xs text-gray-500">{dma.central_estado}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Tobera:</span>
                      <div className="font-medium text-white">{dma.tobera}</div>
                      <div className="text-xs text-gray-500">{dma.tobera_estado}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Manga/Manguera:</span>
                      <div className="font-medium text-white">{dma.manga}</div>
                      <div className="text-xs text-gray-500">{dma.manguera}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Estación:</span>
                      <div className="font-medium text-white flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {dma.estacion}
                      </div>
                      <div className="text-xs text-gray-500">Punto: {dma.punto}</div>
                    </div>
                  </div>
                  
                  {dma.observaciones && (
                    <div className="mt-3 p-2 bg-[#343A47] border border-gray-600 rounded text-sm">
                      <span className="font-medium text-gray-300">Observaciones: </span>
                      <span className="text-white">{dma.observaciones}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
