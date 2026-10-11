/**
 * Genera el texto íntegro del consentimiento a partir de la ficha del alumno.
 * (En el markdown: "El texto se genera automáticamente desde la ficha").
 */
export function buildConsentDocument(studentName: string, programContext: string): string {
  return [
    'CONSENTIMIENTO INFORMADO PARA EL REGISTRO DE ASISTENCIA MEDIANTE FOTOGRAFÍA',
    'Fundación Familias Primero · Programa Leer es Poderoso',
    '',
    `Alumno/a: ${studentName}`,
    `Programa: ${programContext}`,
    '',
    '1. Finalidad',
    'Autorizo el uso de una fotografía grupal del curso con el único fin de registrar la asistencia de mi hijo/a a las actividades del programa. El sistema propone quiénes están presentes y una persona tutora del programa revisa y confirma el resultado.',
    '',
    '2. Datos tratados',
    'Se registra el nombre del alumno/a, el curso, la fecha de asistencia y el resultado (presente o ausente). Del apoderado se guarda el RUN y el resultado de la verificación de identidad. No se almacenan las imágenes de la cédula de identidad.',
    '',
    '3. Conservación',
    'La fotografía grupal del curso se conserva por el tiempo necesario para registrar y respaldar la asistencia, y como máximo hasta un mes después de finalizado el programa. Vencido ese plazo, la imagen se elimina de forma automática.',
    '',
    '4. Revocación',
    'Puedo retirar esta autorización en cualquier momento. Al revocarla, el alumno/a sale de la inscripción y se elimina su foto de referencia. Los registros de asistencia ya confirmados se conservan por razones del programa.',
    '',
    '5. Firma',
    'Declaro ser el tutor legal del alumno/a y autorizo el uso de su fotografía para registrar su asistencia, en los términos aquí descritos. Esta firma corresponde a una firma electrónica simple.',
  ].join('\n');
}
