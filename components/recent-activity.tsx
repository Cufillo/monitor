import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock } from 'lucide-react'

interface RecentActivityProps {
  data: any
  loading: boolean
}

export function RecentActivity({ data, loading }: RecentActivityProps) {
  const getRecentActivities = () => {
    if (!data) return []
    
    const activities = []
    
    // Actividades basadas en la estructura real del sheet
    data.dmas?.forEach((dma: any) => {
      if (dma.estado_equipo === 'Bombeando') {
        activities.push({
          type: 'DMA',
          message: `DMA ${dma.dma_numero} bombeando en ${dma.estacion}`,
          time: `${dma.horas_bombeo}h`,
          status: 'active',
          details: `Punto ${dma.punto} - ${dma.observaciones}`
        })
      } else if (dma.estado_equipo === 'Inoperativo') {
        activities.push({
          type: 'DMA',
          message: `DMA ${dma.dma_numero} inoperativo`,
          time: 'Crítico',
          status: 'error',
          details: dma.observaciones
        })
      } else if (dma.estado_equipo === 'Operativo') {
        activities.push({
          type: 'DMA',
          message: `DMA ${dma.dma_numero} en standby`,
          time: 'Disponible',
          status: 'warning',
          details: dma.observaciones
        })
      }
    })
    
    // Actividades de ROVs
    data.rovs?.forEach((rov: any) => {
      activities.push({
        type: 'ROV',
        message: `${rov.rov_numero} en ${rov.ubicacion}`,
        time: rov.estado,
        status: rov.estado === 'Operativo' ? 'active' : 'warning',
        details: `Responsable: ${rov.responsable} - ${rov.observaciones}`
      })
    })

    // Actividades de Naves
    data.naves?.forEach((nave: any) => {
      activities.push({
        type: 'NAVE',
        message: `${nave.nave_nombre} activa`,
        time: 'Operando',
        status: 'active',
        details: nave.nave_observaciones
      })
    })
    
    return activities.slice(0, 10)
  }

  const activities = getRecentActivities()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'error': return 'destructive'
      case 'warning': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <Card className="bg-[#2A2F3A] border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Activity className="h-5 w-5" />
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-600 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-2 hover:bg-[#343A47] rounded">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {activity.details}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getStatusColor(activity.status)} className="text-xs">
                      {activity.type}
                    </Badge>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {activities.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No hay actividad reciente
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
