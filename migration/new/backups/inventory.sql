--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:31 UTC

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
-- TOC entry 309 (class 1259 OID 53930)
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    part_id uuid,
    location_id uuid,
    current_stock integer DEFAULT 0 NOT NULL,
    min_stock_level integer DEFAULT 0,
    max_stock_level integer DEFAULT 100,
    last_restocked_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inventory_product_or_part CHECK ((((product_id IS NOT NULL) AND (part_id IS NULL)) OR ((product_id IS NULL) AND (part_id IS NOT NULL))))
);


--
-- TOC entry 3852 (class 0 OID 53930)
-- Dependencies: 309
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory (id, product_id, part_id, location_id, current_stock, min_stock_level, max_stock_level, last_restocked_date, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3695 (class 2606 OID 53941)
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- TOC entry 3699 (class 2620 OID 54080)
-- Name: inventory inventory_low_stock_alert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER inventory_low_stock_alert AFTER UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.check_low_stock_alerts();


--
-- TOC entry 3700 (class 2620 OID 54076)
-- Name: inventory update_inventory_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3696 (class 2606 OID 53952)
-- Name: inventory inventory_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.departments_location(id);


--
-- TOC entry 3697 (class 2606 OID 53947)
-- Name: inventory inventory_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id);


--
-- TOC entry 3698 (class 2606 OID 53942)
-- Name: inventory inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 3849 (class 3256 OID 54066)
-- Name: inventory Admins can manage inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage inventory" ON public.inventory USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- TOC entry 3850 (class 3256 OID 54065)
-- Name: inventory Users can view inventory data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view inventory data" ON public.inventory FOR SELECT USING (true);


--
-- TOC entry 3848 (class 0 OID 53930)
-- Dependencies: 309
-- Name: inventory; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:33:34 UTC

--
-- PostgreSQL database dump complete
--

