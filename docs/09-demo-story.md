# Demo story — Morishita Realty Group (Phase 20)

> Guion para una demo de ~8 minutos que muestra el valor del producto end-to-end.
> Todo corre en **modo demo** con datos sembrados; no requiere base de datos ni
> credenciales.

## El escenario

**Morishita Realty Group** es una inmobiliaria con sede en Ensenada que opera en
Baja California y CDMX. **Frank Morishita** (owner) dirige un equipo de agentes
—entre ellos **Carlos Mendoza** y **Mariana López**— que manejan compradores,
vendedores e inversionistas a través de WhatsApp, correo y redes. El inventario
incluye propiedades en Ensenada, Valle de Guadalupe, Tijuana, CDMX y Monterrey.

La promesa: **menos tareas manuales, más cierres** — con IA que prioriza, redacta
y sugiere el siguiente paso.

## Recorrido (8 minutos)

### 1. Dashboard — "¿qué hago hoy?" (1 min)
Abre `/dashboard`. El **Command Center** muestra las acciones del día; los **Hot
Leads** están priorizados por score; el **Pipeline Overview** resume el forecast.
La tarjeta de **Primeros pasos** guía a un usuario nuevo. Mensaje: el agente
entra y sabe exactamente qué mover.

### 2. Contactos — la ficha 360° (1 min)
Entra a un contacto desde Hot Leads. Muestra tags, timeline unificado, notas y
**score**. Todo el historial omnicanal en un solo lugar.

### 3. Inbox — omnicanal real (1.5 min)
Ve a `/inbox`. Conversaciones de WhatsApp, email e Instagram en una bandeja.
Responde un mensaje: el envío pasa por el **adaptador de canal** (mock en demo,
WhatsApp Cloud API real al configurar credenciales). Asigna la conversación a un
agente.

### 4. Pipeline — arrastra y pronostica (1 min)
En `/pipeline`, arrastra una oportunidad a "Negociación". El **forecast** y las
**comisiones estimadas** se actualizan. Muestra la probabilidad por etapa.

### 5. Propiedades + Smart Matching (1.5 min)
Abre una propiedad del Valle de Guadalupe. En **Smart Matching** aparecen los
compradores más compatibles con razones ("presupuesto coincide", "zona deseada")
y un **mensaje sugerido** listo para enviar.

### 6. Visit Planner + IA (1 min)
En `/visits`, el día del agente se ordena en una **ruta optimizada**. Tras la
visita, registra feedback. La IA propone el **next best action**.

### 7. AI Copilot (1 min)
Abre `/copilot` y pregunta: *"¿Qué leads debería contactar hoy?"* o *"Crea una
tarea de seguimiento para Carlos"*. El copiloto responde y, para acciones
sensibles (escritura), **pide confirmación** antes de ejecutar.

### Cierre — Analytics e Integraciones (30 s)
`/analytics` muestra rendimiento por agente, fuente y propiedad.
`/settings/integrations` muestra que WhatsApp, Meta, correo, calendario, mapas y
webhooks están listos para conectarse con credenciales — la arquitectura ya es
"integration-ready".

## Puntos clave para recalcar

- **Multi-tenant y seguro:** cada dato está aislado por organización con RLS;
  acciones sensibles quedan en **auditoría**.
- **IA mock-first:** funciona sin claves; al añadir `ANTHROPIC_API_KEY` usa modelos
  reales sin cambiar el flujo.
- **Sin lock-in de país:** moneda, idioma y zona horaria salen de la organización.
- **Premium por defecto:** estados loading/empty/error diseñados, mobile-first.

## Reset

La demo no muta datos persistentes en modo demo: recargar la página restablece el
estado sembrado. Para una demo con base real, siembra con `pnpm db:seed`.
