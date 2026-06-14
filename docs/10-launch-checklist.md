# MVP launch checklist (Phase 20)

> Lista de verificación para pasar del demo al lanzamiento del MVP con un tenant
> real. Marca cada punto antes de abrir el acceso a clientes.

## Calidad de código

- [x] `pnpm typecheck` sin errores (TypeScript estricto, `noUncheckedIndexedAccess`).
- [x] `pnpm lint` sin errores.
- [x] `pnpm build` de producción exitoso.
- [x] Estados loading / empty / error cubiertos en cada módulo.
- [x] Responsive completo (bottom nav móvil, quick actions, layouts adaptables).

## Base de datos

- [ ] Proyecto Supabase de producción creado.
- [ ] `pnpm db:migrate` aplicado (esquema + migraciones).
- [ ] **RLS habilitado** y verificado en las 37 tablas (anon sin bypass).
- [ ] Seeds de demostración retirados o reemplazados por el tenant real.
- [ ] Backups automáticos activados.

## Variables de entorno (producción)

- [ ] `NEXT_PUBLIC_APP_URL` apunta al dominio final.
- [ ] `DEMO_MODE` **desactivado** (o ausente) en producción.
- [ ] `DATABASE_URL` / `DIRECT_URL` configuradas (pooled + direct).
- [ ] `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Claves de IA si se usa proveedor real (`ANTHROPIC_API_KEY`, etc.).
- [ ] Credenciales de integraciones que se vayan a activar (ver `docs/08-integrations.md`).
- [ ] Ninguna credencial commiteada; `.env` fuera del control de versiones.

## Seguridad

- [x] RBAC aplicado en server actions (`requirePermission`).
- [x] Audit logs en acciones sensibles (`/settings/audit`).
- [x] Rate limiting en superficies públicas (login del portal, captura de leads).
- [x] Headers de seguridad (`next.config.ts`): CSP base, HSTS, X-Frame-Options, etc.
- [x] Sanitización de texto libre.
- [ ] Autenticación real (Supabase Auth) sustituye al owner demo.
- [ ] Revisar permisos del portal de clientes con datos reales.

## SEO y performance

- [x] `sitemap.xml` y `robots.txt` generados.
- [x] Metadata + Open Graph en landing pages públicas.
- [x] Imágenes vía `next/image` con `remotePatterns` configurados.
- [ ] Dominio personalizado y certificado TLS en Vercel.
- [ ] Lighthouse > 90 en landing pública.

## Despliegue

- [x] `vercel.json` con preset Next.js.
- [ ] Proyecto Vercel conectado al repositorio.
- [ ] Variables de entorno de producción cargadas en Vercel.
- [ ] Deploy de producción verificado (no solo preview).
- [ ] Monitoreo de errores / logs revisado.

## Onboarding del primer cliente

- [ ] Organización real creada con moneda, idioma y zona horaria correctos.
- [ ] Equipo invitado con roles adecuados.
- [ ] Al menos un canal (WhatsApp) conectado y probado.
- [ ] Inventario inicial cargado.
- [ ] Recorrido de "Primeros pasos" validado con el cliente.

## Post-lanzamiento (siguientes fases)

- [ ] Importadores de portales inmobiliarios (V2).
- [ ] Billing con Stripe: planes, límites, trials (V2).
- [ ] Búsqueda full-text (Meilisearch/Typesense) (V2).
- [ ] i18n completo en-US (V2).
- [ ] **Revocar cualquier token de servicio temporal** usado durante el setup.
