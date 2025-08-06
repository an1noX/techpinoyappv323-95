--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:30:43 UTC

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
-- TOC entry 318 (class 1259 OID 60801)
-- Name: client_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    previous_status text,
    new_status text NOT NULL,
    reason text,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3844 (class 0 OID 60801)
-- Dependencies: 318
-- Data for Name: client_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_status_history (id, client_id, previous_status, new_status, reason, changed_by, changed_at) FROM stdin;
\.


--
-- TOC entry 3690 (class 2606 OID 60809)
-- Name: client_status_history client_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_status_history
    ADD CONSTRAINT client_status_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3691 (class 2606 OID 60815)
-- Name: client_status_history client_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_status_history
    ADD CONSTRAINT client_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);


--
-- TOC entry 3692 (class 2606 OID 60810)
-- Name: client_status_history client_status_history_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_status_history
    ADD CONSTRAINT client_status_history_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 3841 (class 3256 OID 60975)
-- Name: client_status_history Anyone can insert client status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert client status history" ON public.client_status_history FOR INSERT WITH CHECK (true);


--
-- TOC entry 3842 (class 3256 OID 60974)
-- Name: client_status_history Anyone can view client status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view client status history" ON public.client_status_history FOR SELECT USING (true);


--
-- TOC entry 3840 (class 0 OID 60801)
-- Dependencies: 318
-- Name: client_status_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_status_history ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:30:46 UTC

--
-- PostgreSQL database dump complete
--

