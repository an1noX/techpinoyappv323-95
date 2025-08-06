--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:56 UTC

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
-- TOC entry 310 (class 1259 OID 53957)
-- Name: printer_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.printer_status (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    printer_id uuid NOT NULL,
    assignment_id uuid,
    status_type text DEFAULT 'operational'::text NOT NULL,
    ink_level_black integer,
    ink_level_cyan integer,
    ink_level_magenta integer,
    ink_level_yellow integer,
    toner_level integer,
    paper_level integer,
    page_count integer DEFAULT 0,
    error_message text,
    last_maintenance_date date,
    next_maintenance_due date,
    reported_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT printer_status_ink_level_black_check CHECK (((ink_level_black >= 0) AND (ink_level_black <= 100))),
    CONSTRAINT printer_status_ink_level_cyan_check CHECK (((ink_level_cyan >= 0) AND (ink_level_cyan <= 100))),
    CONSTRAINT printer_status_ink_level_magenta_check CHECK (((ink_level_magenta >= 0) AND (ink_level_magenta <= 100))),
    CONSTRAINT printer_status_ink_level_yellow_check CHECK (((ink_level_yellow >= 0) AND (ink_level_yellow <= 100))),
    CONSTRAINT printer_status_paper_level_check CHECK (((paper_level >= 0) AND (paper_level <= 100))),
    CONSTRAINT printer_status_toner_level_check CHECK (((toner_level >= 0) AND (toner_level <= 100)))
);


--
-- TOC entry 3857 (class 0 OID 53957)
-- Dependencies: 310
-- Data for Name: printer_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.printer_status (id, printer_id, assignment_id, status_type, ink_level_black, ink_level_cyan, ink_level_magenta, ink_level_yellow, toner_level, paper_level, page_count, error_message, last_maintenance_date, next_maintenance_due, reported_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3699 (class 2606 OID 53974)
-- Name: printer_status printer_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_status
    ADD CONSTRAINT printer_status_pkey PRIMARY KEY (id);


--
-- TOC entry 3703 (class 2620 OID 54082)
-- Name: printer_status printer_status_maintenance_alert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER printer_status_maintenance_alert AFTER UPDATE ON public.printer_status FOR EACH ROW EXECUTE FUNCTION public.check_maintenance_alerts();


--
-- TOC entry 3704 (class 2620 OID 54077)
-- Name: printer_status update_printer_status_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_printer_status_updated_at BEFORE UPDATE ON public.printer_status FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3700 (class 2606 OID 53980)
-- Name: printer_status printer_status_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_status
    ADD CONSTRAINT printer_status_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.printer_assignments(id);


--
-- TOC entry 3701 (class 2606 OID 53975)
-- Name: printer_status printer_status_printer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_status
    ADD CONSTRAINT printer_status_printer_id_fkey FOREIGN KEY (printer_id) REFERENCES public.printers(id) ON DELETE CASCADE;


--
-- TOC entry 3702 (class 2606 OID 53985)
-- Name: printer_status printer_status_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_status
    ADD CONSTRAINT printer_status_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.profiles(id);


--
-- TOC entry 3853 (class 3256 OID 54069)
-- Name: printer_status Admins can manage printer status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage printer status" ON public.printer_status USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- TOC entry 3854 (class 3256 OID 54068)
-- Name: printer_status Users can insert printer status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert printer status" ON public.printer_status FOR INSERT WITH CHECK ((reported_by = auth.uid()));


--
-- TOC entry 3855 (class 3256 OID 54067)
-- Name: printer_status Users can view printer status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view printer status" ON public.printer_status FOR SELECT USING (true);


--
-- TOC entry 3852 (class 0 OID 53957)
-- Dependencies: 310
-- Name: printer_status; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.printer_status ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:33:58 UTC

--
-- PostgreSQL database dump complete
--

