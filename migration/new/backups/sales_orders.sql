--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:32:01 UTC

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
-- TOC entry 325 (class 1259 OID 60988)
-- Name: sales_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    client_id uuid,
    customer_name text NOT NULL,
    order_type text DEFAULT 'purchase_order'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    order_date date DEFAULT CURRENT_DATE NOT NULL,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3853 (class 0 OID 60988)
-- Dependencies: 325
-- Data for Name: sales_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_orders (id, order_number, client_id, customer_name, order_type, status, order_date, total_amount, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3695 (class 2606 OID 61003)
-- Name: sales_orders sales_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_order_number_key UNIQUE (order_number);


--
-- TOC entry 3697 (class 2606 OID 61001)
-- Name: sales_orders sales_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3699 (class 2620 OID 61041)
-- Name: sales_orders trigger_set_order_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_order_number BEFORE INSERT ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.set_order_number();


--
-- TOC entry 3698 (class 2606 OID 61004)
-- Name: sales_orders sales_orders_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- TOC entry 3848 (class 3256 OID 61034)
-- Name: sales_orders Enable delete access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for all users" ON public.sales_orders FOR DELETE USING (true);


--
-- TOC entry 3849 (class 3256 OID 61032)
-- Name: sales_orders Enable insert access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for all users" ON public.sales_orders FOR INSERT WITH CHECK (true);


--
-- TOC entry 3850 (class 3256 OID 61031)
-- Name: sales_orders Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.sales_orders FOR SELECT USING (true);


--
-- TOC entry 3851 (class 3256 OID 61033)
-- Name: sales_orders Enable update access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for all users" ON public.sales_orders FOR UPDATE USING (true);


--
-- TOC entry 3847 (class 0 OID 60988)
-- Dependencies: 325
-- Name: sales_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:32:04 UTC

--
-- PostgreSQL database dump complete
--

