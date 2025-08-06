--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:27:32 UTC

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
-- TOC entry 313 (class 1259 OID 54053)
-- Name: asset_barcodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_barcodes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    barcode_value text NOT NULL,
    asset_type text NOT NULL,
    asset_id uuid NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_scanned_at timestamp with time zone,
    scan_count integer DEFAULT 0
);


--
-- TOC entry 3845 (class 0 OID 54053)
-- Dependencies: 313
-- Data for Name: asset_barcodes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asset_barcodes (id, barcode_value, asset_type, asset_id, generated_at, last_scanned_at, scan_count) FROM stdin;
\.


--
-- TOC entry 3691 (class 2606 OID 54064)
-- Name: asset_barcodes asset_barcodes_barcode_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_barcodes
    ADD CONSTRAINT asset_barcodes_barcode_value_key UNIQUE (barcode_value);


--
-- TOC entry 3693 (class 2606 OID 54062)
-- Name: asset_barcodes asset_barcodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_barcodes
    ADD CONSTRAINT asset_barcodes_pkey PRIMARY KEY (id);


--
-- TOC entry 3842 (class 3256 OID 54075)
-- Name: asset_barcodes Admins can manage barcodes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage barcodes" ON public.asset_barcodes USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- TOC entry 3843 (class 3256 OID 54074)
-- Name: asset_barcodes Users can view barcodes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view barcodes" ON public.asset_barcodes FOR SELECT USING (true);


--
-- TOC entry 3841 (class 0 OID 54053)
-- Dependencies: 313
-- Name: asset_barcodes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.asset_barcodes ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:27:35 UTC

--
-- PostgreSQL database dump complete
--

