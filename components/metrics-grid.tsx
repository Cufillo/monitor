import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react'

interface MetricsGridProps {
  critical: number
  warning: number
  operational: number
  total: number
  loading: boolean
}

export function MetricsGrid({ critical, warning, operational, total, loading }: MetricsGridProps) {
  const metrics = [
    {
      title: "Crítico",
      value: critical,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    {
      title: "Alerta",
      value: warning,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      title: "Operativo",
      value: operational,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Total Equipos",
      value: total,
      icon: Settings,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <Card key={index} className={`${metric.borderColor} border-l-4 bg-[#2A2F3A] border-gray-700`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">{metric.title}</p>
                  <div className={`text-2xl font-bold ${metric.color}`}>
                    {loading ? (
                      <div className="w-8 h-8 bg-gray-600 rounded animate-pulse" />
                    ) : (
                      metric.value
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
