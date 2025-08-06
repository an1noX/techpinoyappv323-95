--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:29:31 UTC

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
-- TOC entry 291 (class 1259 OID 28878)
-- Name: product_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_sets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    sku text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3845 (class 0 OID 28878)
-- Dependencies: 291
-- Data for Name: product_sets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_sets (id, name, description, sku, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3691 (class 2606 OID 28887)
-- Name: product_sets product_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_sets
    ADD CONSTRAINT product_sets_pkey PRIMARY KEY (id);


--
-- TOC entry 3693 (class 2606 OID 28889)
-- Name: product_sets product_sets_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_sets
    ADD CONSTRAINT product_sets_sku_key UNIQUE (sku);


--
-- TOC entry 3694 (class 2620 OID 28912)
-- Name: product_sets handle_updated_at_product_sets; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at_product_sets BEFORE UPDATE ON public.product_sets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3843 (class 3256 OID 28910)
-- Name: product_sets Allow all operations on product_sets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on product_sets" ON public.product_sets USING (true);


--
-- TOC entry 3842 (class 0 OID 28878)
-- Dependencies: 291
-- Name: product_sets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_sets ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:29:34 UTC

--
-- PostgreSQL database dump complete
--

