import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
try {
const { date, data } = await request.json()

// Aquí implementarías el envío de correo
// Puedes usar nodemailer, sendgrid, etc.

// Ejemplo con nodemailer (necesitarías instalarlo)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Obtener destinatarios del entorno y dividirlos por coma
const recipients = process.env.EMAIL_RECIPIENTS?.split(',').map(email => email.trim()) || [];
if (recipients.length === 0) {
  console.warn('No email recipients configured in EMAIL_RECIPIENTS environment variable.');
  return NextResponse.json({ success: false, message: 'No se configuraron destinatarios de correo.' }, { status: 400 });
}

const htmlContent = generateReportHTML(data, date)

await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: recipients.join(','), // Nodemailer puede aceptar una cadena separada por comas
  subject: `Reporte Operacional Aracena 19 - ${date}`,
  html: htmlContent
})

// Por ahora, simulamos el envío
// console.log('Enviando reporte por correo para fecha:', date)
// console.log('Destinatarios simulados:', process.env.EMAIL_RECIPIENTS)

return NextResponse.json({ success: true, message: 'Reporte enviado exitosamente' })
} catch (error) {
console.error('Error sending report:', error)
return NextResponse.json(
  { error: 'Error al enviar el reporte' },
  { status: 500 }
)
}
}

function generateReportHTML(data: any, date: string) {
// Aquí generarías el HTML del reporte similar a tu script actual
return `
<!DOCTYPE html>
<html>
<head>
  <title>Reporte Operacional - ${date}</title>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #3b82f6; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Reporte Operacional Aracena 19</h1>
    <p>Fecha: ${date}</p>
  </div>
  <div class="content">
      Aquí irían los datos del reporte 
  </div>
</body>
</html>
`
}
