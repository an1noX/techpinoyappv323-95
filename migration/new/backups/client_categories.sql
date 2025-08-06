--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:27:43 UTC

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
-- TOC entry 316 (class 1259 OID 60770)
-- Name: client_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    color text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3844 (class 0 OID 60770)
-- Dependencies: 316
-- Data for Name: client_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_categories (id, name, description, color, created_at, updated_at) FROM stdin;
c978e9f6-a304-480d-9e11-232e020715bb	Government	Government agencies and public sector	#3B82F6	2025-07-07 18:30:29.72199+00	2025-07-07 18:30:29.72199+00
b07af9ad-a66f-49b3-bd8e-45af56053fe0	Retail	Retail businesses and stores	#10B981	2025-07-07 18:30:29.72199+00	2025-07-07 18:30:29.72199+00
e68b48e6-f78e-423d-921e-704acc29b8b3	Enterprise	Large enterprise clients	#8B5CF6	2025-07-07 18:30:29.72199+00	2025-07-07 18:30:29.72199+00
2e80fbaa-3e12-4cde-9c09-940ea9cbfad4	Healthcare	Healthcare facilities and clinics	#EF4444	2025-07-07 18:30:29.72199+00	2025-07-07 18:30:29.72199+00
f394bf8f-d5ec-42f9-a309-a0a09bd8931a	Education	Schools and educational institutions	#F59E0B	2025-07-07 18:30:29.72199+00	2025-07-07 18:30:29.72199+00
1d6ace69-a2f0-47e9-be60-4eb012002120	Small Business	Small to medium businesses	#6B7280	2025-07-07 18:30:29.72199+00	2025-07-07 18:30:29.72199+00
\.


--
-- TOC entry 3691 (class 2606 OID 60781)
-- Name: client_categories client_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_categories
    ADD CONSTRAINT client_categories_name_key UNIQUE (name);


--
-- TOC entry 3693 (class 2606 OID 60779)
-- Name: client_categories client_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_categories
    ADD CONSTRAINT client_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3842 (class 3256 OID 60971)
-- Name: client_categories Anyone can view client categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view client categories" ON public.client_categories FOR SELECT USING (true);


--
-- TOC entry 3841 (class 0 OID 60770)
-- Dependencies: 316
-- Name: client_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_categories ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:27:46 UTC

--
-- PostgreSQL database dump complete
--

