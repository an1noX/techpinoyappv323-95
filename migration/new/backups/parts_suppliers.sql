--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:31:15 UTC

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
-- TOC entry 304 (class 1259 OID 38255)
-- Name: parts_suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts_suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    part_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    current_price numeric DEFAULT 0 NOT NULL,
    supplier_sku text,
    lead_time_days integer,
    minimum_order_quantity integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3852 (class 0 OID 38255)
-- Dependencies: 304
-- Data for Name: parts_suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parts_suppliers (id, part_id, supplier_id, current_price, supplier_sku, lead_time_days, minimum_order_quantity, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3693 (class 2606 OID 38268)
-- Name: parts_suppliers parts_suppliers_part_id_supplier_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_suppliers
    ADD CONSTRAINT parts_suppliers_part_id_supplier_id_key UNIQUE (part_id, supplier_id);


--
-- TOC entry 3695 (class 2606 OID 38266)
-- Name: parts_suppliers parts_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_suppliers
    ADD CONSTRAINT parts_suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 3698 (class 2620 OID 38292)
-- Name: parts_suppliers update_parts_suppliers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_parts_suppliers_updated_at BEFORE UPDATE ON public.parts_suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3696 (class 2606 OID 38269)
-- Name: parts_suppliers parts_suppliers_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_suppliers
    ADD CONSTRAINT parts_suppliers_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE CASCADE;


--
-- TOC entry 3697 (class 2606 OID 38274)
-- Name: parts_suppliers parts_suppliers_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_suppliers
    ADD CONSTRAINT parts_suppliers_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- TOC entry 3847 (class 3256 OID 38290)
-- Name: parts_suppliers Allow delete access to parts_suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete access to parts_suppliers" ON public.parts_suppliers FOR DELETE USING (true);


--
-- TOC entry 3848 (class 3256 OID 38288)
-- Name: parts_suppliers Allow insert access to parts_suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert access to parts_suppliers" ON public.parts_suppliers FOR INSERT WITH CHECK (true);


--
-- TOC entry 3849 (class 3256 OID 38287)
-- Name: parts_suppliers Allow read access to parts_suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to parts_suppliers" ON public.parts_suppliers FOR SELECT USING (true);


--
-- TOC entry 3850 (class 3256 OID 38289)
-- Name: parts_suppliers Allow update access to parts_suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update access to parts_suppliers" ON public.parts_suppliers FOR UPDATE USING (true);


--
-- TOC entry 3846 (class 0 OID 38255)
-- Dependencies: 304
-- Name: parts_suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.parts_suppliers ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:31:17 UTC

--
-- PostgreSQL database dump complete
--

