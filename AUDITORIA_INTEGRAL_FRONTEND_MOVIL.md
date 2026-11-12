# Auditoría integral del frontend móvil OdontoSystem

Fecha: 4 de noviembre de 2026.  
Repositorio auditado: `C:\GitHub\APPFRONTENDODONTO`.  
Backend comparado solo en lectura: `C:\GitHub\OdontoSystem` (código local). No se llamó a Railway ni se instaló el APK.  
No se modificó código de la aplicación. Este archivo es el informe.

Clasificación de estado:

- FUNCIONAL: el código y el contrato local coinciden. No se ejecutó en un dispositivo.
- PARCIAL: existe, pero le falta una parte.
- DEFECTUOSO: el código produce un resultado incorrecto.
- NO IMPLEMENTADO: no hay flujo.
- NO VERIFICABLE: hace falta dispositivo, credenciales o el servidor desplegado.

## 1. Resumen ejecutivo

La app es un cliente React 18 + TypeScript + Vite 5 empaquetado con Capacitor 8 (`com.odontosystem.app`). No hay router: un contexto (`src/store.tsx`) cambia la pantalla. Todas las peticiones pasan por `src/api/http.ts`, que convierte JSON a snake_case, adjunta el JWT y renueva la sesión ante un 401.

Contra el backend local, las rutas que usa la app existen. Historial, citas, pagos, perfil, fotos, documentos, reclamos, apelaciones y la bandeja de notificaciones tienen controller. El paciente puede ver diagnóstico, tratamiento, notas y odontólogo si el odontólogo llegó a guardar la historia.

Los defectos que el código demuestra, sin depender del dispositivo, son estos:

1. El odontólogo no puede registrar la historia de una cita completada en un día anterior: la agenda del formulario empieza hoy.
2. La subida de fotos rechaza el archivo si el navegador no informa `image/jpeg`, `image/png` o `image/webp`. En Android el tipo suele llegar vacío o como HEIC.
3. El chatbot es una sola pantalla de paciente. El odontólogo ve el saludo y los atajos del paciente, y además la barra inferior del paciente.
4. El número de operación y la captura de Yape/Plin no se envían. El pago solo manda el método.
5. Con sesión iniciada no hay barrera de rol: cualquier pantalla se puede abrir si algo llama a `setScreen`.
6. No hay manejador del botón Atrás de Android.
7. ESLint falla. No hay tests.

Nada de esto se probó en el Galaxy A12 en esta auditoría.

## 2. Arquitectura encontrada

Capas:

- Pantallas en `src/screens/`. El paciente vive en dashboard, citas, marketplace, checkout, perfil, notificaciones, chatbot y apelación. El odontólogo vive en `src/screens/dentist/` montado por `DentistPanel.tsx`.
- Estado global en `src/store.tsx` + `storeContext.ts` + `storeHooks.ts`. No hay React Router.
- HTTP en `src/api/`: `http.ts`, `auth.ts`, `usuarios.ts`, `citas.ts`, `catalog.ts`, `panel.ts`, `archivos.ts`, `chatbot.ts`, `reclamos.ts`.
- Un hook de carga: `src/hooks/useAsync.ts`. Cancela con `AbortSignal` cuando cambian las dependencias.
- Utilidades: `src/lib/format.ts`, `pacientes.ts`, `cloudinary.ts`, `push.ts`.

Capacitor (`capacitor.config.ts`): `webDir: dist`, `CapacitorHttp.enabled: true` para que `fetch` salga por la capa nativa y no choque con CORS del WebView (`https://localhost`). Plugins: filesystem, share, push-notifications, google-sign-in. No hay plugin de cámara.

Separación: la UI llama funciones de `src/api` y no arma URLs sueltas. Aun así `store.tsx` mezcla sesión, citas, horarios locales de demostración y funciones que ya no usa la interfaz.

Código muerto o duplicado:

- `WelcomeSplash.tsx` no se monta. El arranque usa `SplashScreen.tsx`.
- `historiaDeCita` y `toDentistLocation` no tienen llamadores. `toDentistLocation` pondría latitud y longitud 0 si alguien lo usara.
- `createAppointmentRequest`, `requestAppointmentReschedule`, `dentistRescheduleAppointment`, `isDayAvailable` y `getAvailableTimeSlots` no los usa ninguna pantalla. `requestAppointmentReschedule` cambiaría el estado local a `REPROGRAMADA` sin llamar al backend.
- `constants.ts` conserva tratamientos y horarios de demostración. El marketplace real usa el catálogo del API. `DAY_LABELS` sí se usa.
- Dependencias declaradas y no importadas en `src`: `@base-ui/react`, `radix-ui`, `shadcn`, `cn`, `class-variance-authority`, `tw-animate-css`, `@fontsource-variable/geist` y `motion` (la app usa `framer-motion`).

## 3. Inventario de funcionalidades por rol

### Paciente

| Función | Estado | Notas |
|---|---|---|
| Registro, login y Google | PARCIAL | El código está. Google nativo en Android no se volvió a probar aquí |
| Sesión al reabrir | FUNCIONAL | Refresh en `localStorage`, access solo en memoria. No probado al matar la app |
| Perfil y teléfono | FUNCIONAL | `PATCH /api/usuarios/yo`. El nombre del paciente no se edita en su perfil |
| Foto de perfil | DEFECTUOSO | El selector existe; la validación de MIME puede bloquearla en Android |
| Buscar odontólogo y reservar | FUNCIONAL | Catálogo, disponibilidad y `POST /api/citas` coinciden con el backend local |
| Pagar depósito | PARCIAL | El POST existe. Yape/Plin exigen 6 dígitos que no viajan. El QR es ilustrativo. La captura no se adjunta |
| Mis citas, cancelar, reprogramar | FUNCIONAL | Contratos presentes. No ejecutado con una cita real en esta auditoría |
| Historial clínico | PARCIAL | La lectura está bien. Depende de que el odontólogo haya podido guardar |
| Notificaciones | FUNCIONAL | `GET/PATCH /api/usuarios/yo/notificaciones` existe. El comentario del archivo dice lo contrario y está desactualizado |
| Reseñas | FUNCIONAL | `GET /api/citas/por-resenar` y `POST /api/citas/{id}/resena` |
| Apelación de inasistencia | FUNCIONAL | Multipart `certificado`. Contrato presente |
| Constancias PDF | FUNCIONAL | `GET /api/citas/{id}/constancia` y guardado con Filesystem + Share en Android |
| Reclamos | FUNCIONAL | Rutas de `reclamos.ts` existen |
| Chatbot | PARCIAL | Llama al API real. La interfaz no distingue el rol y no usa el historial |
| Mapa y ubicación | PARCIAL | Pide geolocalización y fichas con coordenadas. No se probó el permiso en el teléfono |

### Odontólogo

| Función | Estado | Notas |
|---|---|---|
| Panel, agenda y completar cita | PARCIAL | Confirmar, completar e inasistencia existen. La agenda visible es de 14 días hacia adelante |
| Historia clínica | DEFECTUOSO | El POST coincide. El formulario no ofrece citas de días anteriores |
| Lista y ficha de pacientes | PARCIAL | `GET /api/odontologos/yo/pacientes` y `GET /api/pacientes/{id}` sí existen. Alergias y antecedentes llegan `null` a propósito |
| Perfil, horarios, servicios, bloqueos | FUNCIONAL | `MiConsultorioController` cubre esas rutas |
| Foto de perfil y galería | DEFECTUOSO | Misma validación de MIME. Campo `archivo` correcto. Máximo 10 fotos en la UI |
| Documentos COP | PARCIAL | `POST /api/odontologos/yo/documentos?tipo=` existe. PDF, JPG y PNG. HEIC no |
| Verificación | FUNCIONAL | Consulta y reintento existen |
| Apelaciones y ausencias | FUNCIONAL | Rutas de panel presentes en el backend local |
| Liquidaciones | FUNCIONAL | JSON y Excel existen. No se abrió un archivo real |
| Chatbot | PARCIAL | El backend local saluda distinto al odontólogo, pero la pantalla no |
| Ingresos a pantallas del otro rol | DEFECTUOSO | No hay guarda de rol con la sesión ya abierta |

## 4. Endpoints y compatibilidad

Convención: JSON en snake_case, JWT `Authorization: Bearer`, multipart sin `Content-Type` fijo. Comparado con los controllers del backend local. El despliegue de Railway no se comprobó.

| Método y ruta | Uso | Backend local |
|---|---|---|
| POST `/api/auth/login`, `/register`, `/refresh`, `/logout`, `/recuperar-password`, `/restablecer-password`, `/google`, `/google/registro` | Sesión | Existe |
| GET/PATCH `/api/usuarios/yo` | Perfil | Existe |
| POST `/api/usuarios/yo/verificar-correo` y `/codigo` | Correo | Existe |
| POST `/api/usuarios/yo/eliminar-cuenta` | Baja | Existe |
| GET `/api/usuarios/yo/consentimientos`, GET `/api/public/privacidad` | Privacidad | Existe |
| POST `/api/usuarios/yo/dispositivos` y `/quitar` | Push | Existe |
| GET/PATCH `/api/usuarios/yo/notificaciones` y `/leida`, `/leidas` | Bandeja | Existe |
| PUT `/api/usuarios/yo/foto` | Foto, campo `archivo` | Existe |
| GET `/api/usuarios/yo/reputacion` | Strikes | Existe |
| GET `/api/odontologos`, `/{id}`, `/disponibilidad`, `/resenas` | Catálogo | Existe |
| GET `/api/catalogos/especialidades`, `/categorias-servicio`, `/distritos` | Filtros | Existe |
| GET/PATCH `/api/odontologos/yo/perfil` | Consultorio | Existe |
| CRUD `/api/odontologos/yo/servicios`, `/horarios`, `/bloqueos` | Consultorio | Existe |
| GET/POST `/api/odontologos/yo/verificacion` y `/reintentar` | COP | Existe |
| GET/POST/DELETE `/api/odontologos/yo/fotos` | Galería, campo `archivo` | Existe |
| GET/POST `/api/odontologos/yo/documentos` | Documentos, campo `archivo`, `tipo` en query | Existe |
| GET `/api/odontologos/yo/citas` y PATCH confirmar, completar, inasistencia | Agenda | Existe |
| GET/POST `/api/odontologos/yo/agenda-hoy` | Cierra el día | Existe |
| GET `/api/odontologos/yo/pacientes` | Lista | Existe |
| GET `/api/pacientes/{id}` | Ficha. Alergias null | Existe |
| GET `/api/odontologos/yo/historias?paciente_id=` | Historias escritas | Existe |
| POST/GET `/api/citas/{id}/historia` | Alta y lectura | Existe |
| GET `/api/historias/mias` | Historial del paciente | Existe |
| POST `/api/citas`, GET `/mias`, GET `/{id}` | Reservas | Existe |
| POST `/api/citas/{id}/pagar` | Solo `metodo` y, si hay, token de Mercado Pago | Existe |
| PATCH `/api/citas/{id}/cancelar`, POST `/reprogramar` | Cambios | Existe |
| POST `/api/citas/{id}/asistencia` | Reporte del paciente | Existe |
| GET `/api/citas/{id}/reembolsos`, `/constancia` | Pagos | Existe |
| GET `/api/public/pagos/config` | Modo de pago | Existe. El default local es `simulado` y Plin no disponible |
| POST/GET apelaciones y reseñas | Reputación | Existe |
| GET/POST reportes de ausencia | Gestión | Existe |
| GET `/api/odontologos/yo/liquidaciones` y `/excel` | Ingresos | Existe |
| POST/GET/PATCH `/api/reclamos` y `/api/odontologos/yo/reclamos` | Reclamos | Existe |
| POST `/api/chatbot/mensaje`, GET `/api/chatbot/sesiones/{id}/mensajes` | Chat | Existe. El GET no se usa |

No apareció ninguna ruta del frontend sin controller en este backend local.

Diferencias de contrato que sí importan:

- `Historia`: mismos nombres (`diagnostico`, `tratamiento`, `notas`, `odontologo` como texto, `fechaCita`, `servicio`). Compatible.
- `PacienteDetalle.alergias` y `antecedentes` son null hasta que exista captura. La ficha muestra «No disponible». No es un 404.
- El número de operación de Yape no está en el body del frontend. El backend simulado aprueba sin él.
- El listado de odontólogos no trae latitud ni longitud. El mapa las pide una a una con `GET /api/odontologos/{id}`.

Errores y tiempos: no hay timeout. Un 401 renueva el access una vez y, si falla, cierra sesión. Un 403 se muestra como mensaje del backend. Tres fallos de red seguidos bloquean 5 segundos. Las listas vacías y los `useAsync` tienen estado de carga, error y reintento en los flujos revisados.

## 5. Bugs confirmados

### BUG-01 — No se puede escribir la historia de una cita pasada

- Descripción: el formulario solo lista citas `COMPLETADA` que caen entre hoy y los próximos 30 días. La agenda en pantalla solo muestra 14 días hacia adelante.
- Evidencia: `DIAS_ATRAS = 0` en `src/screens/dentist/PatientDetail.tsx`. `DIAS_AGENDA = 14` en `src/screens/dentist/Agenda.tsx`. El backend acepta cualquier cita `COMPLETADA` sin otra historia (`HistoriaClinicaService.registrar`).
- Impacto: al día siguiente el odontólogo no ve el botón Registrar, aunque la cita siga sin historia.
- Causa: confirmada en código.
- Solución: pedir la agenda hacia atrás los días en los que todavía se puede escribir la historia, y mostrar esas citas en el formulario.
- Prueba: completar una cita, cambiar la fecha del dispositivo o usar una cita de ayer, abrir la ficha y comprobar que el formulario aparece y el paciente la ve en Historial.

### BUG-02 — La validación de imagen bloquea archivos válidos para el teléfono

- Descripción: `validarImagen` exige `file.type` en `image/jpeg`, `image/png` o `image/webp`.
- Evidencia: `src/api/archivos.ts`. La usan la foto de perfil del odontólogo, la galería y la foto del paciente. El backend valida los bytes, no el MIME (`ArchivoService`).
- Impacto: si Android entrega tipo vacío, la subida ni sale. HEIC tampoco pasa.
- Causa: la regla del cliente está confirmada. Que el Galaxy A12 entregue MIME vacío es una hipótesis de reproducción.
- Solución: si `file.type` viene vacío, aceptar por extensión jpg/jpeg/png/webp y dejar que el servidor rechace el resto. Mostrar el mensaje HTTP.
- Prueba: en el A12 elegir una JPEG de la galería, una HEIC y cancelar el selector.

### BUG-03 — El chatbot del odontólogo usa la cáscara del paciente

- Descripción: el saludo y los atajos están fijos («Buscar odontólogo», «Mis citas», «Menú»). `chatbot` está en `PATIENT_SCREENS`, así que el odontólogo ve la barra del paciente.
- Evidencia: `src/screens/Chatbot.tsx`, `src/App.tsx`. El backend, si el JWT es de odontólogo, responde la agenda de 7 días y niega agendar por chat (`ChatbotService`).
- Impacto: el primer mensaje que ve el odontólogo no es el del servidor. Puede entrar al flujo de reserva de pacientes.
- Causa: confirmada en la UI. La respuesta real del servidor no se volvió a ejecutar en esta auditoría.
- Solución: saludo y atajos según el rol. Quitar la barra de paciente cuando el rol es odontólogo. Seguir usando `POST /api/chatbot/mensaje`.
- Prueba: abrir el chat con cada rol y pulsar «Mis citas».

### BUG-04 — Yape/Plin piden datos que no se envían

- Descripción: el botón espera 6 dígitos. Hay un input de captura sin `onChange`. `pagarDeposito` solo envía `metodo` y, en tarjeta Mercado Pago, el token.
- Evidencia: `src/screens/checkout/index.tsx`, `QrPanel.tsx`, `src/api/citas.ts`. El QR está documentado en el propio componente como ilustrativo.
- Impacto: el usuario cree que el número y la captura forman parte del pago. En modo simulado el backend aprueba igual.
- Causa: confirmada en código. El modo real de Railway no se consultó.
- Solución: si el modo es simulado, no exigir el número ni ofrecer una captura que no se guarda. Si Mercado Pago exige un comprobante, hay que acordar el campo con el backend antes de enviarlo.
- Prueba: pagar en simulado y en Mercado Pago y revisar el body de `POST /api/citas/{id}/pagar`.

### BUG-05 — No hay guarda de rol con la sesión abierta

- Descripción: sin sesión, unas pantallas vuelven al login. Con sesión, `setScreen` no mira el rol. Un paciente que llegue a `dentistPanel` dispara APIs de odontólogo y verá 403. Un odontólogo en el chat ya entra en pantallas de paciente.
- Evidencia: `App.tsx` líneas del efecto `PROTEGIDAS`. `apelacion` y `chatbot` ni siquiera están en esa lista para usuarios anónimos.
- Impacto: no filtra datos por sí solo, porque el backend exige rol, pero la navegación queda incoherente y un anónimo puede abrir el chat y recibir 401.
- Causa: confirmada.
- Solución: si hay sesión, mandar cada rol a su conjunto de pantallas. Exigir sesión para el chat.
- Prueba: con cada rol, intentar abrir el panel del otro y el chat sin login.

### BUG-06 — ESLint no pasa

- Descripción: `VerifiedBadge` está declarado y no se usa en `ProfileHeader.tsx`. `coordenadaValida` se exporta junto al componente del mapa.
- Evidencia: `npm run lint` terminó con 1 error y 1 warning.
- Impacto: la comprobación de calidad está rota. No cambia el runtime.
- Causa: confirmada.
- Solución: borrar el componente muerto y mover la función fuera del archivo del mapa.
- Prueba: `npm run lint` sin errores.

## 6. Problemas potenciales por reproducir

### POT-01 — El selector de archivos no abre en el WebView

- Hipótesis: Capacitor no declara `CAMERA` ni `READ_MEDIA_IMAGES`. En Android 13 el selector del sistema no debería necesitarlos. Si el cuadro no aparece, el fallo está en el file chooser del WebView, no en el MIME.
- Dónde: `AndroidManifest.xml`, inputs de `dentist/Profile.tsx` y `patientProfile/ProfileHeader.tsx`.
- Prueba: pulsar la cámara del perfil en el A12 y anotar si abre galería, documentos o nada.

### POT-02 — CapacitorHttp y el multipart

- Hipótesis: el puente nativo convierte el `File` a base64 y rearma `multipart/form-data` con el campo `archivo` (`native-bridge.js`, `CapacitorHttpUrlConnection.java`). Si `btoa` falla con el binario, la UI muestra un error genérico.
- Prueba: subir una JPEG de menos de 5 MB con la red visible y leer el status. 200 y URL de Cloudinary significan que el multipart está bien.

### POT-03 — Geolocalización al volver de los ajustes

- Hipótesis: los permisos están en el manifest. No se comprobó conceder, denegar y regresar a la app.
- Prueba: mapa del dashboard en el A12.

### POT-04 — Teclado y scroll en formularios largos

- El manifest tiene `adjustResize` y el viewport `interactive-widget=resizes-content`. El perfil del odontólogo es una página larga dentro de `min-h-screen`. No se recorrió con el teclado abierto.
- Prueba: horario, bloqueo y diagnóstico en 360 px de ancho con el teclado visible.

### POT-05 — Railway distinto de este backend

- Hipótesis: si producción no tiene aún pacientes, notificaciones o historias, la app fallará aunque el código local coincida.
- Prueba: una llamada autenticada a `GET /api/historias/mias`, `GET /api/usuarios/yo/notificaciones` y `GET /api/odontologos/yo/pacientes`.

## 7. Funcionalidades incompletas o ausentes

- NO IMPLEMENTADO: imágenes dentro del diagnóstico o del tratamiento.
- NO IMPLEMENTADO: edición de una historia ya guardada. El backend también la prohíbe.
- NO IMPLEMENTADO: chatbot con historial persistente en la UI. `historialChat` no se llama. `sesionId` se pierde al salir.
- NO IMPLEMENTADO: la UI no pinta `datos` cuando la respuesta del chat es `lista_citas` o `lista_odontologos`. Solo muestra el texto y los botones.
- NO IMPLEMENTADO: botón Atrás de Android. No hay `App.addListener('backButton')`.
- PARCIAL: el paciente no edita su nombre. El odontólogo sí, en su perfil.
- PARCIAL: alergias y antecedentes no se capturan en ningún formulario. El backend las devuelve null.
- PARCIAL: Plin figura en la UI y el backend local lo marca no disponible. Hay que comprobar que el checkout lo deshabilita con `configuracionPagos`.
- AUSENTE: tests unitarios, de integración y E2E. No hay script `test` ni Playwright.
- AUSENTE: Prettier. No hay script de formato.

## 8. Problemas de seguridad

### SEC-01 — Refresh token en localStorage

- El access token vive en memoria. El refresh (`odonto_refresh_token`) está en `localStorage`. Un XSS podría leerlo. El propio `http.ts` lo documenta.
- Prioridad: MEDIO. No moverlo a otro almacén sin un diseño de Capacitor. No imprimir el token en logs.
- Prueba: iniciar sesión, recargar y comprobar que la sesión vuelve sin que el access quede en `localStorage`.

### SEC-02 — Pantallas cruzadas

- Ver BUG-05. El backend es quien niega el dato. La app no debe ofrecer el camino.
- Prioridad: ALTO para la navegación, no como fuga confirmada.

### SEC-03 — Datos de tarjeta

- El checkout dice que la tarjeta no se envía al backend propio. En modo Mercado Pago va el token de la pasarela. En simulado no hay cobro. No se revisó el SDK en runtime.
- Prioridad: MEDIO. Prueba: en el modo simulado, el body de pagar no lleva PAN ni CVV.

### SEC-04 — DNI

- El encabezado del paciente enmascara el documento. No se encontró un log del número. Prioridad: BAJO.

No se incluyen client IDs, SHA-1 ni tokens en este informe.

## 9. Experiencia móvil

### UX-01 — Historias fuera de alcance

- Mismo caso que BUG-01. Prioridad: CRÍTICO para el flujo clínico.

### UX-02 — Perfil del odontólogo y ficha del paciente comparten pestaña

- `dentistTab === 'history'` es a la vez Perfil y ficha del paciente. Con un paciente seleccionado, Perfil muestra la ficha y esconde la barra. Al volver, salta a Agenda.
- Archivo: `src/screens/DentistPanel.tsx`.
- Prioridad: ALTO. El odontólogo puede creer que no tiene pantalla de fotos.
- Prueba: abrir un paciente y pulsar Perfil. Debe verse el perfil, no la ficha, o la ficha debe tener su propia sección.

### UX-03 — Chat y barra inferior

- BUG-03. El campo de texto del chat reserva espacio para esa barra. En el odontólogo el espacio sobra o tapa el FAB.
- Prioridad: ALTO.

### UX-04 — Scroll del paciente

- Las pantallas de paciente usan la altura del shell y un solo scroll. El odontólogo sigue en `min-h-screen` y scroll del documento. No se repitió la prueba visual de 360×800 más allá del login en una auditoría anterior.
- Prioridad: MEDIO. Volver a recorrer reserva, perfil e historial en el A12.

### UX-05 — Mapa

- Altura `38dvh`, zoom táctil, sin rueda. El botón «Mi ubicación» no tapa la atribución. Sin dispositivo no se afirma que el GPS funcione.
- Prioridad: MEDIO.

### UX-06 — Accesibilidad

- Hay `aria-label` en botones principales, alertas y estados de carga. El contraste y el lector de pantalla no se probaron.
- Prioridad: BAJO.

### UX-07 — Comentario falso en notificaciones

- `PatientNotifications.tsx` dice que no existe bandeja. El código sí la consume. Confunde el mantenimiento.
- Prioridad: BAJO.

## 10. Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| Lectura del frontend y de los controllers locales | Hecha. No es una prueba de ejecución |
| `npm run typecheck` | Pasó. `tsc --noEmit` no imprimió errores |
| `npm run lint` | Falló. 1 error (`VerifiedBadge`) y 1 warning (`react-refresh/only-export-components`) |
| `npm run build` | No se lanzó en esta auditoría |
| `npx cap sync` y `assembleDebug` | No se lanzaron |
| Prueba en Galaxy A12 | No |
| Llamadas autenticadas al API | No |
| `npm test` / Playwright | No existen |
| `npm audit` | No se ejecutó |

## 11. Archivos por problema

| ID | Archivos |
|---|---|
| BUG-01 | `src/screens/dentist/PatientDetail.tsx`, `src/screens/dentist/Agenda.tsx`, `src/api/panel.ts` |
| BUG-02 | `src/api/archivos.ts`, `src/screens/dentist/Profile.tsx`, `src/screens/patientProfile/index.tsx`, `src/screens/patientProfile/ProfileHeader.tsx` |
| BUG-03 | `src/screens/Chatbot.tsx`, `src/api/chatbot.ts`, `src/App.tsx`, `src/screens/DentistPanel.tsx` |
| BUG-04 | `src/screens/checkout/index.tsx`, `src/screens/checkout/QrPanel.tsx`, `src/api/citas.ts` |
| BUG-05 | `src/App.tsx`, `src/store.tsx` |
| BUG-06 | `src/screens/patientProfile/ProfileHeader.tsx`, `src/components/PatientMapInner.tsx` |
| UX-02 | `src/screens/DentistPanel.tsx` |
| SEC-01 | `src/api/http.ts` |
| POT-01 | `android/app/src/main/AndroidManifest.xml`, `capacitor.config.ts` |

## 12. Prioridad

| Prioridad | IDs |
|---|---|
| CRÍTICO | BUG-01 |
| ALTO | BUG-02, BUG-03, BUG-05, UX-02 |
| MEDIO | BUG-04, SEC-01, SEC-03, UX-04, UX-05, POT-01, POT-02, POT-05 |
| BAJO | BUG-06, SEC-04, UX-06, UX-07, código muerto y dependencias sin uso |

## 13. Plan de corrección

El orden respeta dependencias. No cambia contratos que ya coinciden.

1. BUG-01. Ampliar el rango de la agenda antes de tocar la pantalla del paciente. El `POST /api/citas/{id}/historia` se queda igual.
2. BUG-02. Relajar la validación de MIME y mostrar el error del servidor. No cambiar el nombre del campo `archivo`.
3. UX-02. Separar la ficha del paciente de la pestaña Perfil para que las fotos sean alcanzables.
4. BUG-03 y BUG-05. Ajustar navegación por rol y el chat. Son el mismo `setScreen`.
5. BUG-04. Alinear el checkout con `GET /api/public/pagos/config`. No inventar un campo de comprobante.
6. BUG-06 y el código muerto. Limpieza después de los flujos.
7. POT-05. Solo si una llamada a Railway demuestra que falta una ruta. Entonces se para y se propone el cambio de backend.

## 14. Riesgos en componentes compartidos

| Pieza | Riesgo |
|---|---|
| `src/api/http.ts` | Tocar FormData o el refresh afecta login, fotos, apelaciones y constancias |
| `src/store.tsx` | Cambiar `setScreen` o el rol puede sacar al odontólogo de su panel al restaurar la sesión |
| `src/App.tsx` | El shell de altura es el que evita el doble scroll del paciente. Un `overflow` global vuelve a recortar al odontólogo |
| `src/screens/Chatbot.tsx` | Lo abren los dos roles. Un texto fijo nuevo vuelve a mentir a uno de ellos |
| `src/api/archivos.ts` | La misma validación cubre paciente, galería y, si se endurece de más, documentos PDF |
| `src/hooks/useAsync.ts` | Depender del objeto entero en un `useEffect` reintroduce el bucle del historial |

## 15. Pruebas para validar cada corrección

1. Historia: cita completada hoy y cita completada ayer. Guardar diagnóstico, tratamiento y notas. Abrir Historial del paciente y ver odontólogo, servicio, fecha, diagnóstico y tratamiento. Intentar guardar dos veces y esperar el conflicto del backend.
2. Fotos: JPEG, PNG, WEBP, HEIC y tipo vacío en el A12, por debajo y por encima de 5 MB. Ver la imagen después del 200 y poder borrarla de la galería.
3. Perfil: con un paciente abierto, la pestaña Perfil muestra datos, foto y documentos.
4. Roles: paciente no entra al panel. Odontólogo no ve la barra de paciente en el chat. Sin sesión, el chat vuelve al login.
5. Pago: en simulado, el body solo lleva el método. La UI no pide un comprobante que no se guarda.
6. Calidad: `npm run typecheck`, `npm run lint` y, antes de instalar, `npm run build`, `npx cap sync android` y `assembleDebug` con JDK 21.
7. Regresión: login con correo, login con Google, cerrar y abrir la app, cancelar una cita y marcar una notificación leída.

## Hallazgos con el formato pedido

### BUG-01

- ID: BUG-01
- Descripción: la historia clínica no se ofrece para citas completadas de días anteriores.
- Evidencia: ventana de agenda desde hoy.
- Archivo: `src/screens/dentist/PatientDetail.tsx`, `src/screens/dentist/Agenda.tsx`.
- Impacto: el paciente no recibe esa atención en su historial.
- Causa: confirmada.
- Solución: incluir días pasados en la consulta y en el formulario.
- Prueba: ver sección 15.1.

### BUG-02

- ID: BUG-02
- Descripción: la foto se rechaza si el MIME no es jpeg, png o webp.
- Evidencia: `validarImagen`.
- Archivo: `src/api/archivos.ts`.
- Impacto: no se puede subir la foto desde varios selectores de Android.
- Causa: regla confirmada. El MIME vacío del A12 es hipótesis.
- Solución: aceptar extensión cuando el tipo venga vacío y enseñar el error del servidor.
- Prueba: ver sección 15.2.

### BUG-03

- ID: BUG-03
- Descripción: un solo chatbot, con copy de paciente, también para el odontólogo.
- Evidencia: textos fijos y `PATIENT_SCREENS`.
- Archivo: `src/screens/Chatbot.tsx`, `src/App.tsx`.
- Impacto: el odontólogo no ve su agenda conversacional y cae en flujos de reserva.
- Causa: confirmada en UI.
- Solución: ramificar la pantalla por rol sin endpoint nuevo.
- Prueba: ver sección 15.4.

### BUG-04

- ID: BUG-04
- Descripción: número de operación y captura de pago no salen del teléfono.
- Evidencia: `pagarDeposito` y el input de archivo sin manejador.
- Archivo: `src/screens/checkout/index.tsx`, `QrPanel.tsx`.
- Impacto: el pago simulado ignora datos que la UI trata como necesarios.
- Causa: confirmada.
- Solución: quitar el requisito o acordar el campo con el backend.
- Prueba: ver sección 15.5.

### BUG-05

- ID: BUG-05
- Descripción: la sesión abierta no restringe pantallas por rol.
- Evidencia: el efecto de `App.tsx` solo corre cuando `isAuth` es falso.
- Archivo: `src/App.tsx`.
- Impacto: navegación cruzada y chat anónimo.
- Causa: confirmada.
- Solución: conjuntos de pantallas por rol.
- Prueba: ver sección 15.4.

### BUG-06

- ID: BUG-06
- Descripción: ESLint falla por código sin usar.
- Evidencia: salida de `npm run lint`.
- Archivo: `src/screens/patientProfile/ProfileHeader.tsx`.
- Impacto: la verificación automática no está verde.
- Causa: confirmada.
- Solución: eliminar `VerifiedBadge`.
- Prueba: `npm run lint`.
