--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:30:05 UTC

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
-- TOC entry 272 (class 1259 OID 17265)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    contact_email text,
    phone text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    address text,
    status text DEFAULT 'active'::text,
    supplier_code text,
    website text,
    payment_terms text,
    location_count integer DEFAULT 0
);


--
-- TOC entry 3856 (class 0 OID 0)
-- Dependencies: 272
-- Name: COLUMN suppliers.location_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.suppliers.location_count IS 'Count of supplier locations';


--
-- TOC entry 3850 (class 0 OID 17265)
-- Dependencies: 272
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, name, contact_email, phone, notes, created_at, updated_at, address, status, supplier_code, website, payment_terms, location_count) FROM stdin;
a6434f12-20b6-450c-91dd-fdf83e6e8766	Meyink				2025-05-30 11:56:55.191014+00	2025-05-30 11:56:55.191014+00	\N	active	\N	\N	\N	0
ad8d6634-43c4-494a-9ef7-9e569504b9ed	TonerPro				2025-05-30 12:48:36.907693+00	2025-05-30 12:48:36.907693+00	\N	active	\N	\N	\N	0
7199ade7-d5c0-42bb-b369-ab6369ec7531	StarInk				2025-05-30 12:55:53.223838+00	2025-05-30 12:55:53.223838+00	\N	active	\N	\N	\N	0
61a407ef-27c9-42a4-a2bc-07acdaf75f4c	ZK Import	\N	\N	\N	2025-05-30 13:56:00.757897+00	2025-05-31 05:13:39.537276+00	\N	active	\N	\N	\N	0
\.


--
-- TOC entry 3695 (class 2606 OID 17274)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 3692 (class 1259 OID 54129)
-- Name: idx_suppliers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suppliers_status ON public.suppliers USING btree (status);


--
-- TOC entry 3693 (class 1259 OID 54130)
-- Name: idx_suppliers_supplier_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suppliers_supplier_code ON public.suppliers USING btree (supplier_code);


--
-- TOC entry 3696 (class 2620 OID 17327)
-- Name: suppliers handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3845 (class 3256 OID 17316)
-- Name: suppliers Anyone can delete suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete suppliers" ON public.suppliers FOR DELETE USING (true);


--
-- TOC entry 3846 (class 3256 OID 17314)
-- Name: suppliers Anyone can insert suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (true);


--
-- TOC entry 3847 (class 3256 OID 17315)
-- Name: suppliers Anyone can update suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update suppliers" ON public.suppliers FOR UPDATE USING (true);


--
-- TOC entry 3848 (class 3256 OID 17313)
-- Name: suppliers Anyone can view suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view suppliers" ON public.suppliers FOR SELECT USING (true);


--
-- TOC entry 3844 (class 0 OID 17265)
-- Dependencies: 272
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:30:08 UTC

--
-- PostgreSQL database dump complete
--

