--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:32:10 UTC

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
-- TOC entry 315 (class 1259 OID 54101)
-- Name: supplier_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supplier_id uuid NOT NULL,
    content text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3847 (class 0 OID 54101)
-- Dependencies: 315
-- Data for Name: supplier_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_notes (id, supplier_id, content, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3691 (class 2606 OID 54110)
-- Name: supplier_notes supplier_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_notes
    ADD CONSTRAINT supplier_notes_pkey PRIMARY KEY (id);


--
-- TOC entry 3694 (class 2620 OID 54127)
-- Name: supplier_notes update_supplier_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_supplier_notes_updated_at BEFORE UPDATE ON public.supplier_notes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3692 (class 2606 OID 54116)
-- Name: supplier_notes supplier_notes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_notes
    ADD CONSTRAINT supplier_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- TOC entry 3693 (class 2606 OID 54111)
-- Name: supplier_notes supplier_notes_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_notes
    ADD CONSTRAINT supplier_notes_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- TOC entry 3843 (class 3256 OID 54125)
-- Name: supplier_notes Admins can manage supplier notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage supplier notes" ON public.supplier_notes USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- TOC entry 3844 (class 3256 OID 54124)
-- Name: supplier_notes Users can insert supplier notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert supplier notes" ON public.supplier_notes FOR INSERT WITH CHECK ((created_by = auth.uid()));


--
-- TOC entry 3845 (class 3256 OID 54123)
-- Name: supplier_notes Users can view supplier notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view supplier notes" ON public.supplier_notes FOR SELECT USING (true);


--
-- TOC entry 3842 (class 0 OID 54101)
-- Dependencies: 315
-- Name: supplier_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supplier_notes ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:32:12 UTC

--
-- PostgreSQL database dump complete
--

