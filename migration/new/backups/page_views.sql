--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:28:43 UTC

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
-- TOC entry 287 (class 1259 OID 18722)
-- Name: page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_path text NOT NULL,
    view_count bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organic_views bigint DEFAULT 0 NOT NULL,
    bot_views bigint DEFAULT 0 NOT NULL,
    ip_address text,
    last_tracked_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 3847 (class 0 OID 18722)
-- Dependencies: 287
-- Data for Name: page_views; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.page_views (id, page_path, view_count, created_at, updated_at, organic_views, bot_views, ip_address, last_tracked_at) FROM stdin;
c5e057a5-5f94-4375-8818-045ff8dfd66d	/home	10779	2025-05-31 14:06:20.327418+00	2025-06-30 19:22:32.819535+00	10779	0	136.158.24.226	2025-06-30 19:22:32.819535+00
75336c6f-3be0-4d4b-9f8b-da3565d7747c	/	49545	2025-05-31 14:06:05.542854+00	2025-07-07 22:00:41.786695+00	49471	74	136.158.24.226	2025-07-07 22:00:41.786695+00
\.


--
-- TOC entry 3697 (class 2606 OID 18732)
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- TOC entry 3694 (class 1259 OID 28848)
-- Name: idx_page_views_ip_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_ip_path ON public.page_views USING btree (ip_address, page_path);


--
-- TOC entry 3695 (class 1259 OID 18733)
-- Name: idx_page_views_page_path; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_page_views_page_path ON public.page_views USING btree (page_path);


--
-- TOC entry 3698 (class 2620 OID 18737)
-- Name: page_views trigger_page_views_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_page_views_updated_at BEFORE UPDATE ON public.page_views FOR EACH ROW EXECUTE FUNCTION public.handle_page_views_updated_at();


-- Completed on 2025-07-14 11:28:46 UTC

--
-- PostgreSQL database dump complete
--

