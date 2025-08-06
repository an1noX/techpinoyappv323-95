--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:28:24 UTC

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
-- TOC entry 306 (class 1259 OID 52727)
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    client_name text NOT NULL,
    client_address text,
    client_phone text,
    client_email text,
    date date NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    notes text,
    total numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3845 (class 0 OID 52727)
-- Dependencies: 306
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, type, client_name, client_address, client_phone, client_email, date, items, notes, total, created_at, updated_at) FROM stdin;
549166dd-99e6-42d8-923f-b82b50219144	service-report	test	test	test		2025-06-30	[{"total": 0, "quantity": 1, "unitPrice": 0, "description": "test"}]	test	0	2025-06-30 13:41:04.731321+00	2025-06-30 13:41:04.731321+00
\.


--
-- TOC entry 3693 (class 2606 OID 52738)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 3694 (class 2620 OID 52739)
-- Name: documents update_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3843 (class 3256 OID 52740)
-- Name: documents Public access to documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public access to documents" ON public.documents USING (true) WITH CHECK (true);


--
-- TOC entry 3842 (class 0 OID 52727)
-- Dependencies: 306
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:28:26 UTC

--
-- PostgreSQL database dump complete
--

