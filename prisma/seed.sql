-- Realtor Pro CRM — demo seed: "Morishita Realty Group" (Phase 2)
-- Idempotent: clears tenant data then re-inserts. Safe to re-run.
-- Two orgs prove tenant isolation. Money uses Decimal + ISO currency.

-- ── Reset (children first via cascade from organizations) ─────────────────────
DELETE FROM organizations WHERE id IN
  ('14ffd897-81d1-409e-9f50-c96a416e0d26','df1c8864-439d-4377-be26-606ca0b04147');
DELETE FROM roles WHERE organization_id IS NULL;
DELETE FROM users WHERE id IN
  ('e5c5ab04-7c6e-4f53-88d4-0cc3def2868e','c1087534-67a0-4272-85cf-bf6da3d3c30c',
   '65c6b0dd-b118-4d74-8243-53ae4c2ebc6c','51d50081-d84c-42a6-9be4-92d95ecf01ad',
   '341f13a7-64c4-4bd3-b17d-de2394e10b76','a7384a57-b009-4b07-b671-a249376469a6',
   '1ce0ec51-4cd4-47bb-8721-30de8ea886a4');

-- ── Organizations ─────────────────────────────────────────────────────────────
INSERT INTO organizations (id, name, slug, country, default_currency, default_locale, timezone, plan, plan_limits, branding) VALUES
('14ffd897-81d1-409e-9f50-c96a416e0d26','Morishita Realty Group','morishita-realty','MX','MXN','es-MX','America/Tijuana','pro',
  '{"seats":25,"properties":1000,"automations":50}','{"primaryColor":"#0f172a","accentColor":"#2563eb"}'),
('df1c8864-439d-4377-be26-606ca0b04147','Baja Living Premium','baja-living','MX','USD','es-MX','America/Tijuana','starter',
  '{"seats":5,"properties":100,"automations":10}','{"primaryColor":"#134e4a","accentColor":"#0d9488"}');

-- ── System roles (organization_id NULL) ──────────────────────────────────────
INSERT INTO roles (id, organization_id, key, name, permissions) VALUES
('864eb381-4777-4f11-bc1e-a9b89997ae8a',NULL,'owner','Owner', ARRAY['contacts.view','contacts.create','contacts.edit','contacts.delete','pipeline.view','pipeline.manage','conversations.view','conversations.reply','properties.view','properties.manage','properties.publish','visits.view','visits.manage','automations.view','automations.manage','analytics.view','copilot.use','ai.configure','users.manage','settings.manage','data.export']),
('76aad81a-db83-4716-8350-9e76e0fed0ad',NULL,'admin','Admin', ARRAY['contacts.view','contacts.create','contacts.edit','contacts.delete','pipeline.view','pipeline.manage','conversations.view','conversations.reply','properties.view','properties.manage','properties.publish','visits.view','visits.manage','automations.view','automations.manage','analytics.view','copilot.use','ai.configure','users.manage','settings.manage','data.export']),
('4b5306bb-5959-42fc-8a22-17481a619423',NULL,'broker','Broker', ARRAY['contacts.view','contacts.create','contacts.edit','pipeline.view','pipeline.manage','conversations.view','conversations.reply','properties.view','properties.manage','properties.publish','visits.view','visits.manage','analytics.view','copilot.use','data.export']),
('19ae4065-8576-4a16-a562-d701e4816d4e',NULL,'team_leader','Team Leader', ARRAY['contacts.view','contacts.create','contacts.edit','contacts.delete','pipeline.view','pipeline.manage','conversations.view','conversations.reply','properties.view','visits.view','visits.manage','automations.view','analytics.view','copilot.use']),
('b4e4b469-902f-47d2-ab6f-b68141d26b7f',NULL,'agent','Agente', ARRAY['contacts.view','contacts.create','contacts.edit','pipeline.view','pipeline.manage','conversations.view','conversations.reply','properties.view','visits.view','visits.manage','copilot.use']),
('265e6268-bcc7-4d19-96b1-2e655e3a564c',NULL,'assistant','Asistente', ARRAY['contacts.view','contacts.create','conversations.view','conversations.reply','properties.view','visits.view','visits.manage']),
('dc9056cf-01b6-41a0-a987-0eda49e105ad',NULL,'marketing','Marketing', ARRAY['contacts.view','properties.view','properties.publish','automations.view','automations.manage','analytics.view']),
('4637fe86-b49f-4121-9d39-7e07dd3abe3f',NULL,'viewer','Viewer', ARRAY['contacts.view','pipeline.view','properties.view','visits.view','analytics.view']),
('3b702fdd-ae68-4401-b288-5dd6450683c8',NULL,'client','Cliente', ARRAY[]::text[]);

-- ── Users ─────────────────────────────────────────────────────────────────────
INSERT INTO users (id, name, email, phone, locale) VALUES
('e5c5ab04-7c6e-4f53-88d4-0cc3def2868e','Frank Morishita','frank@morishitarealty.mx','+52 646 100 0001','es-MX'),
('c1087534-67a0-4272-85cf-bf6da3d3c30c','Sofía Hernández','sofia@morishitarealty.mx','+52 646 100 0002','es-MX'),
('65c6b0dd-b118-4d74-8243-53ae4c2ebc6c','Carlos Mendoza','carlos@morishitarealty.mx','+52 646 100 0003','es-MX'),
('51d50081-d84c-42a6-9be4-92d95ecf01ad','Mariana López','mariana@morishitarealty.mx','+52 646 100 0004','es-MX'),
('341f13a7-64c4-4bd3-b17d-de2394e10b76','Diego Ramírez','diego@morishitarealty.mx','+52 646 100 0005','es-MX'),
('a7384a57-b009-4b07-b671-a249376469a6','Lucía Treviño','lucia@morishitarealty.mx','+52 646 100 0006','es-MX'),
('1ce0ec51-4cd4-47bb-8721-30de8ea886a4','Ana Beltrán','ana@bajaliving.mx','+52 646 200 0001','es-MX');

-- ── Memberships ───────────────────────────────────────────────────────────────
INSERT INTO memberships (id, organization_id, user_id, role_id, status) VALUES
('d30b1330-1281-4e3c-8d5b-58b8388b48fc','14ffd897-81d1-409e-9f50-c96a416e0d26','e5c5ab04-7c6e-4f53-88d4-0cc3def2868e','864eb381-4777-4f11-bc1e-a9b89997ae8a','active'),
('a00789df-c18f-4116-a3ee-74eefe54739e','14ffd897-81d1-409e-9f50-c96a416e0d26','c1087534-67a0-4272-85cf-bf6da3d3c30c','19ae4065-8576-4a16-a562-d701e4816d4e','active'),
('ecc9315a-fdd8-414d-8766-487b0c7f7387','14ffd897-81d1-409e-9f50-c96a416e0d26','65c6b0dd-b118-4d74-8243-53ae4c2ebc6c','b4e4b469-902f-47d2-ab6f-b68141d26b7f','active'),
('bb24edb0-8464-432a-bb71-8c6a3c69cdce','14ffd897-81d1-409e-9f50-c96a416e0d26','51d50081-d84c-42a6-9be4-92d95ecf01ad','b4e4b469-902f-47d2-ab6f-b68141d26b7f','active'),
('d85df36a-47fb-41f1-8edb-0ec7e5e2e85c','14ffd897-81d1-409e-9f50-c96a416e0d26','341f13a7-64c4-4bd3-b17d-de2394e10b76','dc9056cf-01b6-41a0-a987-0eda49e105ad','active'),
('a57cab72-9da0-4129-8ea7-274fa402a25b','14ffd897-81d1-409e-9f50-c96a416e0d26','a7384a57-b009-4b07-b671-a249376469a6','265e6268-bcc7-4d19-96b1-2e655e3a564c','invited'),
('d8457edd-66a3-493b-9e75-199cb320e4b5','df1c8864-439d-4377-be26-606ca0b04147','1ce0ec51-4cd4-47bb-8721-30de8ea886a4','864eb381-4777-4f11-bc1e-a9b89997ae8a','active');

-- ── Lead sources ──────────────────────────────────────────────────────────────
INSERT INTO lead_sources (id, organization_id, name, kind) VALUES
('4f529f93-c52e-4807-b3c0-f882c331c6dd','14ffd897-81d1-409e-9f50-c96a416e0d26','Facebook Lead Ads','facebook'),
('589a491a-1e1e-4707-a2d5-049fb5bbad29','14ffd897-81d1-409e-9f50-c96a416e0d26','Google Ads','google'),
('2b386a4c-d6ad-4478-9483-a64e4b55612d','14ffd897-81d1-409e-9f50-c96a416e0d26','Inmuebles24','portal'),
('9e8c502b-e86e-45fd-a0d0-ff9a4147c3ad','14ffd897-81d1-409e-9f50-c96a416e0d26','Referido','referral'),
('4d4baacf-9937-44ac-832a-a5366ae9d085','14ffd897-81d1-409e-9f50-c96a416e0d26','Landing Page','landing'),
('056092bd-4630-4b09-9c4b-8117f8bf39a2','14ffd897-81d1-409e-9f50-c96a416e0d26','Walk-in oficina','walk_in');

-- ── Tags ──────────────────────────────────────────────────────────────────────
INSERT INTO tags (id, organization_id, name, color) VALUES
('eff0a8bf-a9da-4578-8be5-775e372af953','14ffd897-81d1-409e-9f50-c96a416e0d26','Inversionista','violet'),
('2e1958a2-1017-4f97-927d-3bf6f2f4b829','14ffd897-81d1-409e-9f50-c96a416e0d26','Primera compra','sky'),
('c799d8f7-2a63-4f67-8ddc-6e901a6ae093','14ffd897-81d1-409e-9f50-c96a416e0d26','Urgente','red'),
('6076d6c1-1600-4b40-9658-71e88990a6a2','14ffd897-81d1-409e-9f50-c96a416e0d26','VIP','amber'),
('50263ea9-eb0e-4940-8d2d-d78c5999d204','14ffd897-81d1-409e-9f50-c96a416e0d26','Preventa','emerald');

-- ── Pipeline + stages ─────────────────────────────────────────────────────────
INSERT INTO pipelines (id, organization_id, name, is_default) VALUES
('6ef72574-b8ad-4fee-9e92-d6823717e638','14ffd897-81d1-409e-9f50-c96a416e0d26','Pipeline de ventas',true);

INSERT INTO pipeline_stages (id, pipeline_id, key, name, position, probability, is_won, is_lost) VALUES
('a1000000-0000-4000-8000-000000000001','6ef72574-b8ad-4fee-9e92-d6823717e638','new','Nuevo lead',1,5,false,false),
('a1000000-0000-4000-8000-000000000002','6ef72574-b8ad-4fee-9e92-d6823717e638','contacted','Contactado',2,15,false,false),
('a1000000-0000-4000-8000-000000000003','6ef72574-b8ad-4fee-9e92-d6823717e638','qualified','Calificado',3,30,false,false),
('a1000000-0000-4000-8000-000000000004','6ef72574-b8ad-4fee-9e92-d6823717e638','searching','Buscando propiedad',4,40,false,false),
('a1000000-0000-4000-8000-000000000005','6ef72574-b8ad-4fee-9e92-d6823717e638','visit_scheduled','Visita agendada',5,55,false,false),
('a1000000-0000-4000-8000-000000000006','6ef72574-b8ad-4fee-9e92-d6823717e638','visit_done','Visita realizada',6,65,false,false),
('a1000000-0000-4000-8000-000000000007','6ef72574-b8ad-4fee-9e92-d6823717e638','negotiation','Oferta / negociación',7,80,false,false),
('a1000000-0000-4000-8000-000000000008','6ef72574-b8ad-4fee-9e92-d6823717e638','documentation','Documentación',8,90,false,false),
('a1000000-0000-4000-8000-000000000009','6ef72574-b8ad-4fee-9e92-d6823717e638','closing','Cierre',9,95,false,false),
('a1000000-0000-4000-8000-000000000010','6ef72574-b8ad-4fee-9e92-d6823717e638','won','Ganado',10,100,true,false),
('a1000000-0000-4000-8000-000000000011','6ef72574-b8ad-4fee-9e92-d6823717e638','lost','Perdido',11,0,false,true);

-- ── Properties (Morishita) ────────────────────────────────────────────────────
INSERT INTO properties (id, organization_id, title, slug, description, property_type, operation, status, price, currency, address, lat, lng, zone, city, state, country, bedrooms, bathrooms, parking, lot_size_m2, built_m2, amenities, commission_pct, assigned_membership_id, delivery_date, development_stage, tags) VALUES
('b2000000-0000-4000-8000-000000000001','14ffd897-81d1-409e-9f50-c96a416e0d26','Casa frente al mar en Ensenada','casa-frente-al-mar-ensenada','Espectacular residencia con vista al océano Pacífico, acabados de lujo y acceso a playa privada.','house','sale','available',12500000,'MXN','{"street":"Av. del Pacífico 2100","neighborhood":"Playa Hermosa"}',31.8512,-116.6312,'Playa Hermosa','Ensenada','Baja California','MX',4,4.5,3,650,420,ARRAY['Vista al mar','Alberca','Acceso a playa','Cocina integral','Roof garden'],3.5,'ecc9315a-fdd8-414d-8766-487b0c7f7387',NULL,NULL,ARRAY['VIP']),
('b2000000-0000-4000-8000-000000000002','14ffd897-81d1-409e-9f50-c96a416e0d26','Departamento en Polanco CDMX','departamento-polanco-cdmx','Departamento de lujo en el corazón de Polanco, a pasos de Masaryk. Amenidades premium.','apartment','sale','available',8900000,'MXN','{"street":"Calle Julio Verne 90","neighborhood":"Polanco"}',19.4326,-99.1956,'Polanco','Ciudad de México','CDMX','MX',2,2,2,0,135,ARRAY['Gimnasio','Roof garden','Seguridad 24/7','Pet friendly','Lobby'],3,'bb24edb0-8464-432a-bb71-8c6a3c69cdce',NULL,NULL,ARRAY[]::text[]),
('b2000000-0000-4000-8000-000000000003','14ffd897-81d1-409e-9f50-c96a416e0d26','Terreno en Valle de Guadalupe','terreno-valle-de-guadalupe','Terreno campestre ideal para viñedo o casa de descanso en la ruta del vino.','land','sale','available',3200000,'MXN','{"street":"Camino Vecinal s/n","neighborhood":"San Antonio de las Minas"}',32.0738,-116.5961,'San Antonio de las Minas','Ensenada','Baja California','MX',NULL,NULL,NULL,5000,0,ARRAY['Uso agrícola','Servicios cercanos','Vista a viñedos'],5,'ecc9315a-fdd8-414d-8766-487b0c7f7387',NULL,NULL,ARRAY['Inversionista']),
('b2000000-0000-4000-8000-000000000004','14ffd897-81d1-409e-9f50-c96a416e0d26','Preventa Torre Altitude Tijuana','preventa-torre-altitude-tijuana','Departamentos en preventa con entrega 2027. Zona Río, plusvalía garantizada.','presale','presale','available',4750000,'MXN','{"street":"Blvd. Agua Caliente 4500","neighborhood":"Zona Río"}',32.5149,-117.0382,'Zona Río','Tijuana','Baja California','MX',2,2,1,0,98,ARRAY['Alberca','Gym','Coworking','Sky lounge','Smart home'],4,'bb24edb0-8464-432a-bb71-8c6a3c69cdce','2027-06-30','En construcción',ARRAY['Preventa','Inversionista']),
('b2000000-0000-4000-8000-000000000005','14ffd897-81d1-409e-9f50-c96a416e0d26','Desarrollo Residencial Cumbres Monterrey','desarrollo-cumbres-monterrey','Casas en desarrollo en zona premium de Monterrey, con club house y áreas verdes.','development','sale','available',6800000,'MXN','{"street":"Av. Cumbres Elite 1000","neighborhood":"Cumbres"}',25.7406,-100.3791,'Cumbres','Monterrey','Nuevo León','MX',3,3.5,2,320,260,ARRAY['Club house','Casa club','Áreas verdes','Seguridad','Parque'],3.5,'ecc9315a-fdd8-414d-8766-487b0c7f7387','2026-12-15','Preventa',ARRAY['Preventa']);

-- ── Property media (cover photos via Unsplash) ───────────────────────────────
INSERT INTO property_media (id, organization_id, property_id, kind, url, position, alt) VALUES
('c3000000-0000-4000-8000-000000000001','14ffd897-81d1-409e-9f50-c96a416e0d26','b2000000-0000-4000-8000-000000000001','photo','https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200',0,'Casa frente al mar'),
('c3000000-0000-4000-8000-000000000002','14ffd897-81d1-409e-9f50-c96a416e0d26','b2000000-0000-4000-8000-000000000002','photo','https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',0,'Departamento Polanco'),
('c3000000-0000-4000-8000-000000000003','14ffd897-81d1-409e-9f50-c96a416e0d26','b2000000-0000-4000-8000-000000000003','photo','https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200',0,'Terreno Valle de Guadalupe'),
('c3000000-0000-4000-8000-000000000004','14ffd897-81d1-409e-9f50-c96a416e0d26','b2000000-0000-4000-8000-000000000004','photo','https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',0,'Torre Altitude'),
('c3000000-0000-4000-8000-000000000005','14ffd897-81d1-409e-9f50-c96a416e0d26','b2000000-0000-4000-8000-000000000005','photo','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200',0,'Residencial Cumbres');

-- ── Contacts (Morishita) ──────────────────────────────────────────────────────
INSERT INTO contacts (id, organization_id, type, first_name, last_name, email, phone, whatsapp, lead_source_id, stage, assigned_membership_id, score, close_probability, last_contact_at, next_follow_up_at) VALUES
('d4000000-0000-4000-8000-000000000001','14ffd897-81d1-409e-9f50-c96a416e0d26','buyer','Roberto','Gómez','roberto.gomez@gmail.com','+52 646 300 0001','+52 646 300 0001','4f529f93-c52e-4807-b3c0-f882c331c6dd','qualified','ecc9315a-fdd8-414d-8766-487b0c7f7387',82,45,now() - interval '1 day', now() + interval '1 day'),
('d4000000-0000-4000-8000-000000000002','14ffd897-81d1-409e-9f50-c96a416e0d26','investor','Patricia','Núñez','paty.nunez@outlook.com','+52 55 300 0002','+52 55 300 0002','9e8c502b-e86e-45fd-a0d0-ff9a4147c3ad','searching','bb24edb0-8464-432a-bb71-8c6a3c69cdce',91,60,now() - interval '2 hours', now() + interval '2 days'),
('d4000000-0000-4000-8000-000000000003','14ffd897-81d1-409e-9f50-c96a416e0d26','buyer','Luis','Fernández','luisfer@gmail.com','+52 664 300 0003','+52 664 300 0003','2b386a4c-d6ad-4478-9483-a64e4b55612d','visit_scheduled','bb24edb0-8464-432a-bb71-8c6a3c69cdce',75,55,now() - interval '5 hours', now() + interval '3 days'),
('d4000000-0000-4000-8000-000000000004','14ffd897-81d1-409e-9f50-c96a416e0d26','buyer','Gabriela','Sánchez','gaby.sanchez@gmail.com','+52 646 300 0004','+52 646 300 0004','4d4baacf-9937-44ac-832a-a5366ae9d085','new','ecc9315a-fdd8-414d-8766-487b0c7f7387',48,15,now() - interval '8 days', now() - interval '1 day'),
('d4000000-0000-4000-8000-000000000005','14ffd897-81d1-409e-9f50-c96a416e0d26','investor','Eduardo','Villarreal','eduardo.v@empresa.mx','+52 81 300 0005','+52 81 300 0005','9e8c502b-e86e-45fd-a0d0-ff9a4147c3ad','negotiation','ecc9315a-fdd8-414d-8766-487b0c7f7387',95,80,now() - interval '6 hours', now() + interval '1 day'),
('d4000000-0000-4000-8000-000000000006','14ffd897-81d1-409e-9f50-c96a416e0d26','buyer','María','Torres','maria.torres@gmail.com','+52 646 300 0006','+52 646 300 0006','4f529f93-c52e-4807-b3c0-f882c331c6dd','contacted','bb24edb0-8464-432a-bb71-8c6a3c69cdce',63,25,now() - interval '1 day', now() + interval '2 days'),
('d4000000-0000-4000-8000-000000000007','14ffd897-81d1-409e-9f50-c96a416e0d26','renter','Jorge','Mendoza','jorge.m@gmail.com','+52 55 300 0007','+52 55 300 0007','589a491a-1e1e-4707-a2d5-049fb5bbad29','new','bb24edb0-8464-432a-bb71-8c6a3c69cdce',38,10,now() - interval '10 days', now() - interval '3 days'),
('d4000000-0000-4000-8000-000000000008','14ffd897-81d1-409e-9f50-c96a416e0d26','seller','Carmen','Ruiz','carmen.ruiz@gmail.com','+52 664 300 0008','+52 664 300 0008','056092bd-4630-4b09-9c4b-8117f8bf39a2','qualified','ecc9315a-fdd8-414d-8766-487b0c7f7387',70,40,now() - interval '3 days', now() + interval '4 days'),
('d4000000-0000-4000-8000-000000000009','14ffd897-81d1-409e-9f50-c96a416e0d26','buyer','Andrés','Castro','andres.castro@gmail.com','+52 646 300 0009','+52 646 300 0009','2b386a4c-d6ad-4478-9483-a64e4b55612d','visit_done','bb24edb0-8464-432a-bb71-8c6a3c69cdce',84,70,now() - interval '12 hours', now() + interval '1 day'),
('d4000000-0000-4000-8000-000000000010','14ffd897-81d1-409e-9f50-c96a416e0d26','investor','Fernanda','Aguirre','fer.aguirre@gmail.com','+52 81 300 0010','+52 81 300 0010','4d4baacf-9937-44ac-832a-a5366ae9d085','searching','ecc9315a-fdd8-414d-8766-487b0c7f7387',88,55,now() - interval '4 hours', now() + interval '2 days');

-- ── Contact preferences ───────────────────────────────────────────────────────
INSERT INTO contact_preferences (id, contact_id, budget_min, budget_max, currency, zones, property_types, bedrooms_min, bathrooms_min, amenities, purchase_reason, urgency) VALUES
('e5000000-0000-4000-8000-000000000001','d4000000-0000-4000-8000-000000000001',8000000,13000000,'MXN',ARRAY['Playa Hermosa','Chapultepec'],ARRAY['house'],3,3,ARRAY['Vista al mar','Alberca'],'Casa familiar','medium'),
('e5000000-0000-4000-8000-000000000002','d4000000-0000-4000-8000-000000000002',3000000,5000000,'MXN',ARRAY['Zona Río','Cumbres'],ARRAY['presale','apartment'],2,2,ARRAY['Gym','Coworking'],'Inversión / plusvalía','high'),
('e5000000-0000-4000-8000-000000000003','d4000000-0000-4000-8000-000000000003',7000000,9500000,'MXN',ARRAY['Polanco'],ARRAY['apartment'],2,2,ARRAY['Seguridad 24/7','Pet friendly'],'Primera vivienda','medium'),
('e5000000-0000-4000-8000-000000000005','d4000000-0000-4000-8000-000000000005',2500000,4000000,'MXN',ARRAY['San Antonio de las Minas'],ARRAY['land'],NULL,NULL,ARRAY['Uso agrícola'],'Viñedo / inversión','high'),
('e5000000-0000-4000-8000-000000000010','d4000000-0000-4000-8000-000000000010',4000000,7000000,'MXN',ARRAY['Cumbres','Zona Río'],ARRAY['development','presale'],3,3,ARRAY['Club house','Seguridad'],'Inversión','medium');

-- ── Contact tags ──────────────────────────────────────────────────────────────
INSERT INTO contact_tags (contact_id, tag_id) VALUES
('d4000000-0000-4000-8000-000000000002','eff0a8bf-a9da-4578-8be5-775e372af953'),
('d4000000-0000-4000-8000-000000000005','eff0a8bf-a9da-4578-8be5-775e372af953'),
('d4000000-0000-4000-8000-000000000005','6076d6c1-1600-4b40-9658-71e88990a6a2'),
('d4000000-0000-4000-8000-000000000003','2e1958a2-1017-4f97-927d-3bf6f2f4b829'),
('d4000000-0000-4000-8000-000000000010','eff0a8bf-a9da-4578-8be5-775e372af953'),
('d4000000-0000-4000-8000-000000000001','c799d8f7-2a63-4f67-8ddc-6e901a6ae093');

-- ── Contact ↔ property relations ─────────────────────────────────────────────
INSERT INTO contact_properties (contact_id, property_id, relation, score) VALUES
('d4000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000001','favorite',87),
('d4000000-0000-4000-8000-000000000002','b2000000-0000-4000-8000-000000000004','recommended',92),
('d4000000-0000-4000-8000-000000000003','b2000000-0000-4000-8000-000000000002','visited',78),
('d4000000-0000-4000-8000-000000000005','b2000000-0000-4000-8000-000000000003','offered',95),
('d4000000-0000-4000-8000-000000000010','b2000000-0000-4000-8000-000000000005','recommended',84);

-- ── Opportunities ─────────────────────────────────────────────────────────────
INSERT INTO opportunities (id, organization_id, pipeline_id, stage_id, contact_id, property_id, title, amount, currency, commission_amount, probability, expected_close_date, assigned_membership_id, ai_score, ai_risk, ai_next_action) VALUES
('f6000000-0000-4000-8000-000000000001','14ffd897-81d1-409e-9f50-c96a416e0d26','6ef72574-b8ad-4fee-9e92-d6823717e638','a1000000-0000-4000-8000-000000000003','d4000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000001','Casa Ensenada - Roberto Gómez',12500000,'MXN',437500,45,now() + interval '30 days','ecc9315a-fdd8-414d-8766-487b0c7f7387',82,'medium','Enviar 3 propiedades similares por WhatsApp'),
('f6000000-0000-4000-8000-000000000002','14ffd897-81d1-409e-9f50-c96a416e0d26','6ef72574-b8ad-4fee-9e92-d6823717e638','a1000000-0000-4000-8000-000000000004','d4000000-0000-4000-8000-000000000002','b2000000-0000-4000-8000-000000000004','Preventa Tijuana - Patricia Núñez',4750000,'MXN',190000,60,now() + interval '20 days','bb24edb0-8464-432a-bb71-8c6a3c69cdce',91,'low','Agendar visita a sala de ventas esta semana'),
('f6000000-0000-4000-8000-000000000003','14ffd897-81d1-409e-9f50-c96a416e0d26','6ef72574-b8ad-4fee-9e92-d6823717e638','a1000000-0000-4000-8000-000000000005','d4000000-0000-4000-8000-000000000003','b2000000-0000-4000-8000-000000000002','Depto Polanco - Luis Fernández',8900000,'MXN',267000,55,now() + interval '25 days','bb24edb0-8464-432a-bb71-8c6a3c69cdce',75,'medium','Confirmar visita del viernes'),
('f6000000-0000-4000-8000-000000000004','14ffd897-81d1-409e-9f50-c96a416e0d26','6ef72574-b8ad-4fee-9e92-d6823717e638','a1000000-0000-4000-8000-000000000007','d4000000-0000-4000-8000-000000000005','b2000000-0000-4000-8000-000000000003','Terreno Valle - Eduardo Villarreal',3200000,'MXN',160000,80,now() + interval '10 days','ecc9315a-fdd8-414d-8766-487b0c7f7387',95,'low','Enviar contrato de promesa de compraventa'),
('f6000000-0000-4000-8000-000000000005','14ffd897-81d1-409e-9f50-c96a416e0d26','6ef72574-b8ad-4fee-9e92-d6823717e638','a1000000-0000-4000-8000-000000000006','d4000000-0000-4000-8000-000000000009','b2000000-0000-4000-8000-000000000002','Depto Polanco - Andrés Castro',8900000,'MXN',267000,70,now() + interval '18 days','bb24edb0-8464-432a-bb71-8c6a3c69cdce',84,'low','Llamar para feedback post-visita'),
('f6000000-0000-4000-8000-000000000006','14ffd897-81d1-409e-9f50-c96a416e0d26','6ef72574-b8ad-4fee-9e92-d6823717e638','a1000000-0000-4000-8000-000000000004','d4000000-0000-4000-8000-000000000010','b2000000-0000-4000-8000-000000000005','Desarrollo Cumbres - Fernanda Aguirre',6800000,'MXN',238000,55,now() + interval '35 days','ecc9315a-fdd8-414d-8766-487b0c7f7387',88,'medium','Compartir brochure y tabla de precios');

-- ── Channel accounts (mock) ───────────────────────────────────────────────────
INSERT INTO channel_accounts (id, organization_id, channel, name, status) VALUES
('a8000000-0000-4000-8000-000000000001','14ffd897-81d1-409e-9f50-c96a416e0d26','whatsapp','WhatsApp Morishita','mock'),
('a8000000-0000-4000-8000-000000000002','14ffd897-81d1-409e-9f50-c96a416e0d26','email','ventas@morishitarealty.mx','mock'),
('a8000000-0000-4000-8000-000000000003','14ffd897-81d1-409e-9f50-c96a416e0d26','webchat','Chat del sitio','mock');

-- ── Conversations + messages ─────────────────────────────────────────────────
INSERT INTO conversations (id, organization_id, channel_account_id, contact_id, status, priority, assigned_membership_id, last_message_at, ai_summary, ai_sentiment, ai_intent, unread_count) VALUES
('b9000000-0000-4000-8000-000000000001','14ffd897-81d1-409e-9f50-c96a416e0d26','a8000000-0000-4000-8000-000000000001','d4000000-0000-4000-8000-000000000002','needs_attention','high','bb24edb0-8464-432a-bb71-8c6a3c69cdce',now() - interval '20 minutes','Cliente inversionista pregunta por enganche y fecha de entrega de la preventa en Tijuana.','positive','alta_intencion_compra',2),
('b9000000-0000-4000-8000-000000000002','14ffd897-81d1-409e-9f50-c96a416e0d26','a8000000-0000-4000-8000-000000000001','d4000000-0000-4000-8000-000000000001','open','normal','ecc9315a-fdd8-414d-8766-487b0c7f7387',now() - interval '1 day','Cliente interesado en casa de Ensenada, solicitó más fotos del interior.','neutral','solicitud_informacion',0),
('b9000000-0000-4000-8000-000000000003','14ffd897-81d1-409e-9f50-c96a416e0d26','a8000000-0000-4000-8000-000000000002','d4000000-0000-4000-8000-000000000003','waiting_customer','normal','bb24edb0-8464-432a-bb71-8c6a3c69cdce',now() - interval '5 hours','Se envió confirmación de visita al departamento de Polanco para el viernes.','positive','agendar_visita',0);

INSERT INTO messages (id, organization_id, conversation_id, direction, author_type, body, status, sent_at) VALUES
('ca000000-0000-4000-8000-000000000001','14ffd897-81d1-409e-9f50-c96a416e0d26','b9000000-0000-4000-8000-000000000001','inbound','contact','Hola, vi la preventa de Torre Altitude. ¿Cuál es el enganche y cuándo entregan?','read',now() - interval '40 minutes'),
('ca000000-0000-4000-8000-000000000002','14ffd897-81d1-409e-9f50-c96a416e0d26','b9000000-0000-4000-8000-000000000001','outbound','member','¡Hola Patricia! El enganche es del 20% y la entrega está programada para junio 2027. ¿Le comparto el brochure?','read',now() - interval '35 minutes'),
('ca000000-0000-4000-8000-000000000003','14ffd897-81d1-409e-9f50-c96a416e0d26','b9000000-0000-4000-8000-000000000001','inbound','contact','Sí por favor, y también las formas de pago disponibles.','delivered',now() - interval '20 minutes'),
('ca000000-0000-4000-8000-000000000004','14ffd897-81d1-409e-9f50-c96a416e0d26','b9000000-0000-4000-8000-000000000002','inbound','contact','Me encantó la casa de Ensenada. ¿Tienen más fotos del interior y la cocina?','read',now() - interval '1 day'),
('ca000000-0000-4000-8000-000000000005','14ffd897-81d1-409e-9f50-c96a416e0d26','b9000000-0000-4000-8000-000000000003','outbound','member','Hola Luis, confirmamos tu visita al depto de Polanco el viernes a las 5pm. ¿Te queda bien?','sent',now() - interval '5 hours');

-- ── Visits ────────────────────────────────────────────────────────────────────
INSERT INTO visits (id, organization_id, contact_id, property_id, assigned_membership_id, scheduled_at, duration_min, status, notes) VALUES
('db000000-0000-4000-8000-000000000001','14ffd897-81d1-409e-9f50-c96a416e0d26','d4000000-0000-4000-8000-000000000003','b2000000-0000-4000-8000-000000000002','bb24edb0-8464-432a-bb71-8c6a3c69cdce',now() + interval '3 days',60,'confirmed','Cliente pidió ver amenidades y estacionamiento.'),
('db000000-0000-4000-8000-000000000002','14ffd897-81d1-409e-9f50-c96a416e0d26','d4000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000001','ecc9315a-fdd8-414d-8766-487b0c7f7387',now() + interval '1 day',90,'pending','Primera visita, mostrar acceso a playa.'),
('db000000-0000-4000-8000-000000000003','14ffd897-81d1-409e-9f50-c96a416e0d26','d4000000-0000-4000-8000-000000000009','b2000000-0000-4000-8000-000000000002','bb24edb0-8464-432a-bb71-8c6a3c69cdce',now() - interval '1 day',60,'done','Visita realizada, cliente muy interesado. Dar seguimiento.'),
('db000000-0000-4000-8000-000000000004','14ffd897-81d1-409e-9f50-c96a416e0d26','d4000000-0000-4000-8000-000000000002','b2000000-0000-4000-8000-000000000004','bb24edb0-8464-432a-bb71-8c6a3c69cdce',now() + interval '4 days',45,'confirmed','Visita a sala de ventas de preventa.');

-- ── Tasks ─────────────────────────────────────────────────────────────────────
INSERT INTO tasks (id, organization_id, title, description, due_at, priority, assigned_membership_id, entity_type, entity_id) VALUES
('dc000000-0000-4000-8000-000000000001','14ffd897-81d1-409e-9f50-c96a416e0d26','Enviar brochure a Patricia','Compartir brochure y formas de pago de Torre Altitude.',now() + interval '2 hours','high','bb24edb0-8464-432a-bb71-8c6a3c69cdce','contact','d4000000-0000-4000-8000-000000000002'),
('dc000000-0000-4000-8000-000000000002','14ffd897-81d1-409e-9f50-c96a416e0d26','Llamar a Andrés post-visita','Pedir feedback de la visita al depto de Polanco.',now() + interval '1 day','medium','bb24edb0-8464-432a-bb71-8c6a3c69cdce','contact','d4000000-0000-4000-8000-000000000009'),
('dc000000-0000-4000-8000-000000000003','14ffd897-81d1-409e-9f50-c96a416e0d26','Preparar contrato Eduardo','Promesa de compraventa del terreno en Valle de Guadalupe.',now() + interval '3 days','high','ecc9315a-fdd8-414d-8766-487b0c7f7387','opportunity','f6000000-0000-4000-8000-000000000004'),
('dc000000-0000-4000-8000-000000000004','14ffd897-81d1-409e-9f50-c96a416e0d26','Recontactar a Gabriela','Lead sin seguimiento hace 8 días, recalentar.',now() - interval '1 day','medium','ecc9315a-fdd8-414d-8766-487b0c7f7387','contact','d4000000-0000-4000-8000-000000000004');

-- ── AI task configs (mock provider by default) ───────────────────────────────
INSERT INTO ai_task_configs (id, organization_id, task_key, provider, model, temperature, requires_approval, enabled) VALUES
('dd000000-0000-4000-8000-000000000001','14ffd897-81d1-409e-9f50-c96a416e0d26','summarize_conversation','mock','mock-1',0.3,false,true),
('dd000000-0000-4000-8000-000000000002','14ffd897-81d1-409e-9f50-c96a416e0d26','suggest_reply','mock','mock-1',0.4,false,true),
('dd000000-0000-4000-8000-000000000003','14ffd897-81d1-409e-9f50-c96a416e0d26','score_lead','mock','mock-1',0.1,false,true),
('dd000000-0000-4000-8000-000000000004','14ffd897-81d1-409e-9f50-c96a416e0d26','recommend_properties','mock','mock-1',0.3,false,true),
('dd000000-0000-4000-8000-000000000005','14ffd897-81d1-409e-9f50-c96a416e0d26','generate_property_description','mock','mock-1',0.7,false,true),
('dd000000-0000-4000-8000-000000000006','14ffd897-81d1-409e-9f50-c96a416e0d26','next_best_action','mock','mock-1',0.2,false,true);

-- ── Landing page (Ensenada house) ────────────────────────────────────────────
INSERT INTO landing_pages (id, organization_id, kind, property_id, slug, template, is_active, hide_price, show_exact_location, seo) VALUES
('de000000-0000-4000-8000-000000000001','14ffd897-81d1-409e-9f50-c96a416e0d26','property','b2000000-0000-4000-8000-000000000001','casa-frente-al-mar-ensenada','default',true,false,false,'{"title":"Casa frente al mar en Ensenada","description":"Residencia de lujo con vista al Pacífico y acceso a playa privada."}');

-- ── Client portal accounts ────────────────────────────────────────────────────
INSERT INTO client_portal_accounts (id, organization_id, contact_id, email, portal_type, status) VALUES
('e0000000-0000-4000-8000-000000000001','14ffd897-81d1-409e-9f50-c96a416e0d26','d4000000-0000-4000-8000-000000000001','roberto.gomez@gmail.com','buyer','active'),
('e0000000-0000-4000-8000-000000000002','14ffd897-81d1-409e-9f50-c96a416e0d26','d4000000-0000-4000-8000-000000000008','carmen.ruiz@gmail.com','seller','active'),
('e0000000-0000-4000-8000-000000000003','14ffd897-81d1-409e-9f50-c96a416e0d26','d4000000-0000-4000-8000-000000000005','eduardo.v@empresa.mx','investor','active');
