--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:30:57 UTC

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
-- TOC entry 297 (class 1259 OID 36962)
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    department_head text,
    budget numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    floor text,
    location text,
    contact_person text,
    abbreviation text,
    office_name text,
    contact_number text,
    department_code text,
    status text DEFAULT 'active'::text,
    archived_at timestamp with time zone,
    location_count integer DEFAULT 0,
    CONSTRAINT departments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text])))
);


--
-- TOC entry 3859 (class 0 OID 0)
-- Dependencies: 297
-- Name: COLUMN departments.location_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.departments.location_count IS 'Count of locations within this department';


--
-- TOC entry 3853 (class 0 OID 36962)
-- Dependencies: 297
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, client_id, name, description, department_head, budget, created_at, updated_at, floor, location, contact_person, abbreviation, office_name, contact_number, department_code, status, archived_at, location_count) FROM stdin;
0dadbcce-1758-4399-9e55-bade2609f496	3030fd7c-abd2-43a3-86da-75e083f5c298	Admin	\N	\N	\N	2025-06-17 05:25:30.190275+00	2025-06-17 05:25:30.190275+00	\N	\N	\N	\N	\N	\N	\N	active	\N	0
488fe502-f0c3-488c-9cd8-2b1e5f3d1e85	c4bde792-9152-4423-844c-da987305c7a8	Admin	\N	\N	\N	2025-06-17 14:54:23.691249+00	2025-06-17 14:54:23.691249+00	\N	\N	\N	\N	\N	\N	\N	active	\N	0
54158160-ede4-4b33-a9c8-775923bae2a6	c716cb3b-0765-4271-b88f-e1ecff73ec24	Admission	\N	\N	\N	2025-06-19 10:08:12.60527+00	2025-06-19 10:08:12.60527+00	\N	\N	\N	\N	\N	\N	\N	active	\N	0
52189c29-4bfb-48f4-b99e-f96ceceee45d	c716cb3b-0765-4271-b88f-e1ecff73ec24	CCA	\N	\N	\N	2025-06-19 12:26:55.222301+00	2025-06-19 12:26:55.222301+00	\N	\N	\N	\N	\N	\N	\N	active	\N	0
3719b1a8-85ff-4f98-b0f6-d1a7cba7d712	c716cb3b-0765-4271-b88f-e1ecff73ec24	Library	\N	\N	\N	2025-06-19 12:27:00.489121+00	2025-06-19 12:27:00.489121+00	\N	\N	\N	\N	\N	\N	\N	active	\N	0
ca929d8d-9495-46bb-b83a-967eae7f9d7f	c716cb3b-0765-4271-b88f-e1ecff73ec24	Registrar	\N	\N	\N	2025-06-23 07:59:58.390481+00	2025-06-23 07:59:58.390481+00	2F	\N	\N	CRC	\N	\N	\N	active	\N	0
c58853ea-cec8-463f-8bdb-876b540bd3ca	c716cb3b-0765-4271-b88f-e1ecff73ec24	BEMO	\N	\N	\N	2025-06-23 09:11:43.977269+00	2025-06-23 09:11:43.977269+00	\N	\N	\N	\N	\N	\N	\N	active	\N	0
af99c880-6e1e-4148-86e2-3161640492ee	c716cb3b-0765-4271-b88f-e1ecff73ec24	Executive	\N	\N	\N	2025-06-23 14:34:54.760886+00	2025-06-23 14:34:54.760886+00	\N	\N	\N	\N	\N	\N	\N	active	\N	0
6f648651-c0a4-4cf3-b3c8-198b1012d1ff	c716cb3b-0765-4271-b88f-e1ecff73ec24	- Client Owned Printers	\N	\N	\N	2025-06-23 08:32:33.046994+00	2025-06-24 20:42:34.953057+00	\N	\N	\N	\N	\N	\N	\N	active	\N	0
64d79788-9702-48d6-960d-df1d64666150	e7636f67-bf8c-4e0b-969b-19f07bb2cbc8	Main Office	\N	\N	\N	2025-07-01 06:23:45.770496+00	2025-07-01 06:23:45.770496+00	15th	\N	\N	\N	\N	\N	\N	active	\N	0
bd9f4a57-d3cc-4806-bb1a-34922512feb7	6e4139f4-b341-44dd-8a84-24a9bff971fa	Layug Branch	\N	\N	\N	2025-06-19 14:46:13.344714+00	2025-07-01 20:47:07.347538+00	\N	\N	\N	\N	\N	\N	\N	active	\N	0
\.


--
-- TOC entry 3694 (class 2606 OID 36971)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 3695 (class 1259 OID 64367)
-- Name: idx_departments_archived_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_archived_at ON public.departments USING btree (archived_at);


--
-- TOC entry 3696 (class 1259 OID 64366)
-- Name: idx_departments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_status ON public.departments USING btree (status);


--
-- TOC entry 3698 (class 2620 OID 37026)
-- Name: departments trigger_update_client_department_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_client_department_count AFTER INSERT OR DELETE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_client_department_count();


--
-- TOC entry 3699 (class 2620 OID 37023)
-- Name: departments update_departments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3697 (class 2606 OID 36972)
-- Name: departments departments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 3848 (class 3256 OID 37031)
-- Name: departments Enable delete for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for all users" ON public.departments FOR DELETE USING (true);


--
-- TOC entry 3849 (class 3256 OID 37029)
-- Name: departments Enable insert for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for all users" ON public.departments FOR INSERT WITH CHECK (true);


--
-- TOC entry 3850 (class 3256 OID 37028)
-- Name: departments Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.departments FOR SELECT USING (true);


--
-- TOC entry 3851 (class 3256 OID 37030)
-- Name: departments Enable update for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for all users" ON public.departments FOR UPDATE USING (true);


--
-- TOC entry 3847 (class 0 OID 36962)
-- Dependencies: 297
-- Name: departments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:31:00 UTC

--
-- PostgreSQL database dump complete
--

