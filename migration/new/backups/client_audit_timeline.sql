--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:30:27 UTC

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
-- TOC entry 321 (class 1259 OID 60887)
-- Name: client_audit_timeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_audit_timeline (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    field_changed text NOT NULL,
    old_value text,
    new_value text,
    change_reason text,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3845 (class 0 OID 60887)
-- Dependencies: 321
-- Data for Name: client_audit_timeline; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_audit_timeline (id, client_id, field_changed, old_value, new_value, change_reason, changed_by, changed_at) FROM stdin;
a6f863f1-b3b9-4d49-a464-3392a5cfb28d	c716cb3b-0765-4271-b88f-e1ecff73ec24	contact_email	aims@aims.com		\N	\N	2025-07-08 13:46:19.085391+00
7e3c04a3-b567-44c8-aa16-99ca846deb67	c716cb3b-0765-4271-b88f-e1ecff73ec24	contact_email		aims@aims.com	\N	\N	2025-07-09 22:23:06.622996+00
\.


--
-- TOC entry 3690 (class 2606 OID 60895)
-- Name: client_audit_timeline client_audit_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_audit_timeline
    ADD CONSTRAINT client_audit_timeline_pkey PRIMARY KEY (id);


--
-- TOC entry 3691 (class 1259 OID 60957)
-- Name: idx_client_audit_timeline_client_id_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_audit_timeline_client_id_date ON public.client_audit_timeline USING btree (client_id, changed_at DESC);


--
-- TOC entry 3692 (class 2606 OID 60901)
-- Name: client_audit_timeline client_audit_timeline_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_audit_timeline
    ADD CONSTRAINT client_audit_timeline_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);


--
-- TOC entry 3693 (class 2606 OID 60896)
-- Name: client_audit_timeline client_audit_timeline_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_audit_timeline
    ADD CONSTRAINT client_audit_timeline_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 3842 (class 3256 OID 60981)
-- Name: client_audit_timeline Anyone can insert client audit timeline; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert client audit timeline" ON public.client_audit_timeline FOR INSERT WITH CHECK (true);


--
-- TOC entry 3843 (class 3256 OID 60980)
-- Name: client_audit_timeline Anyone can view client audit timeline; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view client audit timeline" ON public.client_audit_timeline FOR SELECT USING (true);


--
-- TOC entry 3841 (class 0 OID 60887)
-- Dependencies: 321
-- Name: client_audit_timeline; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_audit_timeline ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:30:29 UTC

--
-- PostgreSQL database dump complete
--

