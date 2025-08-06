--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:28:32 UTC

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
-- TOC entry 284 (class 1259 OID 18670)
-- Name: homepage_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.homepage_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_name text NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    section_config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3848 (class 0 OID 18670)
-- Dependencies: 284
-- Data for Name: homepage_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.homepage_settings (id, section_name, is_visible, display_order, section_config, created_at, updated_at) FROM stdin;
a6a4472f-3cb4-4a99-967f-7a1bfb351f0c	printer_solutions	t	4	{"title": "Printer Solutions", "show_rental_info": true}	2025-05-31 13:26:41.792058+00	2025-05-31 13:28:50.244398+00
f2b5d38e-248c-44ce-a3e6-f78dc906f1fb	hero_section	t	1	{"title": "Shop Printer Ink, Toner & Drum Cartridges for Less", "subtitle": "Buy high-quality printer ink cartridges, toner cartridges & drum units at discounted prices."}	2025-05-31 13:26:41.792058+00	2025-05-31 13:28:52.960989+00
e6bb3006-bee1-49ad-af89-7fec48f146be	new_releases	f	3	{"title": "Newly Released Printer Ink, Toner & Drum Cartridges", "show_count": 4}	2025-05-31 13:26:41.792058+00	2025-05-31 13:33:55.350862+00
398d5c92-0874-459b-8975-aef22888a886	about_section	f	5	{"title": "About TechPinoy", "show_full_content": true}	2025-05-31 13:26:41.792058+00	2025-05-31 13:33:59.579608+00
02a20bef-0ba4-4167-994e-d91e299b656b	shop_by_brand	f	6	{"title": "Shop by Brand", "featured_brands": ["HP", "Canon", "Brother", "Xerox", "Samsung"]}	2025-05-31 13:26:41.792058+00	2025-05-31 13:34:00.495649+00
6e6f6f6e-7b20-4013-9969-25ccea97b123	faq_section	f	7	{"title": "Frequently Asked Questions", "max_items": 5}	2025-05-31 13:26:41.792058+00	2025-05-31 13:34:01.612771+00
364ee0c3-e0ac-43be-bce8-5f4b10431f02	additional_info	f	8	{"show_shipping_info": true, "show_warranty_info": true}	2025-05-31 13:26:41.792058+00	2025-05-31 13:34:02.185986+00
7000884b-6818-4ae9-88ec-cdd32ec401a8	newsletter	f	9	{"title": "Sign Up For A", "coupon_text": "15% OFF COUPON"}	2025-05-31 13:26:41.792058+00	2025-05-31 13:34:03.424288+00
541eaeb2-7063-4098-b814-c1a091e56fdd	popular_products	f	2	{"title": "Popular Products", "show_count": 4}	2025-05-31 13:26:41.792058+00	2025-05-31 13:51:24.032034+00
\.


--
-- TOC entry 3694 (class 2606 OID 18682)
-- Name: homepage_settings homepage_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homepage_settings
    ADD CONSTRAINT homepage_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3696 (class 2606 OID 18684)
-- Name: homepage_settings homepage_settings_section_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homepage_settings
    ADD CONSTRAINT homepage_settings_section_name_key UNIQUE (section_name);


--
-- TOC entry 3697 (class 2620 OID 18685)
-- Name: homepage_settings handle_homepage_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_homepage_settings_updated_at BEFORE UPDATE ON public.homepage_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3846 (class 3256 OID 18686)
-- Name: homepage_settings Allow all access to homepage settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access to homepage settings" ON public.homepage_settings USING (true);


--
-- TOC entry 3845 (class 0 OID 18670)
-- Dependencies: 284
-- Name: homepage_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:28:35 UTC

--
-- PostgreSQL database dump complete
--

