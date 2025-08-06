--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:30:54 UTC

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
-- TOC entry 288 (class 1259 OID 26519)
-- Name: delivery_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dr_number text NOT NULL,
    client_id uuid,
    date date NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3850 (class 0 OID 26519)
-- Dependencies: 288
-- Data for Name: delivery_receipts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_receipts (id, dr_number, client_id, date, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3692 (class 2606 OID 26531)
-- Name: delivery_receipts delivery_receipts_dr_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_receipts
    ADD CONSTRAINT delivery_receipts_dr_number_key UNIQUE (dr_number);


--
-- TOC entry 3694 (class 2606 OID 26529)
-- Name: delivery_receipts delivery_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_receipts
    ADD CONSTRAINT delivery_receipts_pkey PRIMARY KEY (id);


--
-- TOC entry 3699 (class 2606 OID 26567)
-- Name: delivery_receipts unique_dr_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_receipts
    ADD CONSTRAINT unique_dr_number UNIQUE (dr_number);


--
-- TOC entry 3695 (class 1259 OID 26560)
-- Name: idx_delivery_receipts_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_delivery_receipts_client_id ON public.delivery_receipts USING btree (client_id);


--
-- TOC entry 3696 (class 1259 OID 26561)
-- Name: idx_delivery_receipts_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_delivery_receipts_date ON public.delivery_receipts USING btree (date);


--
-- TOC entry 3697 (class 1259 OID 26559)
-- Name: idx_delivery_receipts_dr_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_delivery_receipts_dr_number ON public.delivery_receipts USING btree (dr_number);


--
-- TOC entry 3701 (class 2620 OID 26555)
-- Name: delivery_receipts handle_updated_at_delivery_receipts; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at_delivery_receipts BEFORE UPDATE ON public.delivery_receipts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3700 (class 2606 OID 26532)
-- Name: delivery_receipts delivery_receipts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_receipts
    ADD CONSTRAINT delivery_receipts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


-- Completed on 2025-07-14 11:30:57 UTC

--
-- PostgreSQL database dump complete
--

