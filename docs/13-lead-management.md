# Lead management híbrido (CRM + gestor de leads de WhatsApp)

> Fase 26. Basado en el Documento maestro de Realtor Pro / Legacy Capital, el
> Manual funcional de la referencia (Hola Sofía, V01–V16) y el estado real de
> las cuentas al 22-nov-2026.

## 1. Qué es "híbrido"

| Mundo CRM (ya existía) | Mundo gestor de leads (nuevo) |
|---|---|
| Contacto 360°, pipeline con montos y comisiones, propiedades, visitas, automatizaciones, analytics, portal, copiloto | Entrada automática desde anuncios click-to-WhatsApp, un contacto por identidad WhatsApp, datos capturados ("casas"), estrellas, subetapa, BOT/REACT, archivar ≠ bloquear, ventana de 24 h, reparto entre asesores, atribución por anuncio, costo por lead, retroalimentación a Meta (CAPI) |

Ambos operan sobre **el mismo contacto**: `/leads`, `/inbox` y `/contacts` son vistas del mismo registro.

## 2. Reglas conservadas de la referencia (implementadas)

- **Tres dimensiones separadas**: datos capturados (`contact_facts`, con fuente y fecha), valoración humana (`stars`), etapa comercial (`sub_stage` + `outcome`). Las casas **no** son un embudo secuencial.
- **Corrección de datos** por un asesor cambia la fuente a `advisor`; nunca se presenta como lectura de IA.
- **Mensaje humano apaga la IA** (`bot_enabled=false`, motivo `human_reply`, quién y cuándo) y limpia "Atención". REACT es un interruptor aparte y no cambia.
- **Archivar** solo oculta; **Bloquear** impide todo envío (manual, plantilla y automático).
- **Ventana de 24 h** se cuenta desde el último mensaje **del cliente** (`last_inbound_at`). Fuera de ella, el servidor rechaza texto libre.
- **Atribución por primer clic**: cada toque de anuncio se guarda; uno solo se acredita (`is_first_touch`). Sin metadatos de anuncio no se inventa un anuncio (`organic_whatsapp`).
- **Reparto**: equitativo (turnos entre asignables) o ponderado (déficit contra % objetivo). `assignable` es independiente del rol; los administradores no rotan salvo que se marquen. Cada asignación queda en `assignment_logs` con su motivo.
- **Idempotencia**: cada evento del webhook se guarda primero en `webhook_events` con llave única; los reintentos de Meta no duplican contactos, mensajes ni eventos CAPI.

## 3. Arquitectura del circuito

```
Anuncio CTWA → WhatsApp Cloud API → POST /api/webhooks/whatsapp
  (firma X-Hub-Signature-256 verificada con META_APP_SECRET)
  → webhook_events (dedup) → contacto (wa_id / BSUID) → lead_attributions (referral + ctwa_clid)
  → asignación → conversación + mensaje → CAPI "LeadSubmitted"
Asesor califica / agenda / cierra → CAPI "QualifiedLead" / "Schedule" / "Purchase" (con valor)
Cron diario → Marketing API insights → ad_insights_daily → costo por lead y por lead calificado en /leads
```

## 4. Estado real encontrado (22-nov-2026)

- Campaña "LC | El Sauzal | WhatsApp" con 3 anuncios activos (A California, B Doctor, C Empresario), gasto inicial muy bajo.
- Negocio Meta **Legacy Capital / Real Estate**: no verificado; tiene una app conectada **sin el caso de uso de WhatsApp** → hoy el CRM no puede recibir mensajes de ese número.
- Dataset (píxel) "Legacy Capital Web" existe y dispara eventos web; no hay dataset de mensajería configurado.
- La base del sitio web (`leads` en otro proyecto Supabase) tiene 4 leads de formulario; no está conectada al CRM.
- El CRM en producción corre en modo real (auth + DB) con su propio proyecto Supabase.

## 5. Lo que necesita Legacy Capital (no lo puede hacer el sistema solo)

1. **Decidir el número**: la app de WhatsApp Business del teléfono actual puede seguir usándose con **coexistencia** (app + Cloud API a la vez) o migrar el número por completo a Cloud API. Confirmar disponibilidad de coexistencia en la cuenta antes de mover nada.
2. En developers.facebook.com, abrir la app conectada al negocio Legacy Capital y **agregar el caso de uso "Conectar con clientes por WhatsApp"**.
3. Crear un **usuario del sistema** con permisos `whatsapp_business_messaging`, `whatsapp_business_management`, `ads_read` y token permanente.
4. Suscribir el webhook a `https://realtorpro.vercel.app/api/webhooks/whatsapp` (campo `messages`).
5. Crear/enlazar el **dataset de mensajería** a la cuenta de WhatsApp para la Conversions API.
6. **Verificación del negocio** (recomendada: sube el límite de conversaciones).

## 6. Variables de entorno nuevas

| Variable | Para qué |
|---|---|
| `META_APP_SECRET` | Verificar la firma de cada webhook (obligatoria) |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Handshake de suscripción (cadena aleatoria que tú eliges) |
| `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_BUSINESS_ACCOUNT_ID` | Recibir/enviar y enrutar el número |
| `LEADOPS_ORGANIZATION_SLUG` | Organización que recibe los leads (`morishita-realty` o la de Legacy Capital) |
| `META_DATASET_ID`, `META_CAPI_ACCESS_TOKEN`, `META_CAPI_TEST_EVENT_CODE` (opcional) | Conversions API |
| `META_ADS_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` | Gasto diario por anuncio |
| `CRON_SECRET` | Protege el cron diario de insights |
| `WEB_LEADS_SECRET` | Protege `/api/leads/web` (formulario web → CRM) |

Sin estas variables todo queda apagado y se informa en `/leads` qué falta. Ninguna credencial se inventa.

## 7. Fases

| Fase | Entregable | Estado |
|---|---|---|
| 0 | Cierre funcional (decisiones de la sección 8), prueba con número de ensayo | Pendiente de Legacy Capital |
| 1 | Modelo de datos de leads, reglas, webhook idempotente, atribución CTWA, reparto, CAPI, insights, vista `/leads` | **Hecho (código)**; falta activar credenciales |
| 2 | Bandeja: ficha del lead junto al chat (5 respuestas, estrellas, temperatura, BOT/REACT/archivar/bloquear), plantillas aprobadas fuera de ventana, errores de Meta visibles, palomitas de estado, filtros (humano, calientes, ventana), coexistencia | **Hecho (F27)**; faltan adjuntos |
| 3 | Extracción de respuestas (palabras clave + IA), "Atención" al pedir cita, formulario web unido al mismo contacto | **Hecho (F27)**; faltan IA que responde sola, FAQ versionado y reactivadores |
| 4 | Dashboard con definiciones explícitas, export Excel (5 hojas), piloto con 2 asesores | |
| 5 | Plantillas y campañas masivas (importación, validación, reparto, pausa/cancelar, costo estimado) | |
| 6 | Telefonía (opcional) · 7 Copiloto interno sobre métricas | |

## 8. Decisiones

Cerradas (22-nov-2026):

1. **Número: coexistencia.** Se usa el número que ya tiene WhatsApp Business en el teléfono; app y Cloud API conviven.
2. **Los 5 datos de precalificación** son las preguntas del formulario "Agenda tu cita" (ver §9).
6. **Formulario web → CRM**: resuelto con `/api/leads/web` (ver §10).

Abiertas:

3. Reparto de los 2 asesores (equitativo o %), horario de guardia, y si el dueño recibe leads.
4. Confirmar la regla de "lead calificado" (hoy: ≥4 de 5 respuestas, ≥3 estrellas o marcado a mano).
5. Política tras intervención humana: ¿la IA vuelve sola tras X horas o solo manual? (hoy: solo manual).

## 9. Precalificación (Fase 27)

Catálogo único en `src/lib/leadops/qualification.ts`, usado por formulario, chat, IA, ficha y métricas:

| Llave | Pregunta | Opciones (valor guardado) |
|---|---|---|
| `bedrooms` | ¿Buscas casa de 2 o 3 recámaras? | 2 (`2`), 3 (`3`) |
| `purpose` | Propósito (hasta 2) | Uso propio (`own_use`), Inversión (`investment`), Retiro (`retirement`) |
| `financing` | ¿Cómo la vas a adquirir? | Crédito hipotecario (`mortgage`), Capital propio (`own_capital`), Ambos (`both`) |
| `timeline` | ¿En qué plazo? | De inmediato (`immediate`), 1-3 meses (`1_3m`), 3-6 meses (`3_6m`), +6 meses (`6m_plus`) |
| `contact_preference` | ¿Cómo prefieres que te contacte? | Visita en físico (`in_person`), Videollamada (`video_call`), WhatsApp (`whatsapp`), Email (`email`) |

- **Fuentes y precedencia**: formulario (`form`), detección por palabras clave en el chat (`system`, gratis, solo frases explícitas; "2 o 3 recámaras" queda sin dato), IA (`ai`, botón "Leer chat con IA", responde solo con valores del catálogo) y asesor (`advisor`). **Nada automático sobrescribe una corrección del asesor.**
- **Temperatura** (solo por respuestas): Caliente = compra de inmediato o en 1-3 meses **y** pide visita o videollamada; Tibio = ≤6 meses; Frío = +6 meses.
- **Calificado** → `QualifiedLead` a Meta: ≥4 de 5 respuestas o ≥3 estrellas (una vez por contacto).
- **Pide visita o videollamada** → se marca "Atención" para que un humano tome la conversación.
- **Visita creada** en el módulo Visitas → `Schedule` a Meta.

## 10. Formulario web de Punta Pacífico → CRM

El sitio guarda cada lead en la tabla `leads` de su propio proyecto Supabase. Para que llegue al CRM sin tocar el código del sitio:

1. Supabase (proyecto del sitio) → **Database → Webhooks → Create** · tabla `public.leads` · eventos **Insert** y **Update** · tipo HTTP **POST** a `https://realtorpro.vercel.app/api/leads/web`.
2. Header `x-webhook-secret: <WEB_LEADS_SECRET>` (la misma cadena aleatoria que se pone en Vercel). Nunca se llama desde el navegador.
3. El CRM entiende los códigos que guarda el sitio (`interes: "3R"`, `uso: "renta"`, `forma_pago: "credito"`, `horizonte_compra: "0-3"`, `modo_visita: "presencial"`) y también las etiquetas visibles.
4. Une a la persona por teléfono (10 dígitos, 52 o 521) o email: si después escribe por WhatsApp, es **el mismo contacto**, con sus respuestas ya cargadas.

## 11. Coexistencia (app WhatsApp Business + Cloud API)

- Lo que el asesor escribe **desde la app del teléfono** llega como evento `smb_message_echoes`: el CRM lo muestra en el chat con la etiqueta "Teléfono", lo cuenta como respuesta humana y **apaga la IA** de ese chat. Ecos de chats que no son leads del CRM (personales) se ignoran.
- Un eco **no abre ni extiende** la ventana de 24 h (solo el mensaje del cliente la abre).
- Campos del webhook a suscribir: `messages` y `smb_message_echoes` (los de sincronización de historial/contactos no se usan todavía).
- Requisitos de Meta a confirmar al activar: la incorporación de un número de la app se hace con el flujo de *Embedded Signup* para usuarios de WhatsApp Business app (app de Meta como Tech Provider, o mediante un BSP); el número debe estar activo en la app; algunas funciones de la app (p. ej. listas de difusión) dejan de estar disponibles; hay que abrir la app en el teléfono periódicamente para mantener el enlace. Verificar disponibilidad para México en la cuenta antes de mover nada.

## 12. Producción (22-nov-2026)

- **URL**: https://legacycapitalmx.com/realtorpro (el proyecto `legacy-capital` reescribe `/realtorpro/*` hacia el proyecto `realtorpro`, que se construye con `NEXT_PUBLIC_BASE_PATH=/realtorpro`). También responde en https://realtorpro.vercel.app/realtorpro.
- **Migraciones**: se aplican solas en cada build de producción (`scripts/vercel-migrate.mjs`, vía pooler de sesión de Supabase). Si una falla, el build se detiene y sigue sirviendo la versión anterior.
- **Acceso**: inicio de sesión con Supabase Auth; "¿Olvidaste tu contraseña?" envía el enlace para crear una nueva.
- **Formulario web**: trigger `crm_lead_webhook` en `public.leads` del proyecto Supabase del sitio (pg_net + secreto en Vault `crm_web_leads_secret`) → `https://realtorpro.vercel.app/realtorpro/api/leads/web`.
- **Webhook de WhatsApp para Meta**: `https://legacycapitalmx.com/realtorpro/api/webhooks/whatsapp` (token de verificación en la variable `WHATSAPP_WEBHOOK_VERIFY_TOKEN` de Vercel).
