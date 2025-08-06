--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:28:27 UTC

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
-- TOC entry 286 (class 1259 OID 18701)
-- Name: footer_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.footer_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_name text NOT NULL,
    setting_value jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3845 (class 0 OID 18701)
-- Dependencies: 286
-- Data for Name: footer_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.footer_settings (id, setting_name, setting_value, is_active, created_at, updated_at) FROM stdin;
e63b897b-e842-4575-8701-c25a110899aa	company_info	{"sections": [{"links": [{"url": "/cart", "label": "Shopping Cart"}, {"url": "/track-order", "label": "Track Order"}, {"url": "/reorder", "label": "Auto Reorder"}], "title": "My Account"}, {"links": [{"url": "/about", "label": "About Us"}, {"url": "/contact", "label": "Contact Us"}, {"url": "/blog", "label": "Blog"}, {"url": "/coupons", "label": "Coupons"}], "title": "Company Info"}, {"links": [{"url": "/shipping", "label": "Shipping Policy"}, {"url": "/returns", "label": "Returns Policy"}, {"url": "/payment", "label": "Payment Methods"}, {"url": "/terms", "label": "Terms of Use"}, {"url": "/privacy", "label": "Privacy Policy"}], "title": "Support"}]}	t	2025-05-31 13:39:28.999938+00	2025-05-31 13:39:28.999938+00
fb231a1e-31a1-44ff-a56a-173875f9c63d	copyright	{"text": "© 2025 TechPinoy. All Rights Reserved", "links": [{"url": "/privacy", "label": "Privacy Policy"}, {"url": "/terms", "label": "Terms of Use"}]}	t	2025-05-31 13:39:28.999938+00	2025-05-31 13:39:28.999938+00
03213843-2681-4270-b85e-1d11a12b9c98	social_media	{"title": "Follow Us", "platforms": [{"url": "https://www.facebook.com/techpinoy.net", "icon": "Facebook", "name": "Facebook"}]}	t	2025-05-31 13:39:28.999938+00	2025-05-31 14:11:41.178479+00
4ef5007f-242e-4699-9e1e-cf33efcc8f49	footer_sections	{"show_sections": false}	t	2025-05-31 14:33:05.794153+00	2025-05-31 14:33:05.794153+00
4cb8e9de-9223-4853-998d-86ed58dbe95a	page_views	{"label": "Site Visits", "show_details": false, "show_page_views": false}	t	2025-05-31 14:04:16.534319+00	2025-06-12 23:23:33.792807+00
697a1322-c375-4748-8b1e-89cb218597cd	contact_info	{"email": "support@techpinoy.com", "phone": "+639 7711 88880", "closed_days": "CLOSED SAT. & SUN.", "office_hours": "Office Hours: Mon - Fri 9am - 5pm PST"}	t	2025-05-31 13:39:28.999938+00	2025-05-31 13:56:24.031975+00
\.


--
-- TOC entry 3693 (class 2606 OID 18712)
-- Name: footer_settings footer_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.footer_settings
    ADD CONSTRAINT footer_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3695 (class 2606 OID 18714)
-- Name: footer_settings footer_settings_setting_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.footer_settings
    ADD CONSTRAINT footer_settings_setting_name_key UNIQUE (setting_name);


--
-- TOC entry 3696 (class 2620 OID 18716)
-- Name: footer_settings handle_footer_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_footer_settings_updated_at BEFORE UPDATE ON public.footer_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- Completed on 2025-07-14 11:28:29 UTC

--
-- PostgreSQL database dump complete
--

