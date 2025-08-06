--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:32:07 UTC

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
-- TOC entry 314 (class 1259 OID 54085)
-- Name: supplier_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supplier_id uuid NOT NULL,
    name text NOT NULL,
    title text,
    email text,
    phone text,
    department text,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3846 (class 0 OID 54085)
-- Dependencies: 314
-- Data for Name: supplier_contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_contacts (id, supplier_id, name, title, email, phone, department, is_primary, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3692 (class 2606 OID 54095)
-- Name: supplier_contacts supplier_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_contacts
    ADD CONSTRAINT supplier_contacts_pkey PRIMARY KEY (id);


--
-- TOC entry 3694 (class 2620 OID 54126)
-- Name: supplier_contacts update_supplier_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_supplier_contacts_updated_at BEFORE UPDATE ON public.supplier_contacts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3693 (class 2606 OID 54096)
-- Name: supplier_contacts supplier_contacts_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_contacts
    ADD CONSTRAINT supplier_contacts_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- TOC entry 3843 (class 3256 OID 54122)
-- Name: supplier_contacts Admins can manage supplier contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage supplier contacts" ON public.supplier_contacts USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- TOC entry 3844 (class 3256 OID 54121)
-- Name: supplier_contacts Users can view supplier contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view supplier contacts" ON public.supplier_contacts FOR SELECT USING (true);


--
-- TOC entry 3842 (class 0 OID 54085)
-- Dependencies: 314
-- Name: supplier_contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supplier_contacts ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:32:10 UTC

--
-- PostgreSQL database dump complete
--

