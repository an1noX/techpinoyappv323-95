--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:28:02 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 276 (class 1259 OID 17350)
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    contact_email text,
    phone text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    address text,
    contact_person text,
    department_count integer DEFAULT 0,
    printer_count integer DEFAULT 0,
    client_code text,
    status text DEFAULT 'active'::text,
    timezone text,
    archived_at timestamp with time zone,
    tags text[],
    location_count integer DEFAULT 0,
    CONSTRAINT clients_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);


--
-- TOC entry 3861 (class 0 OID 0)
-- Dependencies: 276
-- Name: COLUMN clients.location_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clients.location_count IS 'Count of locations associated with this client';


--
-- TOC entry 3855 (class 0 OID 17350)
-- Dependencies: 276
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, name, contact_email, phone, notes, created_at, updated_at, address, contact_person, department_count, printer_count, client_code, status, timezone, archived_at, tags, location_count) FROM stdin;
c4bde792-9152-4423-844c-da987305c7a8	Cartimar	\N	\N	\N	2025-05-31 08:14:53.142505+00	2025-06-19 14:56:32.898622+00	\N	\N	1	2	\N	active	\N	\N	\N	0
3030fd7c-abd2-43a3-86da-75e083f5c298	Lianas	\N	\N	\N	2025-05-31 08:23:14.541073+00	2025-06-19 14:56:32.898622+00	\N	\N	1	2	\N	active	\N	\N	\N	0
a924925f-8531-4533-be70-741e883c859b	Dragon King Food Corporation	dragonkingfoodcorp@yahoo.com.ph	\N	\N	2025-06-04 23:29:57.238264+00	2025-06-16 12:41:48.277754+00	\N	\N	0	0	\N	active	\N	\N	\N	0
8945814e-43ce-48c8-aeeb-87f92415ff00	Myrna	\N	\N	\N	2025-05-31 08:14:53.506271+00	2025-06-16 12:41:48.277754+00	\N	\N	0	0	\N	active	\N	\N	\N	0
7cac77c2-cbeb-4d3e-a661-39ef4ac09399	SycipLaw Office	\N	\N	\N	2025-05-31 08:14:53.714919+00	2025-06-16 12:41:48.277754+00	\N	\N	0	0	\N	active	\N	\N	\N	0
5e737c15-2240-4b24-98b1-1fef51654338	Lianas - Jolibee	\N	\N	\N	2025-06-19 03:05:27.986932+00	2025-06-19 03:05:27.986932+00	\N	\N	0	0	\N	active	\N	\N	\N	0
4293be2f-815e-46ba-ab6c-2f0e12a298bb	Lianas - Main Office	\N	\N	\N	2025-06-19 03:05:36.8413+00	2025-06-19 03:05:36.8413+00	\N	\N	0	0	\N	active	\N	\N	\N	0
973e3da1-a0e3-4103-89e9-1c83ed86f225	Vision	vision@vision.com	\N	\N	2025-06-19 10:01:09.695418+00	2025-06-19 10:01:09.695418+00	\N	\N	0	0	\N	active	\N	\N	\N	0
7aa649e8-6534-435d-8116-9de7f134d546	FPD Asia	\N	\N	\N	2025-05-31 08:14:54.346742+00	2025-06-16 12:41:48.277754+00	\N	\N	0	0	\N	active	\N	\N	\N	0
5bd6a9ba-a1a9-4aa7-84e4-a8575efd8870	Pasay Market	\N	\N	\N	2025-05-31 08:14:54.56909+00	2025-06-16 12:41:48.277754+00	\N	\N	0	0	\N	active	\N	\N	\N	0
e7636f67-bf8c-4e0b-969b-19f07bb2cbc8	Gaad / Anjs	\N	\N	\N	2025-05-31 08:14:54.15799+00	2025-07-01 16:00:53.073604+00	\N	\N	1	1	\N	active	\N	\N	\N	0
6e4139f4-b341-44dd-8a84-24a9bff971fa	7 Eleven	\N	\N	\N	2025-06-19 03:05:08.632285+00	2025-07-01 20:46:47.701461+00	\N	Kris / Janey	1	1	\N	active	\N	\N	\N	0
c716cb3b-0765-4271-b88f-e1ecff73ec24	Aims	aims@aims.com	\N	\N	2025-06-19 10:00:31.226855+00	2025-07-12 11:57:50.720821+00	\N	\N	7	18	\N	active	\N	\N	\N	0
\.


--
-- TOC entry 3696 (class 2606 OID 17359)
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- TOC entry 3697 (class 1259 OID 64365)
-- Name: idx_clients_archived_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_archived_at ON public.clients USING btree (archived_at);


--
-- TOC entry 3698 (class 1259 OID 60954)
-- Name: idx_clients_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_status ON public.clients USING btree (status);


--
-- TOC entry 3699 (class 1259 OID 60955)
-- Name: idx_clients_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_tags ON public.clients USING gin (tags);


--
-- TOC entry 3700 (class 2620 OID 60968)
-- Name: clients client_audit_log_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER client_audit_log_trigger AFTER INSERT OR UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.trigger_client_audit_log();


--
-- TOC entry 3701 (class 2620 OID 17398)
-- Name: clients clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3850 (class 3256 OID 17405)
-- Name: clients Enable delete access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for all users" ON public.clients FOR DELETE USING (true);


--
-- TOC entry 3851 (class 3256 OID 17403)
-- Name: clients Enable insert access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for all users" ON public.clients FOR INSERT WITH CHECK (true);


--
-- TOC entry 3852 (class 3256 OID 17402)
-- Name: clients Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.clients FOR SELECT USING (true);


--
-- TOC entry 3853 (class 3256 OID 17404)
-- Name: clients Enable update access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for all users" ON public.clients FOR UPDATE USING (true);


--
-- TOC entry 3849 (class 0 OID 17350)
-- Dependencies: 276
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:28:05 UTC

--
-- PostgreSQL database dump complete
--

