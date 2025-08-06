--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:09 UTC

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
-- TOC entry 327 (class 1259 OID 65477)
-- Name: printer_visibility; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.printer_visibility (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    printer_id uuid NOT NULL,
    client_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3848 (class 0 OID 65477)
-- Dependencies: 327
-- Data for Name: printer_visibility; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.printer_visibility (id, printer_id, client_id, created_at, updated_at) FROM stdin;
0a4b1e4b-5e29-4095-8ea1-d67a50bb98de	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	6e4139f4-b341-44dd-8a84-24a9bff971fa	2025-07-11 10:37:28.779121+00	2025-07-11 10:37:28.779121+00
7e23f30d-c91b-4287-b087-2e76464bf1c9	8f37e3e5-6797-4424-b896-0b22f18aa1ca	c716cb3b-0765-4271-b88f-e1ecff73ec24	2025-07-11 10:41:37.016974+00	2025-07-11 10:41:37.016974+00
f9a65c26-98f6-47f8-a6aa-5b60f268d00b	91c68cc3-30b5-419d-8eb8-20930ebc1d16	c716cb3b-0765-4271-b88f-e1ecff73ec24	2025-07-11 14:57:32.466489+00	2025-07-11 14:57:32.466489+00
\.


--
-- TOC entry 3691 (class 2606 OID 65484)
-- Name: printer_visibility printer_visibility_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_visibility
    ADD CONSTRAINT printer_visibility_pkey PRIMARY KEY (id);


--
-- TOC entry 3693 (class 2606 OID 65486)
-- Name: printer_visibility printer_visibility_printer_id_client_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_visibility
    ADD CONSTRAINT printer_visibility_printer_id_client_id_key UNIQUE (printer_id, client_id);


--
-- TOC entry 3696 (class 2620 OID 65499)
-- Name: printer_visibility update_printer_visibility_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_printer_visibility_updated_at BEFORE UPDATE ON public.printer_visibility FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3694 (class 2606 OID 65492)
-- Name: printer_visibility printer_visibility_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_visibility
    ADD CONSTRAINT printer_visibility_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 3695 (class 2606 OID 65487)
-- Name: printer_visibility printer_visibility_printer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_visibility
    ADD CONSTRAINT printer_visibility_printer_id_fkey FOREIGN KEY (printer_id) REFERENCES public.printers(id) ON DELETE CASCADE;


--
-- TOC entry 3845 (class 3256 OID 65498)
-- Name: printer_visibility Anyone can manage printer visibility; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can manage printer visibility" ON public.printer_visibility USING (true);


--
-- TOC entry 3846 (class 3256 OID 65497)
-- Name: printer_visibility Anyone can view printer visibility; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view printer visibility" ON public.printer_visibility FOR SELECT USING (true);


--
-- TOC entry 3844 (class 0 OID 65477)
-- Dependencies: 327
-- Name: printer_visibility; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.printer_visibility ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:33:12 UTC

--
-- PostgreSQL database dump complete
--

