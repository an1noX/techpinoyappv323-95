--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:28:29 UTC

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
-- TOC entry 285 (class 1259 OID 18687)
-- Name: header_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.header_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_name text NOT NULL,
    setting_value jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3845 (class 0 OID 18687)
-- Dependencies: 285
-- Data for Name: header_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.header_settings (id, setting_name, setting_value, is_active, created_at, updated_at) FROM stdin;
f4add2a6-cd25-4e7a-b442-eaf41cfda2c6	search_bar	{"is_visible": true, "placeholder": "Search by Printer Model, Cartridge # or Keywords..."}	t	2025-05-31 13:39:28.999938+00	2025-05-31 13:39:28.999938+00
8090c59a-7068-4766-b135-3180aeee8432	top_bar	{"phone": "+639 7711 88880", "live_chat_text": "Live Chat", "special_offer_url": "/special-offer", "free_shipping_text": "Free Shipping Over ₱3,000 | Subscribe For Discount", "special_offer_text": "Special Offer"}	t	2025-05-31 13:39:28.999938+00	2025-05-31 13:57:31.309904+00
a17a0a4b-f4c1-4858-9b4a-6f6fec019f5e	logo	{"alt_text": "TechPinoy", "image_url": "https://mzjcmtltwdcpbdvunmzk.supabase.co/storage/v1/object/public/website-assets/header-logos/1748700034151.PNG"}	t	2025-05-31 13:39:28.999938+00	2025-05-31 14:00:35.190681+00
1689f5e8-0804-42cd-a404-f0bb1a87d140	navigation	{"brands": ["HP", "Brother", "Canon", "Xerox", "Samsung", "Other Brands"], "coupons_button": {"url": "/coupons", "icon": "🎟️", "text": "COUPONS", "enabled": false}, "additional_links": [{"url": "/blogs", "label": "Blogs"}, {"url": "/contact", "label": "Contact Us"}]}	t	2025-05-31 13:39:28.999938+00	2025-05-31 14:19:47.962328+00
c7b44b9b-20c9-407b-a87b-1277d031e9e7	header_icons	{"show_cart": false, "show_track_order": false, "show_user_account": true, "show_quick_reorder": false}	t	2025-05-31 14:32:22.170891+00	2025-05-31 14:32:24.890747+00
\.


--
-- TOC entry 3693 (class 2606 OID 18698)
-- Name: header_settings header_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.header_settings
    ADD CONSTRAINT header_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3695 (class 2606 OID 18700)
-- Name: header_settings header_settings_setting_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.header_settings
    ADD CONSTRAINT header_settings_setting_name_key UNIQUE (setting_name);


--
-- TOC entry 3696 (class 2620 OID 18715)
-- Name: header_settings handle_header_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_header_settings_updated_at BEFORE UPDATE ON public.header_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- Completed on 2025-07-14 11:28:32 UTC

--
-- PostgreSQL database dump complete
--

