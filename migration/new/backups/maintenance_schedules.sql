--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:32:45 UTC

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
-- TOC entry 281 (class 1259 OID 18585)
-- Name: maintenance_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    printer_id uuid NOT NULL,
    maintenance_type text NOT NULL,
    scheduled_date date NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    completed_date date,
    performed_by text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    issue_reported_date date,
    CONSTRAINT maintenance_schedules_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'overdue'::text])))
);


--
-- TOC entry 3847 (class 0 OID 18585)
-- Dependencies: 281
-- Data for Name: maintenance_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance_schedules (id, printer_id, maintenance_type, scheduled_date, description, status, completed_date, performed_by, notes, created_at, updated_at, issue_reported_date) FROM stdin;
e00070dd-90b4-4aea-9858-0c2419dff077	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	Quick Maintenance	2025-06-10	Paper feed rollers cleaned, \nRemaining Issue: "Fuser Line or Pressure Line:\n"	completed	2025-06-10	System User	\N	2025-06-10 05:27:51.347818+00	2025-06-10 05:27:51.347818+00	\N
c0ad3722-07b1-4769-ae33-4123e7155ed5	cf8956a6-1c2e-48d2-aabb-62dcd40a3a8c	Quick Maintenance	2025-06-10	For Repair	completed	2025-06-10	System User	\N	2025-06-10 05:44:09.053081+00	2025-06-10 05:44:09.053081+00	\N
\.


--
-- TOC entry 3696 (class 2606 OID 18596)
-- Name: maintenance_schedules maintenance_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_schedules
    ADD CONSTRAINT maintenance_schedules_pkey PRIMARY KEY (id);


--
-- TOC entry 3692 (class 1259 OID 18642)
-- Name: idx_maintenance_schedules_printer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_schedules_printer_id ON public.maintenance_schedules USING btree (printer_id);


--
-- TOC entry 3693 (class 1259 OID 18644)
-- Name: idx_maintenance_schedules_scheduled_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_schedules_scheduled_date ON public.maintenance_schedules USING btree (scheduled_date);


--
-- TOC entry 3694 (class 1259 OID 18643)
-- Name: idx_maintenance_schedules_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_schedules_status ON public.maintenance_schedules USING btree (status);


--
-- TOC entry 3698 (class 2620 OID 18648)
-- Name: maintenance_schedules handle_updated_at_maintenance_schedules; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at_maintenance_schedules BEFORE UPDATE ON public.maintenance_schedules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3697 (class 2606 OID 18597)
-- Name: maintenance_schedules maintenance_schedules_printer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_schedules
    ADD CONSTRAINT maintenance_schedules_printer_id_fkey FOREIGN KEY (printer_id) REFERENCES public.printers(id) ON DELETE CASCADE;


-- Completed on 2025-07-14 11:32:47 UTC

--
-- PostgreSQL database dump complete
--

