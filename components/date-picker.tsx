"use client"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from 'lucide-react'
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useState, useRef, useEffect } from "react"

interface DatePickerProps {
  date: Date
  onDateChange: (date: Date) => void
}

export function DatePicker({ date, onDateChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Cerrar el calendario cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current && 
        buttonRef.current && 
        !calendarRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      onDateChange(newDate)
      setIsOpen(false)
      console.log("Date selected:", newDate)
    }
  }

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="outline"
        className="gap-2 bg-[#2A2F3A] border-gray-600 text-white hover:bg-[#343A47]"
        onClick={() => {
          console.log("Date picker button clicked!")
          setIsOpen(!isOpen)
        }}
      >
        <CalendarIcon className="h-4 w-4" />
        {date ? format(date, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
      </Button>
      
      {isOpen && (
        <div 
          ref={calendarRef}
          className="absolute top-full mt-2 z-50 bg-[#2A2F3A] border border-gray-600 rounded-md shadow-lg p-4"
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            // Estilos para asegurar visibilidad de los números, mes y año
            className="
              bg-[#2A2F3A] text-white rounded-md p-3 /* Fondo oscuro para el calendario */
              [&_.rdp-caption_label]:text-white /* Mes y Año */
              [&_.rdp-head_cell]:text-gray-300 /* Nombres de los días (Dom, Lun, etc.) */
              
              /* Estilos para los días del mes (números) */
              [&_.rdp-day_button]:bg-[#343A47] /* Fondo oscuro por defecto para todos los días */
              [&_.rdp-day_button]:text-white /* Texto blanco por defecto para todos los días */
              [&_.rdp-day_button]:border /* Borde para los días */
              [&_.rdp-day_button]:border-gray-600 /* Color del borde */
              [&_.rdp-day_button]:min-h-[32px]
              [&_.rdp-day_button]:min-w-[32px]
              [&_.rdp-day_button]:font-bold /* Texto en negrita */

              /* Estilos al pasar el cursor sobre días no seleccionados */
              [&_.rdp-day_button]:hover:bg-[#404754] /* Fondo más oscuro al pasar el cursor */
              [&_.rdp-day_button]:hover:text-white /* Asegura texto blanco al pasar el cursor */

              /* Estilos para el día seleccionado */
              [&_.rdp-day_button[aria-selected=true]]:bg-blue-600 /* Fondo azul para el día seleccionado */
              [&_.rdp-day_button[aria-selected=true]]:text-white /* Texto blanco para el día seleccionado */
              [&_.rdp-day_button[aria-selected=true]]:hover:bg-blue-700 /* Fondo azul más oscuro al pasar el cursor sobre el seleccionado */
              [&_.rdp-day_button[aria-selected=true]]:hover:text-white /* Asegura texto blanco al pasar el cursor sobre el seleccionado */

              /* Estilos para los botones de navegación (flechas) */
              [&_.rdp-nav_button]:text-white 
              [&_.rdp-nav_button]:hover:bg-[#343A47] 
            "
          />
        </div>
      )}
    </div>
  )
}
