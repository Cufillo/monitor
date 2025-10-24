"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Ship, Settings, Printer, Mail, Users, Building2 } from "lucide-react"
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
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date()
    console.log("[v0] Initializing with today's date:", today.toISOString())
    return today
  })
  const [selectedClient, setSelectedClient] = useState<string>("all")
  const [selectedCenter, setSelectedCenter] = useState<string>("all")
  const [availableClients, setAvailableClients] = useState<string[]>([])
  const [availableCenters, setAvailableCenters] = useState<string[]>([])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("[v0] Fetching data for date:", selectedDate.toISOString().split("T")[0])
      console.log("[v0] Selected date full:", selectedDate)

      const response = await fetch("/api/sheets-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate.toISOString().split("T")[0] }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("[v0] Data received:", {
          registros: result.registros?.length || 0,
          dmas: result.dmas?.length || 0,
          naves: result.naves?.length || 0,
          rovs: result.rovs?.length || 0,
          registrosData: result.registros,
        })
        setData(result)

        const clients = Array.from(new Set(result.registros.map((r: any) => r.cliente).filter(Boolean)))
        const centers = Array.from(new Set(result.registros.map((r: any) => r.centro).filter(Boolean)))
        console.log("[v0] Available clients:", clients)
        console.log("[v0] Available centers:", centers)
        setAvailableClients(clients as string[])
        setAvailableCenters(centers as string[])
      } else {
        console.error("[v0] Error response:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  useEffect(() => {
    const interval = setInterval(fetchData, 8 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const filteredData = data
    ? {
        ...data,
        registros: data.registros.filter((r) => {
          const clientMatch = selectedClient === "all" || r.cliente === selectedClient
          const centerMatch = selectedCenter === "all" || r.centro === selectedCenter
          return clientMatch && centerMatch
        }),
        dmas: data.dmas.filter((d) => {
          const registro = data.registros.find((r) => r.id_registro === d.id_registro)
          if (!registro) return false
          const clientMatch = selectedClient === "all" || registro.cliente === selectedClient
          const centerMatch = selectedCenter === "all" || registro.centro === selectedCenter
          return clientMatch && centerMatch
        }),
        naves: data.naves.filter((n) => {
          const registro = data.registros.find((r) => r.id_registro === n.id_registro)
          if (!registro) return false
          const clientMatch = selectedClient === "all" || registro.cliente === selectedClient
          const centerMatch = selectedCenter === "all" || registro.centro === selectedCenter
          return clientMatch && centerMatch
        }),
        rovs: data.rovs.filter((r) => {
          const registro = data.registros.find((reg) => reg.id_registro === r.id_registro)
          if (!registro) return false
          const clientMatch = selectedClient === "all" || registro.cliente === selectedClient
          const centerMatch = selectedCenter === "all" || registro.centro === selectedCenter
          return clientMatch && centerMatch
        }),
      }
    : null

  const getOperationalMetrics = () => {
    if (!filteredData) return { critical: 0, warning: 0, operational: 0, total: 0 }

    let critical = 0,
      warning = 0,
      operational = 0

    filteredData.dmas.forEach((dma) => {
      const estado = dma.estado_equipo?.toUpperCase()
      if (estado === "INOPERATIVO") critical++
      else if (estado === "BOMBEANDO") operational++
      else warning++
    })

    return { critical, warning, operational, total: filteredData.dmas.length }
  }

  const metrics = getOperationalMetrics()

  const handleSendEmail = async () => {
    try {
      const response = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate.toISOString().split("T")[0],
          data: filteredData,
        }),
      })

      if (response.ok) {
        alert("Reporte enviado por correo exitosamente")
      }
    } catch (error) {
      console.error("Error sending email:", error)
      alert("Error al enviar el reporte")
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

          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[200px] bg-[#2A2F3A] border-gray-600 text-white">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2F3A] border-gray-600">
                <SelectItem value="all" className="text-white">
                  Todos los clientes
                </SelectItem>
                {availableClients.map((client) => (
                  <SelectItem key={client} value={client} className="text-white">
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCenter} onValueChange={setSelectedCenter}>
              <SelectTrigger className="w-[200px] bg-[#2A2F3A] border-gray-600 text-white">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Seleccionar centro" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2F3A] border-gray-600">
                <SelectItem value="all" className="text-white">
                  Todos los centros
                </SelectItem>
                {availableCenters.map((center) => (
                  <SelectItem key={center} value={center} className="text-white">
                    {center}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
            <Button onClick={fetchData} disabled={loading} size="sm" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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
                  <span className="text-sm font-medium text-white">Sistema Activo - Actualización cada 8 horas</span>
                </div>
                {data && (
                  <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                    Última actualización: {new Date(data.lastUpdate).toLocaleTimeString("es-CL")}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-300">
                {selectedDate.toLocaleDateString("es-CL", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <RegistroSummary data={filteredData} loading={loading} />

        <MetricsGrid
          critical={metrics.critical}
          warning={metrics.warning}
          operational={metrics.operational}
          total={metrics.total}
          loading={loading}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EquipmentStatus data={filteredData} loading={loading} />
          </div>

          <div>
            <RecentActivity data={filteredData} loading={loading} />
          </div>
        </div>

        {/* Charts and Fleet Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <OperationalChart data={filteredData} loading={loading} />

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
                    {[1, 2].map((i) => (
                      <div key={i} className="h-16 bg-gray-600 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredData?.naves.map((nave, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-[#343A47] rounded-lg border border-gray-600"
                      >
                        <div>
                          <div className="font-medium text-white">{nave.nave_nombre}</div>
                          <div className="text-sm text-gray-300">{nave.nave_observaciones || "Sin observaciones"}</div>
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
                    {[1, 2].map((i) => (
                      <div key={i} className="h-16 bg-gray-600 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredData?.rovs.map((rov, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-[#343A47] rounded-lg border border-gray-600"
                      >
                        <div>
                          <div className="font-medium text-white">{rov.rov_numero}</div>
                          <div className="text-sm text-gray-300">
                            {rov.ubicacion} - {rov.responsable}
                          </div>
                          <div className="text-xs text-gray-400">{rov.observaciones}</div>
                        </div>
                        <Badge
                          className={
                            rov.estado === "Operativo"
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-yellow-600 text-white hover:bg-yellow-700"
                          }
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
