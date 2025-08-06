--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:32:04 UTC

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
-- TOC entry 308 (class 1259 OID 52754)
-- Name: service_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    delivery_no text NOT NULL,
    report_date date NOT NULL,
    status text DEFAULT 'draft'::text,
    client_name text NOT NULL,
    client_address text,
    department text,
    nature_of_problem text NOT NULL,
    reported_issue text NOT NULL,
    equipment_make text,
    equipment_model text,
    equipment_serial_no text,
    equipment_location text,
    device_type text,
    technician_name text,
    diagnosis text,
    recommendation text,
    actions_taken text,
    parts jsonb,
    service_fee numeric DEFAULT 0,
    parts_consumables numeric DEFAULT 0,
    total_charges numeric GENERATED ALWAYS AS ((COALESCE(service_fee, (0)::numeric) + COALESCE(parts_consumables, (0)::numeric))) STORED,
    reported_by text,
    reported_date_time timestamp with time zone,
    delivery_receipt_url text,
    completion_notes text,
    completed_at timestamp with time zone,
    completed_by uuid,
    pdf_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid,
    contact_submission_id uuid,
    CONSTRAINT service_reports_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'completed'::text, 'invoiced'::text])))
);


--
-- TOC entry 3857 (class 0 OID 52754)
-- Dependencies: 308
-- Data for Name: service_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_reports (id, delivery_no, report_date, status, client_name, client_address, department, nature_of_problem, reported_issue, equipment_make, equipment_model, equipment_serial_no, equipment_location, device_type, technician_name, diagnosis, recommendation, actions_taken, parts, service_fee, parts_consumables, reported_by, reported_date_time, delivery_receipt_url, completion_notes, completed_at, completed_by, pdf_url, created_at, updated_at, created_by, updated_by, contact_submission_id) FROM stdin;
\.


--
-- TOC entry 3696 (class 2606 OID 52770)
-- Name: service_reports service_reports_delivery_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_reports
    ADD CONSTRAINT service_reports_delivery_no_key UNIQUE (delivery_no);


--
-- TOC entry 3698 (class 2606 OID 52768)
-- Name: service_reports service_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_reports
    ADD CONSTRAINT service_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 3703 (class 2620 OID 52797)
-- Name: service_reports handle_service_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_service_reports_updated_at BEFORE UPDATE ON public.service_reports FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3704 (class 2620 OID 52796)
-- Name: service_reports validate_completion_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_completion_trigger BEFORE UPDATE ON public.service_reports FOR EACH ROW EXECUTE FUNCTION public.validate_service_report_completion();


--
-- TOC entry 3699 (class 2606 OID 52771)
-- Name: service_reports service_reports_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_reports
    ADD CONSTRAINT service_reports_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.profiles(id);


--
-- TOC entry 3700 (class 2606 OID 52786)
-- Name: service_reports service_reports_contact_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_reports
    ADD CONSTRAINT service_reports_contact_submission_id_fkey FOREIGN KEY (contact_submission_id) REFERENCES public.contact_submissions(id);


--
-- TOC entry 3701 (class 2606 OID 52776)
-- Name: service_reports service_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_reports
    ADD CONSTRAINT service_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- TOC entry 3702 (class 2606 OID 52781)
-- Name: service_reports service_reports_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_reports
    ADD CONSTRAINT service_reports_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id);


--
-- TOC entry 3853 (class 3256 OID 52792)
-- Name: service_reports Authenticated users can insert service reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert service reports" ON public.service_reports FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- TOC entry 3854 (class 3256 OID 52793)
-- Name: service_reports Authenticated users can update service reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update service reports" ON public.service_reports FOR UPDATE TO authenticated USING (true) WITH CHECK ((auth.uid() = updated_by));


--
-- TOC entry 3855 (class 3256 OID 52791)
-- Name: service_reports Authenticated users can view service reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view service reports" ON public.service_reports FOR SELECT TO authenticated USING (true);


--
-- TOC entry 3852 (class 0 OID 52754)
-- Dependencies: 308
-- Name: service_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_reports ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:32:07 UTC

--
-- PostgreSQL database dump complete
--

