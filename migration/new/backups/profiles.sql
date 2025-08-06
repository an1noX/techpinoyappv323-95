--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:29:39 UTC

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
-- TOC entry 275 (class 1259 OID 17332)
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    role text DEFAULT 'user'::text NOT NULL,
    full_name text
);


--
-- TOC entry 3846 (class 0 OID 17332)
-- Dependencies: 275
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, email, created_at, updated_at, role, full_name) FROM stdin;
08c90c8d-26b6-4064-8dbb-afc20ca56238	sales@techpinoy.net	2025-06-09 03:00:48.64553+00	2025-06-09 03:00:48.64553+00	sales_admin	\N
6c4d89aa-39c2-4df4-881a-db10da9dea52	michelle.chavez@outlook.ph	2025-06-09 03:02:51.209315+00	2025-06-09 03:02:51.209315+00	sales_admin	\N
e4234b7a-8113-469e-ae06-0904414676a4	michelle.chavez@outlook.ph	2025-05-30 14:41:01.656858+00	2025-05-30 14:41:01.656858+00	sales_admin	\N
f911e40e-3cc3-45c4-8bba-4e73ba654c2f	jnonymous@outlook.ph	2025-06-09 12:29:23.647855+00	2025-06-09 12:29:23.647855+00	admin	\N
ec0b6f95-dc88-4875-a2b7-6dfa667044e0	aims@aims.com	2025-06-12 15:16:09.761248+00	2025-06-12 15:16:09.761248+00	client	\N
a69dafd8-5e4b-4afb-8a05-0696fef5b38b	vision@vision.com	2025-06-18 18:17:57.64328+00	2025-06-18 18:17:57.64328+00	client	\N
\.


--
-- TOC entry 3691 (class 2606 OID 17340)
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3693 (class 2620 OID 52806)
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3692 (class 2606 OID 17341)
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 3842 (class 3256 OID 52805)
-- Name: profiles Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- TOC entry 3843 (class 3256 OID 17347)
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- TOC entry 3844 (class 3256 OID 17346)
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- TOC entry 3841 (class 0 OID 17332)
-- Dependencies: 275
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:29:42 UTC

--
-- PostgreSQL database dump complete
--

