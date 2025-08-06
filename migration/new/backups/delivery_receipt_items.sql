--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:32:34 UTC

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
-- TOC entry 289 (class 1259 OID 26537)
-- Name: delivery_receipt_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_receipt_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    delivery_receipt_id uuid,
    product_id uuid,
    quantity integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3842 (class 0 OID 26537)
-- Dependencies: 289
-- Data for Name: delivery_receipt_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_receipt_items (id, delivery_receipt_id, product_id, quantity, created_at) FROM stdin;
\.


--
-- TOC entry 3690 (class 2606 OID 26543)
-- Name: delivery_receipt_items delivery_receipt_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_receipt_items
    ADD CONSTRAINT delivery_receipt_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3691 (class 1259 OID 26563)
-- Name: idx_delivery_receipt_items_dr_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_delivery_receipt_items_dr_id ON public.delivery_receipt_items USING btree (delivery_receipt_id);


--
-- TOC entry 3692 (class 2606 OID 26544)
-- Name: delivery_receipt_items delivery_receipt_items_delivery_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_receipt_items
    ADD CONSTRAINT delivery_receipt_items_delivery_receipt_id_fkey FOREIGN KEY (delivery_receipt_id) REFERENCES public.delivery_receipts(id) ON DELETE CASCADE;


--
-- TOC entry 3693 (class 2606 OID 26549)
-- Name: delivery_receipt_items delivery_receipt_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_receipt_items
    ADD CONSTRAINT delivery_receipt_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


-- Completed on 2025-07-14 11:32:37 UTC

--
-- PostgreSQL database dump complete
--

