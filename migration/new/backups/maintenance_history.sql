--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:50 UTC

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
-- TOC entry 301 (class 1259 OID 38189)
-- Name: maintenance_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    printer_id uuid NOT NULL,
    assignment_id uuid,
    maintenance_type text NOT NULL,
    action_description text NOT NULL,
    parts_replaced text[],
    notes text,
    status_before text,
    status_after text,
    performed_by text,
    performed_at timestamp with time zone DEFAULT now() NOT NULL,
    issue_reported_date date,
    completed_date date,
    cost numeric(10,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3851 (class 0 OID 38189)
-- Dependencies: 301
-- Data for Name: maintenance_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance_history (id, printer_id, assignment_id, maintenance_type, action_description, parts_replaced, notes, status_before, status_after, performed_by, performed_at, issue_reported_date, completed_date, cost, created_at, updated_at) FROM stdin;
6107f6e2-bedf-48f9-ab9f-e14bd4413aac	cf8956a6-1c2e-48d2-aabb-62dcd40a3a8c	\N	Repaired	Repaired. Notes: Reported Issue(s): Paper Jam, Dirty Prints	\N	Reported Issue(s): Paper Jam, Dirty Prints	active	active	System User	2025-06-18 03:51:07.508+00	\N	\N	\N	2025-06-18 03:51:14.695234+00	2025-06-19 10:00:36.574807+00
45765800-333b-495d-a50d-57e2f5712eca	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	\N	Replaced	Replaced - Parts: Drumkit, Fuser Assembly, Toner	{Drumkit,"Fuser Assembly",Toner}	\N	active	active	System User	2025-06-17 14:45:21.794+00	\N	\N	\N	2025-06-17 14:45:27.982821+00	2025-06-19 10:01:10.896835+00
\.


--
-- TOC entry 3695 (class 2606 OID 38199)
-- Name: maintenance_history maintenance_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_history
    ADD CONSTRAINT maintenance_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3691 (class 1259 OID 38211)
-- Name: idx_maintenance_history_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_history_assignment_id ON public.maintenance_history USING btree (assignment_id);


--
-- TOC entry 3692 (class 1259 OID 38212)
-- Name: idx_maintenance_history_performed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_history_performed_at ON public.maintenance_history USING btree (performed_at);


--
-- TOC entry 3693 (class 1259 OID 38210)
-- Name: idx_maintenance_history_printer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_history_printer_id ON public.maintenance_history USING btree (printer_id);


--
-- TOC entry 3698 (class 2620 OID 38216)
-- Name: maintenance_history update_maintenance_history_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_maintenance_history_updated_at BEFORE UPDATE ON public.maintenance_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3696 (class 2606 OID 38205)
-- Name: maintenance_history maintenance_history_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_history
    ADD CONSTRAINT maintenance_history_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.printer_assignments(id) ON DELETE SET NULL;


--
-- TOC entry 3697 (class 2606 OID 38200)
-- Name: maintenance_history maintenance_history_printer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_history
    ADD CONSTRAINT maintenance_history_printer_id_fkey FOREIGN KEY (printer_id) REFERENCES public.printers(id) ON DELETE CASCADE;


--
-- TOC entry 3847 (class 3256 OID 38214)
-- Name: maintenance_history Allow insert access to maintenance history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert access to maintenance history" ON public.maintenance_history FOR INSERT WITH CHECK (true);


--
-- TOC entry 3848 (class 3256 OID 38213)
-- Name: maintenance_history Allow read access to maintenance history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to maintenance history" ON public.maintenance_history FOR SELECT USING (true);


--
-- TOC entry 3849 (class 3256 OID 38215)
-- Name: maintenance_history Allow update access to maintenance history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update access to maintenance history" ON public.maintenance_history FOR UPDATE USING (true);


--
-- TOC entry 3846 (class 0 OID 38189)
-- Dependencies: 301
-- Name: maintenance_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:33:53 UTC

--
-- PostgreSQL database dump complete
--

