--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:30:29 UTC

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
-- TOC entry 317 (class 1259 OID 60782)
-- Name: client_category_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_category_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    category_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3846 (class 0 OID 60782)
-- Dependencies: 317
-- Data for Name: client_category_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_category_assignments (id, client_id, category_id, assigned_at) FROM stdin;
\.


--
-- TOC entry 3690 (class 2606 OID 60790)
-- Name: client_category_assignments client_category_assignments_client_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_category_assignments
    ADD CONSTRAINT client_category_assignments_client_id_category_id_key UNIQUE (client_id, category_id);


--
-- TOC entry 3692 (class 2606 OID 60788)
-- Name: client_category_assignments client_category_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_category_assignments
    ADD CONSTRAINT client_category_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 3693 (class 2606 OID 60796)
-- Name: client_category_assignments client_category_assignments_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_category_assignments
    ADD CONSTRAINT client_category_assignments_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.client_categories(id) ON DELETE CASCADE;


--
-- TOC entry 3694 (class 2606 OID 60791)
-- Name: client_category_assignments client_category_assignments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_category_assignments
    ADD CONSTRAINT client_category_assignments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 3843 (class 3256 OID 60973)
-- Name: client_category_assignments Anyone can manage client category assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can manage client category assignments" ON public.client_category_assignments USING (true);


--
-- TOC entry 3844 (class 3256 OID 60972)
-- Name: client_category_assignments Anyone can view client category assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view client category assignments" ON public.client_category_assignments FOR SELECT USING (true);


--
-- TOC entry 3842 (class 0 OID 60782)
-- Dependencies: 317
-- Name: client_category_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_category_assignments ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:30:32 UTC

--
-- PostgreSQL database dump complete
--

