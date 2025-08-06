--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:58 UTC

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
-- TOC entry 311 (class 1259 OID 53990)
-- Name: usage_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    printer_id uuid NOT NULL,
    assignment_id uuid,
    product_id uuid,
    pages_printed integer DEFAULT 0,
    supplies_consumed jsonb,
    cost_center text,
    logged_date date DEFAULT CURRENT_DATE NOT NULL,
    logged_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3848 (class 0 OID 53990)
-- Dependencies: 311
-- Data for Name: usage_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usage_logs (id, printer_id, assignment_id, product_id, pages_printed, supplies_consumed, cost_center, logged_date, logged_by, created_at) FROM stdin;
\.


--
-- TOC entry 3692 (class 2606 OID 54000)
-- Name: usage_logs usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_logs
    ADD CONSTRAINT usage_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3693 (class 2606 OID 54006)
-- Name: usage_logs usage_logs_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_logs
    ADD CONSTRAINT usage_logs_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.printer_assignments(id);


--
-- TOC entry 3694 (class 2606 OID 54016)
-- Name: usage_logs usage_logs_logged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_logs
    ADD CONSTRAINT usage_logs_logged_by_fkey FOREIGN KEY (logged_by) REFERENCES public.profiles(id);


--
-- TOC entry 3695 (class 2606 OID 54001)
-- Name: usage_logs usage_logs_printer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_logs
    ADD CONSTRAINT usage_logs_printer_id_fkey FOREIGN KEY (printer_id) REFERENCES public.printers(id);


--
-- TOC entry 3696 (class 2606 OID 54011)
-- Name: usage_logs usage_logs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_logs
    ADD CONSTRAINT usage_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 3845 (class 3256 OID 54071)
-- Name: usage_logs Users can insert usage logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert usage logs" ON public.usage_logs FOR INSERT WITH CHECK ((logged_by = auth.uid()));


--
-- TOC entry 3846 (class 3256 OID 54070)
-- Name: usage_logs Users can view usage logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view usage logs" ON public.usage_logs FOR SELECT USING (true);


--
-- TOC entry 3844 (class 0 OID 53990)
-- Dependencies: 311
-- Name: usage_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:34:01 UTC

--
-- PostgreSQL database dump complete
--

