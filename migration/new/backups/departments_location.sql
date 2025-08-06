--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:32:37 UTC

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
-- TOC entry 298 (class 1259 OID 36977)
-- Name: departments_location; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments_location (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    department_id uuid NOT NULL,
    name text NOT NULL,
    address text,
    city text,
    state text,
    zip_code text,
    phone text,
    contact_person text,
    is_primary boolean DEFAULT false NOT NULL,
    printer_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    office_name text,
    description text,
    floor text,
    contact_number text,
    abbreviation text,
    client_id uuid,
    location_code text,
    status text DEFAULT 'active'::text,
    archived_at timestamp with time zone,
    CONSTRAINT departments_location_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text])))
);


--
-- TOC entry 3853 (class 0 OID 36977)
-- Dependencies: 298
-- Data for Name: departments_location; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments_location (id, department_id, name, address, city, state, zip_code, phone, contact_person, is_primary, printer_count, created_at, updated_at, office_name, description, floor, contact_number, abbreviation, client_id, location_code, status, archived_at) FROM stdin;
18a78117-5268-439e-8234-880d4c70e98c	bd9f4a57-d3cc-4806-bb1a-34922512feb7	Office	\N	\N	\N	\N	\N	\N	f	1	2025-06-19 14:49:27.544381+00	2025-07-01 20:46:47.701461+00	\N	\N	\N	\N	\N	6e4139f4-b341-44dd-8a84-24a9bff971fa	\N	active	\N
d4953573-4e1a-4c36-a1af-22cc53622c50	54158160-ede4-4b33-a9c8-775923bae2a6	Main Office	\N	\N	\N	\N	\N	\N	f	3	2025-06-19 10:08:21.856322+00	2025-07-08 21:56:46.288733+00	\N	\N	\N	\N	\N	c716cb3b-0765-4271-b88f-e1ecff73ec24	\N	active	\N
646cf39f-3c04-4e56-9b33-621835a1f1d3	0dadbcce-1758-4399-9e55-bade2609f496	Main Office	\N	\N	\N	\N	\N	\N	f	2	2025-06-17 05:25:35.896726+00	2025-06-19 14:56:32.898622+00	\N	\N	\N	\N	\N	3030fd7c-abd2-43a3-86da-75e083f5c298	\N	active	\N
7549aa73-7848-479f-ba76-31029d2c7aaa	52189c29-4bfb-48f4-b99e-f96ceceee45d	Main Office	\N	\N	\N	\N	\N	\N	f	3	2025-06-19 12:27:10.239553+00	2025-06-19 14:56:32.898622+00	\N	\N	\N	\N	\N	c716cb3b-0765-4271-b88f-e1ecff73ec24	\N	active	\N
3ef2bcdf-2bc1-43cd-820b-5432417af49a	c58853ea-cec8-463f-8bdb-876b540bd3ca	Ext2	\N	\N	\N	\N	\N	\N	f	1	2025-06-23 09:11:57.64104+00	2025-06-23 14:25:20.825078+00	\N	\N	\N	\N	\N	c716cb3b-0765-4271-b88f-e1ecff73ec24	\N	active	\N
70c3b37d-7372-47f4-a88b-ec4faf01a639	c58853ea-cec8-463f-8bdb-876b540bd3ca	Main	\N	\N	\N	\N	\N	\N	f	2	2025-06-23 09:11:50.329128+00	2025-06-23 14:34:20.619887+00	\N	\N	\N	\N	\N	c716cb3b-0765-4271-b88f-e1ecff73ec24	\N	active	\N
54de28f0-723a-4653-a59f-f7cbd96050b9	af99c880-6e1e-4148-86e2-3161640492ee	Main	\N	\N	\N	\N	\N	\N	f	2	2025-06-23 14:35:08.364322+00	2025-06-23 15:55:21.439564+00	\N	\N	\N	\N	\N	c716cb3b-0765-4271-b88f-e1ecff73ec24	\N	active	\N
d0e28fa5-bf9c-49ec-b7c0-3017da040458	3719b1a8-85ff-4f98-b0f6-d1a7cba7d712	Light House	\N	\N	\N	\N	\N	\N	f	2	2025-06-21 13:34:58.409246+00	2025-06-24 21:09:59.496691+00	\N	\N	\N	\N	\N	c716cb3b-0765-4271-b88f-e1ecff73ec24	\N	active	\N
d70989b3-70ea-4e43-a525-0d8b1245b03e	6f648651-c0a4-4cf3-b3c8-198b1012d1ff	Office	\N	\N	\N	\N	\N	\N	f	2	2025-06-23 08:32:49.185746+00	2025-07-01 05:55:03.983043+00	\N	\N	\N	\N	\N	c716cb3b-0765-4271-b88f-e1ecff73ec24	\N	active	\N
42eef37b-27be-43fa-9532-0b91902ace0b	ca929d8d-9495-46bb-b83a-967eae7f9d7f	2F	\N	\N	\N	\N	\N	\N	f	2	2025-06-23 08:15:43.94917+00	2025-07-01 14:49:12.878739+00	CRC	\N	\N	\N	\N	c716cb3b-0765-4271-b88f-e1ecff73ec24	\N	active	\N
169cb229-7dda-4344-809b-534e4fcfef50	3719b1a8-85ff-4f98-b0f6-d1a7cba7d712	MPC	\N	\N	\N	\N	\N	\N	f	1	2025-06-21 13:35:08.504979+00	2025-07-01 14:49:49.622426+00	\N	\N	\N	\N	\N	c716cb3b-0765-4271-b88f-e1ecff73ec24	\N	active	\N
c484aa25-edd6-4d67-9a6b-f60100c54ac4	64d79788-9702-48d6-960d-df1d64666150	15th	\N	\N	\N	\N	\N	\N	f	1	2025-07-01 06:24:06.012537+00	2025-07-01 16:00:53.073604+00	\N	\N	\N	\N	\N	e7636f67-bf8c-4e0b-969b-19f07bb2cbc8	\N	active	\N
a1eec3a8-71d6-46a6-bcdf-fbe34e78cdb9	488fe502-f0c3-488c-9cd8-2b1e5f3d1e85	2nd Floor	\N	\N	\N	\N	\N	\N	f	2	2025-06-17 15:03:34.42914+00	2025-06-19 14:56:32.898622+00	\N	\N	\N	\N	\N	c4bde792-9152-4423-844c-da987305c7a8	\N	active	\N
\.


--
-- TOC entry 3695 (class 2606 OID 36988)
-- Name: departments_location departments_location_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments_location
    ADD CONSTRAINT departments_location_pkey PRIMARY KEY (id);


--
-- TOC entry 3696 (class 1259 OID 64369)
-- Name: idx_departments_location_archived_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_location_archived_at ON public.departments_location USING btree (archived_at);


--
-- TOC entry 3697 (class 1259 OID 64368)
-- Name: idx_departments_location_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_location_status ON public.departments_location USING btree (status);


--
-- TOC entry 3699 (class 2620 OID 37024)
-- Name: departments_location update_departments_location_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_departments_location_updated_at BEFORE UPDATE ON public.departments_location FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3698 (class 2606 OID 37067)
-- Name: departments_location departments_location_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments_location
    ADD CONSTRAINT departments_location_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- TOC entry 3848 (class 3256 OID 37035)
-- Name: departments_location Enable delete for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for all users" ON public.departments_location FOR DELETE USING (true);


--
-- TOC entry 3849 (class 3256 OID 37033)
-- Name: departments_location Enable insert for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for all users" ON public.departments_location FOR INSERT WITH CHECK (true);


--
-- TOC entry 3850 (class 3256 OID 37032)
-- Name: departments_location Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.departments_location FOR SELECT USING (true);


--
-- TOC entry 3851 (class 3256 OID 37034)
-- Name: departments_location Enable update for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for all users" ON public.departments_location FOR UPDATE USING (true);


--
-- TOC entry 3847 (class 0 OID 36977)
-- Dependencies: 298
-- Name: departments_location; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.departments_location ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:32:39 UTC

--
-- PostgreSQL database dump complete
--

