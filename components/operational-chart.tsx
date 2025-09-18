"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface OperationalChartProps {
  data: any
  loading: boolean
}

export function OperationalChart({ data, loading }: OperationalChartProps) {
  const getChartData = () => {
    if (!data?.dmas) return []
    
    const statusCount = data.dmas.reduce((acc: any, dma: any) => {
      const estado = dma.estado_equipo || 'Desconocido'
      acc[estado] = (acc[estado] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(statusCount).map(([estado, count]) => ({
      estado,
      count,
      fill: estado === 'Bombeando' ? '#16a34a' : 
            estado === 'Inoperativo' ? '#dc2626' : '#f59e0b'
    }))
  }

  const getHoursData = () => {
    if (!data?.dmas) return []
    
    return data.dmas
      .filter((dma: any) => dma.horas_bombeo > 0)
      .map((dma: any) => ({
        dma: `DMA ${dma.dma_numero}`,
        horas: parseFloat(dma.horas_bombeo) || 0
      }))
      .sort((a: any, b: any) => b.horas - a.horas)
      .slice(0, 8)
  }

  const chartData = getChartData()
  const hoursData = getHoursData()

  return (
    <Card className="bg-[#2A2F3A] border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5" />
          Horas de Bombeo por Equipo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 bg-gray-600 rounded animate-pulse" />
        ) : (
          <div>
            {hoursData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis dataKey="dma" fontSize={12} stroke="#9CA3AF" />
                  <YAxis fontSize={12} stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2A2F3A', 
                      border: '1px solid #4B5563',
                      color: '#fff'
                    }} 
                  />
                  <Bar dataKey="horas" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No hay datos de bombeo disponibles (Acceda al calendario para otros antecedentes - El sistema se actualiza cada 8 horas)
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
