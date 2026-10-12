# Familias Primero · Asistencia por foto con consentimiento en línea

> 👋 **¿Te sumas al equipo?** Parte por **[ONBOARDING_EQUIPO.md](./ONBOARDING_EQUIPO.md)**
> para dejar tu entorno listo y conocer el flujo de trabajo (ramas + Pull Request).

Prototipo de app **nativa (Android / iOS) y web** para la Fundación Familias Primero,
programa *Leer es Poderoso*. Cubre dos flujos en paralelo:

1. **Onboarding de niños** por parte de los apoderados (tutores legales), con foto del
   niño, elección de zona y firma del consentimiento en línea.
2. **Operación del programa** por parte del equipo (administrador, coordinador,
   tutor), con versiones del programa, zonas, asistencia por foto y monitoreo.

Construido con **Expo (React Native) + expo-router + TypeScript**: una sola base de
código corre en teléfono/tablet Android, iOS y navegador.

> **Versión con datos simulados** (sin backend). Reconocimiento facial, verificación
> de cédula y envío de correo están simulados y aislados para reemplazarlos luego por
> servicios reales. El inicio de sesión es un selector de rol (más adelante: usuario
> y clave).

---

## Requisitos

- Node.js 18+ (probado con Node 24)
- **Watchman** (recomendado en macOS): `brew install watchman`
- Para probar en teléfono: la app **Expo Go**

## Instalación y ejecución

```bash
cd app-familias-primero
npm install
npm run web      # navegador (http://localhost:8081)
npm start        # Android/iOS con Expo Go (escanea el QR)
npm run typecheck
npm run export:web   # build web estático en dist/
```

> macOS: si aparece `EMFILE: too many open files`, instala Watchman. Alternativa
> puntual: `npm run web:safe`.

---

## Organizaciones y licencias (multi-tenant)

La fundación puede **transferir el programa** licenciándolo a municipalidades o
instituciones. Cada **organización** es un tenant con sus propias versiones, zonas,
usuarios y niños (**aislamiento total** entre organizaciones). Cada organización tiene
una **licencia** (activa/suspendida, con fechas).

## Roles

Al abrir la app eliges un rol (y, según el rol, la organización y tu usuario):

| Rol | Qué puede hacer |
|---|---|
| **Superusuario** | Siempre de la fundación. Hace todo. Crea **organizaciones (licencias)** y **administradores**; activa/suspende licencias; puede **cambiar de organización activa** para operar dentro de cualquiera. |
| **Administrador** | De la fundación o de una municipalidad. Gestiona **su organización**: versiones, zonas (con contacto), usuarios, asignaciones por versión y carga masiva. No pasa asistencia. |
| **Coordinador** | A cargo de varias zonas de su organización. Monitorea (seleccionando zonas, vista **agrupada por zona**) y exporta. |
| **Tutor** | Atiende zonas de su organización en la versión. Inicia inscripción (QR), inscribe niños, **pasa asistencia** y monitorea/exporta sus zonas. |
| **Apoderado** | Elige la organización del programa e inscribe a cuantos hijos quiera: versión, zona, datos del niño, foto y consentimiento. |

La **visibilidad** sigue la jerarquía: superusuario ve todas las organizaciones; admin
ve todo lo de su organización; coordinador y tutor solo sus zonas asignadas; apoderado
solo su flujo de onboarding. El superusuario, además de gestionar licencias, puede
seleccionar una organización activa (chip de organización en el encabezado) y operar
como si fuera su administrador.

## Conceptos

- **Versión del programa**: convocatoria por temporada y año (ej. *Verano 2027*). No
  tiene fechas propias; parte vacía. Las crea el administrador.
- **Zona**: institución (colegio, municipalidad, biblioteca…) con nombre, dirección y
  un **contacto responsable** (nombre, teléfono, correo, cargo) con **historial de
  usos**. Pertenecen a un catálogo que mantiene el administrador.
- **Zona en una versión** (`ZoneAssignment`): una zona participa en una versión con
  **fechas propias de inicio y fin** (se sugiere fin = inicio + 10 días hábiles,
  editable). La misma zona puede tener fechas distintas en versiones distintas.
- **Asignación de staff** (`StaffAssignment`): tutores y coordinadores se asignan a
  zonas **por versión** (un tutor puede atender una zona en Verano y otra en Invierno).
- **Foto del niño**: se sube en el onboarding (junto con nombre, fecha de nacimiento,
  curso y RUN, todos obligatorios) y es la **foto de referencia** del reconocimiento
  facial (simulado). Cada niño registra además su **canal de ingreso** (apoderado o
  tutor) y qué usuario lo inscribió.

Flujo de alta: primero se **confirma la zona** (institución + contacto) y se agrega a
la versión con sus fechas; luego se **convoca a los niños**.

## Flujos

**Onboarding (apoderado, o iniciado por tutor con QR o "Inscribir yo mismo")**
1. Elegir versión + zona (si viene del QR del tutor o del flujo directo del tutor,
   quedan precargadas, el canal se marca como *tutor* y se registra qué usuario lo
   inició).
2. Datos del niño (todos obligatorios): nombre, fecha de nacimiento, curso/nivel y
   RUN (validado por módulo 11).
3. Foto del niño (cámara real o simulada), obligatoria → crea al niño.
4. Consentimiento 1a–1d: documento, datos del tutor legal (RUN validado), firma
   dibujada y confirmación. Se puede **inscribir otro niño** al terminar.

**Asistencia (solo tutor)**
1. Elegir la zona (si tiene varias) de la versión activa.
2. Foto del grupo → reconocimiento simulado contra las fotos de referencia de los
   niños inscritos en esa zona/versión.
3. Revisar (alternar Presente/Ausente, asignar rostros sin identificar) y confirmar.

**Monitoreo y exportación (tutor / coordinador / admin)**
- Matriz acumulada de asistencia (niños × días) para la versión activa, filtrada por
  las zonas que te corresponden. Maneja **enrolamiento tardío** (días previos a la
  inscripción aparecen como “no enrolado”).
- **Exportar CSV**: en web descarga un archivo; en móvil abre el diálogo de compartir.

## Estructura

```
app/
  _layout.tsx            SessionProvider + AppStoreProvider + marco de teléfono
  index.tsx              Dispatcher: redirige según rol de la sesión
  login.tsx              Selector de rol (y usuario del equipo)
  admin/                 index + versiones + zonas (con fechas y contacto) + usuarios
  coordinador/index.tsx  Home del coordinador
  tutor/                 index + qr (iniciar inscripción)
  apoderado/index.tsx    Home del apoderado
  onboarding/            _layout + index(versión/zona) + nino(datos) + foto + 1a..1d
  asistencia/            _layout + foto + revision (solo tutor)
  inscritos.tsx          Lista por rol/zona de la versión
  monitoreo.tsx          Asistencia acumulada agrupada por zona + exportar CSV
src/
  domain/                types, run (módulo 11), document, format, seed, retention,
                         faceRecognition (simulado), monitor (matriz), qr, csv,
                         bulkImport (xlsx/csv)
  store/                 AppStore (datos), SessionStore (rol+versión activa),
                         OnboardingFlow, ConsentFlow, AttendanceFlow, useScope
  components/            Button, Field, Card, Banner, SignaturePad, Screen (+BackButton),
                         RoleHeader, VersionPicker, Select (dropdown/multiselect), Tile
```

### Carga masiva (zonas y usuarios)

Desde los paneles de **Zonas** y **Usuarios** el administrador puede importar en lote
desde `.xlsx`, `.csv` o `.txt` (SheetJS). Hay una **plantilla descargable** en cada
panel. Columnas reconocidas (sin distinguir mayúsculas/acentos):

- Zonas: `nombre`, `direccion`, `tipo`, `contacto_nombre`, `contacto_telefono`,
  `contacto_email`, `contacto_cargo`.
- Usuarios: `nombre`, `rol` (tutor/coordinador), `email`.

## Datos de ejemplo (demo)

- 2 organizaciones: **Fundación Familias Primero** (licencia activa) y
  **Municipalidad de La Pintana** (licencia activa con fecha de término).
- 1 superusuario de la fundación.
- Fundación: admin, coordinador, 3 tutores; zonas Lo Espejo, Biblioteca La Pintana,
  Municipalidad de El Bosque; versión *Verano 2027* con 2 zonas participantes y 22
  niños en Lo Espejo (con foto y datos completos; algunos por canal *tutor*, otros
  por *apoderado*).
- Municipalidad: su propio admin y tutor, su zona (Escuela Municipal Las Rosas) y su
  versión *Invierno 2027* (vacía), para demostrar el aislamiento entre organizaciones.

## Qué está simulado (y dónde reemplazarlo)

| Simulación | Archivo | Reemplazo real |
|---|---|---|
| Inicio de sesión | `src/store/SessionStore.tsx` | Usuario/clave o SSO |
| Reconocimiento facial | `src/domain/faceRecognition.ts` | Servicio de visión con las fotos de referencia |
| Verificación de cédula / RUN | `src/domain/run.ts` | ClaveÚnica / Registro Civil |
| QR entre dispositivos | `src/domain/qr.ts` + `app/tutor/qr.tsx` | Enlace firmado / token server-side |
| Envío de correo | `app/onboarding/1d.tsx` | Servicio de correo del backend |

## Protección de datos

- La foto grupal se conserva **hasta un mes después de la fecha de fin de esa
  zona-versión**. Vencido el plazo se elimina automáticamente. Política en
  `src/domain/retention.ts`; limpieza al iniciar (`purgeExpiredPhotos`).
- No se guardan imágenes de la cédula, solo el RUN y el resultado de la verificación.
- Se registra quién confirmó cada asistencia y cuándo, y qué tutor inició cada
  inscripción.
- Revocar el consentimiento saca al niño de la inscripción y borra su foto; la
  asistencia ya confirmada se conserva.

## Pendientes antes del piloto (revisar con asesoría legal)

- Firma electrónica avanzada (Ley 19.799) vs. la firma simple actual.
- Verificación real de identidad (ClaveÚnica / Registro Civil).
- Servicio de reconocimiento facial y alojamiento de datos de menores.
- Inicio de sesión real por usuario y clave.
