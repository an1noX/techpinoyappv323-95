--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:28:46 UTC

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
-- TOC entry 302 (class 1259 OID 38217)
-- Name: parts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    sku text NOT NULL,
    category text NOT NULL,
    part_type text NOT NULL,
    description text,
    color text,
    stock_quantity integer DEFAULT 0,
    min_stock_level integer DEFAULT 0,
    unit_price numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT parts_part_type_check CHECK ((part_type = ANY (ARRAY['consumable'::text, 'component'::text, 'accessory'::text, 'maintenance'::text])))
);


--
-- TOC entry 3852 (class 0 OID 38217)
-- Dependencies: 302
-- Data for Name: parts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parts (id, name, sku, category, part_type, description, color, stock_quantity, min_stock_level, unit_price, created_at, updated_at) FROM stdin;
b19689d1-b54a-49e0-9fd3-5f67bf28d316	HP 305A Black Toner Cartridge	HP-305A-BK	Toner Cartridge	consumable	Original HP black toner cartridge	black	0	0	0	2025-06-18 03:33:39.332916+00	2025-06-18 03:33:39.332916+00
6039780d-1b0a-4ee4-a7cb-864752afb2e1	Canon CL-246 Color Ink Cartridge	CN-CL246-CLR	Ink Cartridge	consumable	Original Canon color ink cartridge	multicolor	0	0	0	2025-06-18 03:33:39.332916+00	2025-06-18 03:33:39.332916+00
805ba1b4-e785-426b-bc67-660703937607	Epson 212XL Cyan Ink Cartridge	EP-212XL-CY	Ink Cartridge	consumable	High yield cyan ink cartridge	cyan	0	0	0	2025-06-18 03:33:39.332916+00	2025-06-18 03:33:39.332916+00
0ac43629-8c4d-44e4-af93-590cce7f024e	Brother TN-760 Black Toner	BR-TN760-BK	Toner Cartridge	consumable	High yield black toner cartridge	black	0	0	0	2025-06-18 03:33:39.332916+00	2025-06-18 03:33:39.332916+00
597bc15a-5c27-4043-a67d-84f5fe774306	HP LaserJet Fuser Unit	HP-LJ-FUSER	Fuser Unit	component	Replacement fuser unit for HP LaserJet printers	\N	0	0	0	2025-06-18 03:33:39.332916+00	2025-06-18 03:33:39.332916+00
86508fd5-28b4-4157-9b20-72a7e5f92189	DR2355	DR2355	Drum Unit	consumable	\N	black	10	0	0	2025-06-18 03:45:49.326554+00	2025-06-18 03:45:49.326554+00
\.


--
-- TOC entry 3695 (class 2606 OID 38230)
-- Name: parts parts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts
    ADD CONSTRAINT parts_pkey PRIMARY KEY (id);


--
-- TOC entry 3697 (class 2606 OID 38232)
-- Name: parts parts_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts
    ADD CONSTRAINT parts_sku_key UNIQUE (sku);


--
-- TOC entry 3698 (class 2620 OID 38291)
-- Name: parts update_parts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON public.parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3847 (class 3256 OID 38282)
-- Name: parts Allow delete access to parts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete access to parts" ON public.parts FOR DELETE USING (true);


--
-- TOC entry 3848 (class 3256 OID 38280)
-- Name: parts Allow insert access to parts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert access to parts" ON public.parts FOR INSERT WITH CHECK (true);


--
-- TOC entry 3849 (class 3256 OID 38279)
-- Name: parts Allow read access to parts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to parts" ON public.parts FOR SELECT USING (true);


--
-- TOC entry 3850 (class 3256 OID 38281)
-- Name: parts Allow update access to parts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update access to parts" ON public.parts FOR UPDATE USING (true);


--
-- TOC entry 3846 (class 0 OID 38217)
-- Dependencies: 302
-- Name: parts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:28:49 UTC

--
-- PostgreSQL database dump complete
--

