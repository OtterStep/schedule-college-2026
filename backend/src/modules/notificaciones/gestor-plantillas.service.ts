export class GestorPlantillas {
  static plantillaTurnoAsignado(
    docente: { nombres: string; apellidos: string },
    ventana: { fecha: string | Date; horaInicio: string; horaFin: string },
    cursosOpcionales: any[] = []
  ): string {
    const fecha =
      typeof ventana.fecha === 'string'
        ? ventana.fecha
        : ventana.fecha.toISOString().split('T')[0];

    const cursosHTML =
      cursosOpcionales && cursosOpcionales.length > 0
        ? `
        <div style="margin-top: 20px; background-color: #f8fafc; padding: 15px; border-radius: 8px;">
          <h3 style="color: #334155; margin-top: 0; font-size: 16px;">Cursos Disponibles para su Perfil</h3>
          <ul style="color: #475569; padding-left: 20px; margin-bottom: 0;">
            ${cursosOpcionales
              .map(
                (c) =>
                  `<li><strong>${c.nombre}</strong> (${c.escuela || 'N/A'}) - ${c.horas}h</li>`
              )
              .join('')}
          </ul>
        </div>
      `
        : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Asignación de Ventana de Atención</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 20px; line-height: 1.6; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <div style="background-color: #1e3a8a; padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Asignación de Turno</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Sistema de Gestión de Horarios UNT</p>
          </div>

          <div style="padding: 30px;">
            <p style="color: #334155; font-size: 16px; margin-top: 0;">Estimado/a docente,</p>
            <p style="color: #1e293b; font-size: 18px; font-weight: bold; margin-bottom: 25px;">${docente.nombres} ${docente.apellidos}</p>
            
            <p style="color: #475569; font-size: 16px; margin-bottom: 25px;">
              Le informamos que se ha generado su ventana de atención para el proceso de selección de horarios del periodo académico actual.
            </p>

            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h2 style="color: #1d4ed8; font-size: 16px; font-weight: bold; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.05em;">Detalles de su turno</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">Fecha:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 16px; font-weight: bold;">${fecha}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Horario:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 16px; font-weight: bold;">${ventana.horaInicio} a ${ventana.horaFin}</td>
                </tr>
              </table>
            </div>

            ${cursosHTML}

            <p style="color: #64748b; font-size: 14px; margin-top: 30px; font-style: italic;">
              Nota: Por favor, asegúrese de ingresar al sistema durante la ventana de tiempo asignada para realizar su selección. Fuera de este horario, el sistema no le permitirá realizar cambios.
            </p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
              Este es un correo automático, por favor no responda a este mensaje.<br>
              Universidad Nacional de Trujillo - Sistema de Horarios
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
