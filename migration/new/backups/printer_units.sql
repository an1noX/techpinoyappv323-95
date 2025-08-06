--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:07 UTC

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
-- TOC entry 328 (class 1259 OID 65500)
-- Name: printer_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.printer_units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    printer_id uuid NOT NULL,
    serial_number text NOT NULL,
    asset_tag text,
    condition text DEFAULT 'good'::text NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    location text,
    purchase_date date,
    purchase_price numeric(10,2),
    warranty_expiry date,
    last_maintenance_date date,
    next_maintenance_due date,
    maintenance_notes text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT printer_units_condition_check CHECK ((condition = ANY (ARRAY['excellent'::text, 'good'::text, 'fair'::text, 'poor'::text, 'damaged'::text]))),
    CONSTRAINT printer_units_status_check CHECK ((status = ANY (ARRAY['available'::text, 'assigned'::text, 'maintenance'::text, 'retired'::text, 'rented'::text])))
);


--
-- TOC entry 3856 (class 0 OID 65500)
-- Dependencies: 328
-- Data for Name: printer_units; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.printer_units (id, printer_id, serial_number, asset_tag, condition, status, location, purchase_date, purchase_price, warranty_expiry, last_maintenance_date, next_maintenance_due, maintenance_notes, notes, created_at, updated_at) FROM stdin;
5d62f700-c6e5-4fc9-b932-5dfd2bb70603	2a5d9aab-51c1-442d-a72c-c16f1b38bc43	SN000004	AT0004	good	available	Service Center	2024-12-01	894.32	2027-03-28	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
b70ea213-7847-4ca6-a013-744c709696e0	9d798687-522f-4410-8f73-cbb04fef321b	SN000005	AT0005	fair	available	Main Office	2024-07-22	1168.19	2027-04-01	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
9c078a34-a143-4a08-abab-3d548e924825	8f37e3e5-6797-4424-b896-0b22f18aa1ca	SN000006	AT0006	excellent	assigned	Service Center	2022-12-02	2335.02	2026-10-28	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
f34ea359-6e11-4885-ba78-8eadc33c994d	92abdb81-2af9-40d8-a811-416cc1d019a8	SN000007	AT0007	good	maintenance	Main Office	2025-05-26	2121.18	2026-11-22	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
aeb86af1-21fd-4eda-b24f-5f65f9e88a84	f2fb4a1c-1281-4d8f-bc26-a227c70e73f0	SN000008	AT0008	good	maintenance	Warehouse A	2024-10-31	655.20	2027-10-01	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
103ee7dd-d01b-4e63-ad51-882a1918e8c0	0ebe5efb-2328-47a3-ac7f-ab2bcb5a0c95	SN000009	AT0009	good	maintenance	Main Office	2024-06-06	718.06	2028-01-02	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
4fe46c32-6baa-416c-9973-32352669999a	6d5f176c-f1df-4d4c-9fc9-a90d40d5f67c	SN000010	AT0010	good	available	Warehouse A	2025-03-24	1193.13	2027-07-09	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
c9791edb-66a0-4b56-b627-0e60180df26c	656994ae-9b26-474c-9106-f42e36301cc6	SN000011	AT0011	good	available	Main Office	2023-10-05	1322.15	2027-09-19	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
46f5ca7e-f42b-4802-907c-11eddd82e8b0	a421669e-1ec9-4ef8-bf1d-ecc94d2075fc	SN000012	AT0012	good	available	Service Center	2025-06-26	1490.86	2027-01-05	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
167713ba-c9d1-4f67-9cc7-ef551aeb427f	63336d94-1e7c-4a7e-8ace-463b0cb62f7d	SN000013	AT0013	good	maintenance	Service Center	2024-10-13	1769.03	2027-07-11	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
1c70fa8f-5673-4984-b210-3b0734bbe35b	006b1299-70d2-4c42-b7b8-de4ab40c5284	SN000014	AT0014	good	available	Warehouse A	2024-09-16	944.32	2028-05-21	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
b3ace8f9-723e-420a-a2e5-6e8b2a6ad7bb	cf8956a6-1c2e-48d2-aabb-62dcd40a3a8c	SN000015	AT0015	good	available	Service Center	2025-04-17	1336.44	2027-12-28	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
973c70ba-3c5c-4cef-b4e3-981f2da4380f	386a08a4-aaa6-4c07-a6e7-3c2168055d21	SN000016	AT0016	fair	available	Main Office	2023-07-17	1679.74	2027-06-05	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
12cdfd5c-2ba0-4ee0-a86b-a52ae3702894	7b620092-8ff8-4fb7-818f-ae33a5ee2505	SN000017	AT0017	fair	assigned	Main Office	2025-03-20	2241.09	2028-04-20	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
1a2e5cdd-b468-430d-b4b7-35edab5a2053	50f4dab4-a3ba-4912-96cf-d929b3de6233	SN000018	AT0018	good	available	Main Office	2024-01-19	2351.20	2027-05-14	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
6db2856a-d84f-409c-b9fb-587190e0ff4a	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	SN000019	AT0019	good	maintenance	Main Office	2025-07-10	2479.02	2027-02-18	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
d72e28d4-44cc-4854-92b4-84a95fc78f62	91c68cc3-30b5-419d-8eb8-20930ebc1d16	SN000020	AT0020	good	available	Warehouse A	2025-04-16	2157.38	2028-02-19	\N	\N	\N	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:40:38.200803+00
c228524a-4c4d-4ccb-a93c-3a916cca1368	87576484-dd27-4ef7-8552-72541437c5bf	SN000001	AT0001	good	maintenance	Main Office	2025-04-26	1621.87	2027-07-27	2025-07-11	\N	Scheduled maintenance initiated	\N	2025-07-11 09:40:38.200803+00	2025-07-11 09:56:38.667495+00
06166d60-8bc0-4162-8b76-f6ccca1debc8	0dcd5336-1442-4dcd-8cd9-fa3ec4bda131	SN000002	AT0002	fair	maintenance	Main Office	2025-01-20	2440.80	2027-09-30	2025-07-11	\N	Scheduled maintenance initiated	\N	2025-07-11 09:40:38.200803+00	2025-07-11 10:16:53.070686+00
54170e73-ae03-411c-8020-2393fdaadb9b	ccd8cfb6-dcbc-4ef4-93f1-d87be23625ca	SN000003	AT0003	good	maintenance	Warehouse A	2024-01-07	2018.33	2027-05-08	2025-07-11	\N	Scheduled maintenance initiated	\N	2025-07-11 09:40:38.200803+00	2025-07-11 10:16:57.458314+00
\.


--
-- TOC entry 3698 (class 2606 OID 65517)
-- Name: printer_units printer_units_asset_tag_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_units
    ADD CONSTRAINT printer_units_asset_tag_key UNIQUE (asset_tag);


--
-- TOC entry 3700 (class 2606 OID 65513)
-- Name: printer_units printer_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_units
    ADD CONSTRAINT printer_units_pkey PRIMARY KEY (id);


--
-- TOC entry 3702 (class 2606 OID 65515)
-- Name: printer_units printer_units_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_units
    ADD CONSTRAINT printer_units_serial_number_key UNIQUE (serial_number);


--
-- TOC entry 3694 (class 1259 OID 65525)
-- Name: idx_printer_units_printer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_printer_units_printer_id ON public.printer_units USING btree (printer_id);


--
-- TOC entry 3695 (class 1259 OID 65527)
-- Name: idx_printer_units_serial_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_printer_units_serial_number ON public.printer_units USING btree (serial_number);


--
-- TOC entry 3696 (class 1259 OID 65526)
-- Name: idx_printer_units_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_printer_units_status ON public.printer_units USING btree (status);


--
-- TOC entry 3704 (class 2620 OID 65528)
-- Name: printer_units update_printer_units_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_printer_units_updated_at BEFORE UPDATE ON public.printer_units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3703 (class 2606 OID 65518)
-- Name: printer_units printer_units_printer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_units
    ADD CONSTRAINT printer_units_printer_id_fkey FOREIGN KEY (printer_id) REFERENCES public.printers(id) ON DELETE CASCADE;


--
-- TOC entry 3853 (class 3256 OID 65524)
-- Name: printer_units Admins can manage printer units; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage printer units" ON public.printer_units USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'owner'::text]))))));


--
-- TOC entry 3854 (class 3256 OID 65523)
-- Name: printer_units Users can view printer units; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view printer units" ON public.printer_units FOR SELECT USING (true);


--
-- TOC entry 3852 (class 0 OID 65500)
-- Dependencies: 328
-- Name: printer_units; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.printer_units ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:33:09 UTC

--
-- PostgreSQL database dump complete
--

