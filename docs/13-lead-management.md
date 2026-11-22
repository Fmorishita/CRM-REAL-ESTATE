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

Sin estas variables todo queda apagado y se informa en `/leads` qué falta. Ninguna credencial se inventa.

## 7. Fases

| Fase | Entregable | Estado |
|---|---|---|
| 0 | Cierre funcional (decisiones de la sección 8), prueba con número de ensayo | Pendiente de Legacy Capital |
| 1 | Modelo de datos de leads, reglas, webhook idempotente, atribución CTWA, reparto, CAPI, insights, vista `/leads` | **Hecho (código)**; falta activar credenciales |
| 2 | Bandeja: plantillas aprobadas desde el chat fuera de ventana, adjuntos, controles BOT/REACT/archivar/bloquear en la ficha, filtros (atención, ventana, casas, estrellas) | Siguiente |
| 3 | IA de atención con extracción estructurada a `contact_facts`, transferencia humana ("Atención"), FAQ/conocimiento versionado, reactivadores con reglas | Siguiente |
| 4 | Dashboard con definiciones explícitas, export Excel (5 hojas), piloto con 2 asesores | |
| 5 | Plantillas y campañas masivas (importación, validación, reparto, pausa/cancelar, costo estimado) | |
| 6 | Telefonía (opcional) · 7 Copiloto interno sobre métricas | |

## 8. Decisiones abiertas (bloquean el piloto)

1. Número: coexistencia con la app actual o migración completa.
2. Los 5 datos de precalificación de Legacy Capital (por defecto: nombre, uso, recámaras, presupuesto, intención de visita) y si el quinto es "intención" o "cita confirmada".
3. Reparto de los 2 asesores (equitativo o %), horario de guardia, y si el dueño recibe leads.
4. Qué cuenta como "lead calificado" para enviarlo a Meta (hoy: ≥3 estrellas o ≥4 datos, o marcado a mano).
5. Política tras intervención humana: ¿la IA vuelve sola tras X horas o solo manual?
6. Unir los leads del formulario web (otro proyecto Supabase) al CRM.
