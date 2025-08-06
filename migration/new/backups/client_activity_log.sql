--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:30:24 UTC

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
-- TOC entry 320 (class 1259 OID 60867)
-- Name: client_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    activity_type text NOT NULL,
    description text NOT NULL,
    metadata jsonb,
    performed_by uuid,
    performed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_activity_log_activity_type_check CHECK ((activity_type = ANY (ARRAY['client_created'::text, 'client_updated'::text, 'client_archived'::text, 'client_restored'::text, 'department_added'::text, 'department_removed'::text, 'location_added'::text, 'location_removed'::text, 'printer_assigned'::text, 'printer_transferred'::text, 'printer_unassigned'::text, 'document_uploaded'::text, 'comment_added'::text])))
);


--
-- TOC entry 3846 (class 0 OID 60867)
-- Dependencies: 320
-- Data for Name: client_activity_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_activity_log (id, client_id, activity_type, description, metadata, performed_by, performed_at) FROM stdin;
afe5cff6-f788-4580-b1a8-42da91b6d9bb	c716cb3b-0765-4271-b88f-e1ecff73ec24	client_updated	Client information updated	\N	\N	2025-07-08 13:46:19.085391+00
9e9417c3-caab-4cfb-a0ab-8450ca3fedc4	c716cb3b-0765-4271-b88f-e1ecff73ec24	client_updated	Client information updated	\N	f911e40e-3cc3-45c4-8bba-4e73ba654c2f	2025-07-08 21:56:46.288733+00
f9caa832-d174-4160-a850-ba144c9617ab	c716cb3b-0765-4271-b88f-e1ecff73ec24	client_updated	Client information updated	\N	f911e40e-3cc3-45c4-8bba-4e73ba654c2f	2025-07-08 21:56:46.288733+00
37d1330b-fc01-4b6b-80da-90805c3c774d	c716cb3b-0765-4271-b88f-e1ecff73ec24	client_updated	Client information updated	\N	\N	2025-07-09 22:23:06.622996+00
e40903f5-2138-4b81-8f0d-2d854f8659e1	c716cb3b-0765-4271-b88f-e1ecff73ec24	client_updated	Client information updated	\N	ec0b6f95-dc88-4875-a2b7-6dfa667044e0	2025-07-12 11:57:50.720821+00
\.


--
-- TOC entry 3691 (class 2606 OID 60876)
-- Name: client_activity_log client_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_activity_log
    ADD CONSTRAINT client_activity_log_pkey PRIMARY KEY (id);


--
-- TOC entry 3692 (class 1259 OID 60956)
-- Name: idx_client_activity_log_client_id_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_activity_log_client_id_date ON public.client_activity_log USING btree (client_id, performed_at DESC);


--
-- TOC entry 3693 (class 2606 OID 60877)
-- Name: client_activity_log client_activity_log_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_activity_log
    ADD CONSTRAINT client_activity_log_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 3694 (class 2606 OID 60882)
-- Name: client_activity_log client_activity_log_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_activity_log
    ADD CONSTRAINT client_activity_log_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id);


--
-- TOC entry 3843 (class 3256 OID 60979)
-- Name: client_activity_log Anyone can insert client activity log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert client activity log" ON public.client_activity_log FOR INSERT WITH CHECK (true);


--
-- TOC entry 3844 (class 3256 OID 60978)
-- Name: client_activity_log Anyone can view client activity log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view client activity log" ON public.client_activity_log FOR SELECT USING (true);


--
-- TOC entry 3842 (class 0 OID 60867)
-- Dependencies: 320
-- Name: client_activity_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_activity_log ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:30:27 UTC

--
-- PostgreSQL database dump complete
--

