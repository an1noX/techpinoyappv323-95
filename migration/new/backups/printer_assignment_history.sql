--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:53 UTC

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
-- TOC entry 319 (class 1259 OID 60827)
-- Name: printer_assignment_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.printer_assignment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    printer_assignment_id uuid NOT NULL,
    action_type text NOT NULL,
    previous_client_id uuid,
    new_client_id uuid,
    previous_department_location_id uuid,
    new_department_location_id uuid,
    previous_status text,
    new_status text,
    previous_condition text,
    new_condition text,
    reason text,
    effective_date date,
    performed_by uuid,
    performed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT printer_assignment_history_action_type_check CHECK ((action_type = ANY (ARRAY['assigned'::text, 'transferred'::text, 'unassigned'::text, 'status_changed'::text, 'condition_changed'::text])))
);


--
-- TOC entry 3850 (class 0 OID 60827)
-- Dependencies: 319
-- Data for Name: printer_assignment_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.printer_assignment_history (id, printer_assignment_id, action_type, previous_client_id, new_client_id, previous_department_location_id, new_department_location_id, previous_status, new_status, previous_condition, new_condition, reason, effective_date, performed_by, performed_at) FROM stdin;
\.


--
-- TOC entry 3692 (class 2606 OID 60836)
-- Name: printer_assignment_history printer_assignment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_assignment_history
    ADD CONSTRAINT printer_assignment_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3690 (class 1259 OID 60959)
-- Name: idx_printer_assignment_history_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_printer_assignment_history_assignment_id ON public.printer_assignment_history USING btree (printer_assignment_id, performed_at DESC);


--
-- TOC entry 3693 (class 2606 OID 60847)
-- Name: printer_assignment_history printer_assignment_history_new_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_assignment_history
    ADD CONSTRAINT printer_assignment_history_new_client_id_fkey FOREIGN KEY (new_client_id) REFERENCES public.clients(id);


--
-- TOC entry 3694 (class 2606 OID 60857)
-- Name: printer_assignment_history printer_assignment_history_new_department_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_assignment_history
    ADD CONSTRAINT printer_assignment_history_new_department_location_id_fkey FOREIGN KEY (new_department_location_id) REFERENCES public.departments_location(id);


--
-- TOC entry 3695 (class 2606 OID 60862)
-- Name: printer_assignment_history printer_assignment_history_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_assignment_history
    ADD CONSTRAINT printer_assignment_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id);


--
-- TOC entry 3696 (class 2606 OID 60842)
-- Name: printer_assignment_history printer_assignment_history_previous_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_assignment_history
    ADD CONSTRAINT printer_assignment_history_previous_client_id_fkey FOREIGN KEY (previous_client_id) REFERENCES public.clients(id);


--
-- TOC entry 3697 (class 2606 OID 60852)
-- Name: printer_assignment_history printer_assignment_history_previous_department_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_assignment_history
    ADD CONSTRAINT printer_assignment_history_previous_department_location_id_fkey FOREIGN KEY (previous_department_location_id) REFERENCES public.departments_location(id);


--
-- TOC entry 3698 (class 2606 OID 60837)
-- Name: printer_assignment_history printer_assignment_history_printer_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_assignment_history
    ADD CONSTRAINT printer_assignment_history_printer_assignment_id_fkey FOREIGN KEY (printer_assignment_id) REFERENCES public.printer_assignments(id) ON DELETE CASCADE;


--
-- TOC entry 3847 (class 3256 OID 60977)
-- Name: printer_assignment_history Anyone can insert printer assignment history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert printer assignment history" ON public.printer_assignment_history FOR INSERT WITH CHECK (true);


--
-- TOC entry 3848 (class 3256 OID 60976)
-- Name: printer_assignment_history Anyone can view printer assignment history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view printer assignment history" ON public.printer_assignment_history FOR SELECT USING (true);


--
-- TOC entry 3846 (class 0 OID 60827)
-- Dependencies: 319
-- Name: printer_assignment_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.printer_assignment_history ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:33:55 UTC

--
-- PostgreSQL database dump complete
--

