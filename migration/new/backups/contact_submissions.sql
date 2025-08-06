--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:28:05 UTC

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
-- TOC entry 307 (class 1259 OID 52741)
-- Name: contact_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    request_type text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'new'::text,
    CONSTRAINT contact_submissions_status_check CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'responded'::text])))
);


--
-- TOC entry 3849 (class 0 OID 52741)
-- Dependencies: 307
-- Data for Name: contact_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contact_submissions (id, name, email, phone, request_type, message, created_at, status) FROM stdin;
359a77dd-aff8-49c7-a4df-f261a6e25f12	Michelle Chavez	mzmytch@outlook.com	+639771188880	printing	aasd	2025-06-30 20:43:20.197243+00	new
a6cf9bbb-ebb2-45d8-a86a-cf68ff759898	james chavez	jnonymous@outlook.ph	+639509999290	printing	asdasda	2025-06-30 20:44:10.834441+00	new
c688b035-77dd-4fc9-8e3b-b345c40287ca	Michelle Chavez	jnonymous@outlook.ph	+639509999290	support	aaaa	2025-06-30 20:45:43.025757+00	new
31630c24-77d0-46bf-bcdc-181b8ab9b95e	aaaa	jnonymous@outlook.ph	+639509999290	printing	asdadad	2025-06-30 20:55:02.719177+00	new
dbc037d7-6403-4cb3-a42c-c63dbce352e5	Michelle Chavez	jnonymous@outlook.ph	+639509999290	printing	teads	2025-07-01 15:12:11.557552+00	new
\.


--
-- TOC entry 3692 (class 2606 OID 52751)
-- Name: contact_submissions contact_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_submissions
    ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3693 (class 2620 OID 52798)
-- Name: contact_submissions handle_contact_submissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_contact_submissions_updated_at BEFORE UPDATE ON public.contact_submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3842 (class 3256 OID 52824)
-- Name: contact_submissions Allow delete contact submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete contact submissions" ON public.contact_submissions FOR DELETE TO authenticated, anon USING (true);


--
-- TOC entry 3843 (class 3256 OID 52821)
-- Name: contact_submissions Allow insert contact submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert contact submissions" ON public.contact_submissions FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- TOC entry 3844 (class 3256 OID 52752)
-- Name: contact_submissions Allow public insertion of contact submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insertion of contact submissions" ON public.contact_submissions FOR INSERT TO anon WITH CHECK (true);


--
-- TOC entry 3845 (class 3256 OID 52822)
-- Name: contact_submissions Allow select contact submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select contact submissions" ON public.contact_submissions FOR SELECT TO authenticated, anon USING (true);


--
-- TOC entry 3846 (class 3256 OID 52823)
-- Name: contact_submissions Allow update contact submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update contact submissions" ON public.contact_submissions FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);


--
-- TOC entry 3847 (class 3256 OID 52753)
-- Name: contact_submissions Authenticated users can read contact submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read contact submissions" ON public.contact_submissions FOR SELECT TO authenticated USING (true);


--
-- TOC entry 3841 (class 0 OID 52741)
-- Dependencies: 307
-- Name: contact_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:28:08 UTC

--
-- PostgreSQL database dump complete
--

