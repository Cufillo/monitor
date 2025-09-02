"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, RefreshCw, AlertTriangle, CheckCircle, XCircle, Ship, Settings, Wrench, Printer, Mail } from 'lucide-react'
import { MetricsGrid } from "@/components/metrics-grid"
import { EquipmentStatus } from "@/components/equipment-status"
import { OperationalChart } from "@/components/operational-chart"
import { RecentActivity } from "@/components/recent-activity"
import { DatePicker } from "@/components/date-picker"
import { RegistroSummary } from "@/components/registro-summary"

interface DashboardData {
  registros: any[]
  dmas: any[]
  naves: any[]
  rovs: any[]
  lastUpdate: string
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()) // Carga con la fecha del día
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sheets-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate.toISOString().split('T')[0] })
      })
      
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000) // Actualizar cada 30 segundos
      return () => clearInterval(interval)
    }
  }, [autoRefresh, selectedDate])

  const getOperationalMetrics = () => {
    if (!data) return { critical: 0, warning: 0, operational: 0, total: 0 }
    
    let critical = 0, warning = 0, operational = 0
    
    data.dmas.forEach(dma => {
      const estado = dma.estado_equipo?.toUpperCase()
      if (estado === 'INOPERATIVO') critical++
      else if (estado === 'BOMBEANDO') operational++
      else warning++
    })
    
    return { critical, warning, operational, total: data.dmas.length }
  }

  const metrics = getOperationalMetrics()

  const handleSendEmail = async () => {
    try {
      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          date: selectedDate.toISOString().split('T')[0],
          data: data 
        })
      })
      
      if (response.ok) {
        alert('Reporte enviado por correo exitosamente')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Error al enviar el reporte')
    }
  }

  return (
    <div className="min-h-screen bg-[#1F232B] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard Operacional</h1>
            <p className="text-gray-300 mt-1">Sistema de control y gestión de datos - V2</p>
          </div>
          
          <div className="flex items-center gap-3">
            <DatePicker date={selectedDate} onDateChange={setSelectedDate} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2 bg-[#2A2F3A] border-gray-600 text-white hover:bg-[#343A47]"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendEmail}
              className="gap-2 bg-[#2A2F3A] border-gray-600 text-white hover:bg-[#343A47]"
            >
              <Mail className="h-4 w-4" />
              Enviar
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto
            </Button>
            <Button onClick={fetchData} disabled={loading} size="sm" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        <Card className="border-l-4 border-l-blue-500 bg-[#2A2F3A] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-white">Sistema Activo</span>
                </div>
                {data && (
                  <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                    Última actualización: {new Date(data.lastUpdate).toLocaleTimeString('es-CL')}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-300">
                {selectedDate.toLocaleDateString('es-CL', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen del Registro Diario - Nueva Posición */}
        <RegistroSummary data={data} loading={loading} />

        {/* Metrics Grid */}
        <MetricsGrid 
          critical={metrics.critical}
          warning={metrics.warning}
          operational={metrics.operational}
          total={metrics.total}
          loading={loading}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Equipment Status */}
          <div className="lg:col-span-2">
            <EquipmentStatus data={data} loading={loading} />
          </div>
          
          {/* Recent Activity */}
          <div>
            <RecentActivity data={data} loading={loading} />
          </div>
        </div>

        {/* Charts and Fleet Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <OperationalChart data={data} loading={loading} />
          
          <div className="space-y-4">
            {/* Naves Section */}
            <Card className="bg-[#2A2F3A] border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Ship className="h-5 w-5" />
                  Estado de Naves
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="h-16 bg-gray-600 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data?.naves.map((nave, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#343A47] rounded-lg border border-gray-600">
                        <div>
                          <div className="font-medium text-white">{nave.nave_nombre}</div>
                          <div className="text-sm text-gray-300">{nave.nave_observaciones || 'Sin observaciones'}</div>
                        </div>
                        <Badge className="bg-green-600 text-white hover:bg-green-700">Activa</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ROVs Section */}
            <Card className="bg-[#2A2F3A] border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5" />
                  Equipos ROV
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="h-16 bg-gray-600 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data?.rovs.map((rov, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#343A47] rounded-lg border border-gray-600">
                        <div>
                          <div className="font-medium text-white">{rov.rov_numero}</div>
                          <div className="text-sm text-gray-300">{rov.ubicacion} - {rov.responsable}</div>
                          <div className="text-xs text-gray-400">{rov.observaciones}</div>
                        </div>
                        <Badge 
                          className={rov.estado === 'Operativo' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-yellow-600 text-white hover:bg-yellow-700'}
                        >
                          {rov.estado}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
