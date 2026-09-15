-- ==============================================================================
-- Lashm.anya AI - Supabase & PostgreSQL Database Schema
-- Includes Tables, Foreign Keys, Indexes, Row Level Security (RLS) & Seed Data
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Services
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price NUMERIC(10, 2) DEFAULT NULL, -- NULL by default as per rule: price is null unless master sets it
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Admin Users / Masters
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'master', -- 'master', 'admin'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Clients
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    phone VARCHAR(50),
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_visit_at TIMESTAMPTZ DEFAULT NULL,
    visit_count INTEGER NOT NULL DEFAULT 0,
    preferences TEXT,
    notes TEXT,
    ai_memory JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Client Structured Memory
CREATE TABLE IF NOT EXISTS public.client_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    structured_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_notes TEXT,
    updated_by VARCHAR(50) NOT NULL DEFAULT 'ai', -- 'ai' or 'master'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Client Notes by Master
CREATE TABLE IF NOT EXISTS public.client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_by VARCHAR(50) NOT NULL DEFAULT 'master',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Master Availability & Schedule
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Mon, 7=Sun
    start_time TIME NOT NULL DEFAULT '10:00:00',
    end_time TIME NOT NULL DEFAULT '19:00:00',
    slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
    is_day_off BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'rescheduled', 'completed'
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    client_notes TEXT,
    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Prevent double booking for the same active slot
    CONSTRAINT unique_confirmed_slot UNIQUE (appointment_date, appointment_time, status)
);

-- 8. AI Conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    telegram_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'booking_created', 'handoff_to_master', 'resolved'
    last_intent VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Chat Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL, -- 'client', 'ai', 'master', 'system'
    message_text TEXT NOT NULL,
    payload JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Automated Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'booking_confirmation', 'day_before_reminder', 'post_visit_thank_you', 'rebooking_suggestion'
    send_at TIMESTAMPTZ NOT NULL,
    sent BOOLEAN NOT NULL DEFAULT FALSE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Business Settings
CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio_name VARCHAR(255) NOT NULL DEFAULT 'Lashm.anya',
    tagline VARCHAR(255) NOT NULL DEFAULT 'Взгляд без лишнего.',
    subtitle VARCHAR(255) NOT NULL DEFAULT 'Наращивание и ламинирование ресниц в Новосибирске.',
    city VARCHAR(100) NOT NULL DEFAULT 'Новосибирск',
    address VARCHAR(255) NOT NULL DEFAULT 'ул. Киевская, 27, офис 48, 4 этаж',
    rating NUMERIC(2, 1) NOT NULL DEFAULT 5.0,
    review_count INTEGER NOT NULL DEFAULT 14,
    twogis_url TEXT NOT NULL DEFAULT 'https://2gis.ru/novosibirsk/firm/70000001110562714',
    phone VARCHAR(50) NOT NULL DEFAULT '+7 (913) 000-00-00',
    pre_booking_only BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_hours_before INTEGER NOT NULL DEFAULT 24,
    repeat_reminder_days INTEGER NOT NULL DEFAULT 28,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_telegram_id ON public.clients(telegram_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_telegram_id ON public.ai_conversations(telegram_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is master/admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE telegram_id = auth.jwt() ->> 'telegram_id'
       OR role IN ('admin', 'master')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Services Policies: Public read for active services; Masters can update prices and details
CREATE POLICY "Public read active services" ON public.services
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admin manage services" ON public.services
    FOR ALL USING (public.is_admin());

-- Business Settings: Public read
CREATE POLICY "Public read business settings" ON public.business_settings
    FOR SELECT USING (TRUE);

CREATE POLICY "Admin update business settings" ON public.business_settings
    FOR UPDATE USING (public.is_admin());

-- Availability: Public can read open slots, Admins manage
CREATE POLICY "Public read availability" ON public.availability
    FOR SELECT USING (TRUE);

CREATE POLICY "Admin manage availability" ON public.availability
    FOR ALL USING (public.is_admin());

-- Clients Policies: Client sees only their own record; Master sees all
CREATE POLICY "Clients read own record" ON public.clients
    FOR SELECT USING (
        telegram_id = auth.jwt() ->> 'telegram_id'
        OR public.is_admin()
    );

CREATE POLICY "Clients update own record" ON public.clients
    FOR UPDATE USING (telegram_id = auth.jwt() ->> 'telegram_id');

CREATE POLICY "Admin manage clients" ON public.clients
    FOR ALL USING (public.is_admin());

-- Appointments Policies: Client sees only their appointments; Master sees studio schedule
CREATE POLICY "Clients read own appointments" ON public.appointments
    FOR SELECT USING (
        client_id IN (SELECT id FROM public.clients WHERE telegram_id = auth.jwt() ->> 'telegram_id')
        OR public.is_admin()
    );

CREATE POLICY "Clients insert own appointment" ON public.appointments
    FOR INSERT WITH CHECK (
        client_id IN (SELECT id FROM public.clients WHERE telegram_id = auth.jwt() ->> 'telegram_id')
        OR public.is_admin()
    );

CREATE POLICY "Clients cancel/reschedule own appointment" ON public.appointments
    FOR UPDATE USING (
        client_id IN (SELECT id FROM public.clients WHERE telegram_id = auth.jwt() ->> 'telegram_id')
        OR public.is_admin()
    );

CREATE POLICY "Admin manage all appointments" ON public.appointments
    FOR ALL USING (public.is_admin());

-- Client Memory Policies: Master and backend service role access
CREATE POLICY "Admin read client memory" ON public.client_memory
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin update client memory" ON public.client_memory
    FOR ALL USING (public.is_admin());

-- Client Notes Policies: Master only
CREATE POLICY "Admin read and write notes" ON public.client_notes
    FOR ALL USING (public.is_admin());

-- Messages & Conversations: Client accesses own conversation; Master accesses all
CREATE POLICY "Client read own conversations" ON public.ai_conversations
    FOR SELECT USING (
        telegram_id = auth.jwt() ->> 'telegram_id'
        OR public.is_admin()
    );

CREATE POLICY "Client read own messages" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.ai_conversations 
            WHERE telegram_id = auth.jwt() ->> 'telegram_id'
        )
        OR public.is_admin()
    );

CREATE POLICY "Admin manage all messages" ON public.messages
    FOR ALL USING (public.is_admin());

-- ==============================================================================
-- INITIAL SEED DATA (Confirmed Lashm.anya data)
-- ==============================================================================

-- 1. Verified Services (Price: NULL by default as specified in prompt)
INSERT INTO public.services (id, name, description, duration_minutes, price, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Наращивание ресниц', 'Подбор формы и эффекта под особенности взгляда.', 120, NULL, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Ламинирование ресниц', 'Процедура для создания выразительного и аккуратного взгляда.', 90, NULL, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. Business Settings
INSERT INTO public.business_settings (
    id, studio_name, tagline, subtitle, city, address, rating, review_count, twogis_url, phone, pre_booking_only
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Lashm.anya',
    'Взгляд без лишнего.',
    'Наращивание и ламинирование ресниц в Новосибирске.',
    'Новосибирск',
    'ул. Киевская, 27, офис 48, 4 этаж',
    5.0,
    14,
    'https://2gis.ru/novosibirsk/firm/70000001110562714',
    '+7 (913) 000-00-00',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 3. Standard Weekly Schedule (Mon-Fri 10:00-19:00, Sat-Sun on request / day off)
INSERT INTO public.availability (day_of_week, start_time, end_time, slot_duration_minutes, is_day_off)
VALUES 
    (1, '10:00:00', '19:00:00', 60, FALSE),
    (2, '10:00:00', '19:00:00', 60, FALSE),
    (3, '10:00:00', '19:00:00', 60, FALSE),
    (4, '10:00:00', '19:00:00', 60, FALSE),
    (5, '10:00:00', '19:00:00', 60, FALSE),
    (6, '11:00:00', '17:00:00', 60, FALSE),
    (7, '10:00:00', '19:00:00', 60, TRUE)
ON CONFLICT DO NOTHING;
