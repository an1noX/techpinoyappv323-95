--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:31:56 UTC

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
-- TOC entry 329 (class 1259 OID 65573)
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supplier_client_id uuid,
    supplier_name text,
    status text DEFAULT 'pending'::text,
    payment_status text DEFAULT 'unpaid'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    purchase_order_number character varying,
    client_po character varying(50),
    CONSTRAINT purchase_orders_payment_status_check CHECK ((payment_status = ANY (ARRAY['unpaid'::text, 'partial'::text, 'paid'::text]))),
    CONSTRAINT purchase_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'partial'::text, 'completed'::text])))
);


--
-- TOC entry 3854 (class 0 OID 65573)
-- Dependencies: 329
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_orders (id, supplier_client_id, supplier_name, status, payment_status, notes, created_at, updated_at, purchase_order_number, client_po) FROM stdin;
2f67a1de-83cb-4473-bbca-f65cc3441dc2	\N	Aims	completed	unpaid	Imported from transaction records (PO: 25-253)	2025-07-11 21:41:03.230585+00	2025-07-11 21:41:03.230585+00	\N	25-253
976d1ae8-3d89-480d-8f71-b64ba75d9782	\N	AIMS	completed	unpaid	Imported from transaction records (PO: 25-194)	2025-07-11 21:41:14.482024+00	2025-07-11 21:41:14.482024+00	\N	25-194
39f6c212-534a-4d80-b853-f7dfae7fa8a9	\N	AIMS	completed	unpaid	Imported from transaction records (PO: 25-254)	2025-07-11 21:49:24.681141+00	2025-07-11 21:49:24.681141+00	\N	25-254
6db0b0ef-fd49-4371-b62a-df5c384801a0	\N	AIMS	completed	unpaid	Imported from transaction records (PO: 25-193)	2025-07-11 22:27:55.342974+00	2025-07-11 22:27:55.342974+00	\N	25-193
\.


--
-- TOC entry 3698 (class 2606 OID 65586)
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3700 (class 2606 OID 65668)
-- Name: purchase_orders purchase_orders_purchase_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_purchase_order_number_key UNIQUE (purchase_order_number);


--
-- TOC entry 3694 (class 1259 OID 65691)
-- Name: idx_purchase_orders_client_po; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_orders_client_po ON public.purchase_orders USING btree (client_po);


--
-- TOC entry 3695 (class 1259 OID 65657)
-- Name: idx_purchase_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_orders_status ON public.purchase_orders USING btree (status);


--
-- TOC entry 3696 (class 1259 OID 65656)
-- Name: idx_purchase_orders_supplier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders USING btree (supplier_client_id);


--
-- TOC entry 3702 (class 2620 OID 65694)
-- Name: purchase_orders trigger_link_transactions_to_po; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_link_transactions_to_po AFTER INSERT ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.link_transactions_to_purchase_order();


--
-- TOC entry 3703 (class 2620 OID 65661)
-- Name: purchase_orders update_purchase_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3701 (class 2606 OID 65587)
-- Name: purchase_orders purchase_orders_supplier_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_client_id_fkey FOREIGN KEY (supplier_client_id) REFERENCES public.clients(id);


--
-- TOC entry 3852 (class 3256 OID 65662)
-- Name: purchase_orders Enable all operations for purchase_orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all operations for purchase_orders" ON public.purchase_orders USING (true);


--
-- TOC entry 3851 (class 0 OID 65573)
-- Dependencies: 329
-- Name: purchase_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:31:59 UTC

--
-- PostgreSQL database dump complete
--

