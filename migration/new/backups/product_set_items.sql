--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:31:48 UTC

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
-- TOC entry 292 (class 1259 OID 28890)
-- Name: product_set_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_set_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_set_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3846 (class 0 OID 28890)
-- Dependencies: 292
-- Data for Name: product_set_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_set_items (id, product_set_id, product_id, quantity, created_at) FROM stdin;
\.


--
-- TOC entry 3691 (class 2606 OID 28897)
-- Name: product_set_items product_set_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_set_items
    ADD CONSTRAINT product_set_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3693 (class 2606 OID 28899)
-- Name: product_set_items product_set_items_product_set_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_set_items
    ADD CONSTRAINT product_set_items_product_set_id_product_id_key UNIQUE (product_set_id, product_id);


--
-- TOC entry 3694 (class 2606 OID 28905)
-- Name: product_set_items product_set_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_set_items
    ADD CONSTRAINT product_set_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3695 (class 2606 OID 28900)
-- Name: product_set_items product_set_items_product_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_set_items
    ADD CONSTRAINT product_set_items_product_set_id_fkey FOREIGN KEY (product_set_id) REFERENCES public.product_sets(id) ON DELETE CASCADE;


--
-- TOC entry 3844 (class 3256 OID 28911)
-- Name: product_set_items Allow all operations on product_set_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on product_set_items" ON public.product_set_items USING (true);


--
-- TOC entry 3843 (class 0 OID 28890)
-- Dependencies: 292
-- Name: product_set_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_set_items ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:31:50 UTC

--
-- PostgreSQL database dump complete
--

