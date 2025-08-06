--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:32:47 UTC

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
-- TOC entry 303 (class 1259 OID 38233)
-- Name: parts_printers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts_printers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    part_id uuid NOT NULL,
    printer_id uuid NOT NULL,
    compatibility_notes text,
    is_recommended boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3849 (class 0 OID 38233)
-- Dependencies: 303
-- Data for Name: parts_printers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parts_printers (id, part_id, printer_id, compatibility_notes, is_recommended, created_at) FROM stdin;
\.


--
-- TOC entry 3691 (class 2606 OID 38244)
-- Name: parts_printers parts_printers_part_id_printer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_printers
    ADD CONSTRAINT parts_printers_part_id_printer_id_key UNIQUE (part_id, printer_id);


--
-- TOC entry 3693 (class 2606 OID 38242)
-- Name: parts_printers parts_printers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_printers
    ADD CONSTRAINT parts_printers_pkey PRIMARY KEY (id);


--
-- TOC entry 3694 (class 2606 OID 38245)
-- Name: parts_printers parts_printers_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_printers
    ADD CONSTRAINT parts_printers_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE CASCADE;


--
-- TOC entry 3695 (class 2606 OID 38250)
-- Name: parts_printers parts_printers_printer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_printers
    ADD CONSTRAINT parts_printers_printer_id_fkey FOREIGN KEY (printer_id) REFERENCES public.printers(id) ON DELETE CASCADE;


--
-- TOC entry 3844 (class 3256 OID 38286)
-- Name: parts_printers Allow delete access to parts_printers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete access to parts_printers" ON public.parts_printers FOR DELETE USING (true);


--
-- TOC entry 3845 (class 3256 OID 38284)
-- Name: parts_printers Allow insert access to parts_printers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert access to parts_printers" ON public.parts_printers FOR INSERT WITH CHECK (true);


--
-- TOC entry 3846 (class 3256 OID 38283)
-- Name: parts_printers Allow read access to parts_printers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to parts_printers" ON public.parts_printers FOR SELECT USING (true);


--
-- TOC entry 3847 (class 3256 OID 38285)
-- Name: parts_printers Allow update access to parts_printers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update access to parts_printers" ON public.parts_printers FOR UPDATE USING (true);


--
-- TOC entry 3843 (class 0 OID 38233)
-- Dependencies: 303
-- Name: parts_printers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.parts_printers ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:32:50 UTC

--
-- PostgreSQL database dump complete
--

