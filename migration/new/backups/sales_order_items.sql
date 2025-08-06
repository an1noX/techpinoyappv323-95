--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:17 UTC

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
-- TOC entry 326 (class 1259 OID 61009)
-- Name: sales_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sales_order_id uuid NOT NULL,
    product_id uuid,
    product_name text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) DEFAULT 0 NOT NULL,
    total_price numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3851 (class 0 OID 61009)
-- Dependencies: 326
-- Data for Name: sales_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_order_items (id, sales_order_id, product_id, product_name, quantity, unit_price, total_price, created_at) FROM stdin;
\.


--
-- TOC entry 3693 (class 2606 OID 61020)
-- Name: sales_order_items sales_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_order_items
    ADD CONSTRAINT sales_order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3696 (class 2620 OID 61043)
-- Name: sales_order_items trigger_update_item_total; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_item_total BEFORE INSERT OR UPDATE ON public.sales_order_items FOR EACH ROW EXECUTE FUNCTION public.update_item_total();


--
-- TOC entry 3697 (class 2620 OID 61045)
-- Name: sales_order_items trigger_update_order_total; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_order_total AFTER INSERT OR DELETE OR UPDATE ON public.sales_order_items FOR EACH ROW EXECUTE FUNCTION public.update_order_total();


--
-- TOC entry 3694 (class 2606 OID 61026)
-- Name: sales_order_items sales_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_order_items
    ADD CONSTRAINT sales_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 3695 (class 2606 OID 61021)
-- Name: sales_order_items sales_order_items_sales_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_order_items
    ADD CONSTRAINT sales_order_items_sales_order_id_fkey FOREIGN KEY (sales_order_id) REFERENCES public.sales_orders(id) ON DELETE CASCADE;


--
-- TOC entry 3846 (class 3256 OID 61038)
-- Name: sales_order_items Enable delete access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for all users" ON public.sales_order_items FOR DELETE USING (true);


--
-- TOC entry 3847 (class 3256 OID 61036)
-- Name: sales_order_items Enable insert access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for all users" ON public.sales_order_items FOR INSERT WITH CHECK (true);


--
-- TOC entry 3848 (class 3256 OID 61035)
-- Name: sales_order_items Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.sales_order_items FOR SELECT USING (true);


--
-- TOC entry 3849 (class 3256 OID 61037)
-- Name: sales_order_items Enable update access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for all users" ON public.sales_order_items FOR UPDATE USING (true);


--
-- TOC entry 3845 (class 0 OID 61009)
-- Dependencies: 326
-- Name: sales_order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:33:20 UTC

--
-- PostgreSQL database dump complete
--

