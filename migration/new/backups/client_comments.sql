--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:30:32 UTC

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
-- TOC entry 322 (class 1259 OID 60906)
-- Name: client_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    comment text NOT NULL,
    is_internal boolean DEFAULT true,
    priority text DEFAULT 'normal'::text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_comments_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])))
);


--
-- TOC entry 3848 (class 0 OID 60906)
-- Dependencies: 322
-- Data for Name: client_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_comments (id, client_id, comment, is_internal, priority, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3694 (class 2606 OID 60918)
-- Name: client_comments client_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_comments
    ADD CONSTRAINT client_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 3695 (class 1259 OID 60958)
-- Name: idx_client_comments_client_id_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_comments_client_id_date ON public.client_comments USING btree (client_id, created_at DESC);


--
-- TOC entry 3696 (class 2606 OID 60919)
-- Name: client_comments client_comments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_comments
    ADD CONSTRAINT client_comments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 3697 (class 2606 OID 60924)
-- Name: client_comments client_comments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_comments
    ADD CONSTRAINT client_comments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- TOC entry 3846 (class 3256 OID 60982)
-- Name: client_comments Anyone can manage client comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can manage client comments" ON public.client_comments USING (true);


--
-- TOC entry 3845 (class 0 OID 60906)
-- Dependencies: 322
-- Name: client_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_comments ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:30:35 UTC

--
-- PostgreSQL database dump complete
--

