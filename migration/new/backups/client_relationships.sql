--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:30:40 UTC

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
-- TOC entry 323 (class 1259 OID 60929)
-- Name: client_relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_relationships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_client_id uuid NOT NULL,
    child_client_id uuid NOT NULL,
    relationship_type text DEFAULT 'subsidiary'::text,
    established_date date DEFAULT CURRENT_DATE,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_relationships_check CHECK ((parent_client_id <> child_client_id)),
    CONSTRAINT client_relationships_relationship_type_check CHECK ((relationship_type = ANY (ARRAY['subsidiary'::text, 'branch'::text, 'partner'::text, 'vendor'::text])))
);


--
-- TOC entry 3849 (class 0 OID 60929)
-- Dependencies: 323
-- Data for Name: client_relationships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_relationships (id, parent_client_id, child_client_id, relationship_type, established_date, notes, created_at) FROM stdin;
\.


--
-- TOC entry 3694 (class 2606 OID 60943)
-- Name: client_relationships client_relationships_parent_client_id_child_client_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_relationships
    ADD CONSTRAINT client_relationships_parent_client_id_child_client_id_key UNIQUE (parent_client_id, child_client_id);


--
-- TOC entry 3696 (class 2606 OID 60941)
-- Name: client_relationships client_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_relationships
    ADD CONSTRAINT client_relationships_pkey PRIMARY KEY (id);


--
-- TOC entry 3697 (class 2606 OID 60949)
-- Name: client_relationships client_relationships_child_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_relationships
    ADD CONSTRAINT client_relationships_child_client_id_fkey FOREIGN KEY (child_client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 3698 (class 2606 OID 60944)
-- Name: client_relationships client_relationships_parent_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_relationships
    ADD CONSTRAINT client_relationships_parent_client_id_fkey FOREIGN KEY (parent_client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 3847 (class 3256 OID 60983)
-- Name: client_relationships Anyone can manage client relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can manage client relationships" ON public.client_relationships USING (true);


--
-- TOC entry 3846 (class 0 OID 60929)
-- Dependencies: 323
-- Name: client_relationships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_relationships ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:30:43 UTC

--
-- PostgreSQL database dump complete
--

