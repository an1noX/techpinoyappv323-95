--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:39 UTC

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
-- TOC entry 299 (class 1259 OID 36994)
-- Name: printer_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.printer_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    printer_id uuid NOT NULL,
    client_id uuid NOT NULL,
    department_location_id uuid,
    serial_number text,
    deployment_date date,
    is_rental boolean DEFAULT false NOT NULL,
    monthly_price numeric,
    has_security_deposit boolean DEFAULT false NOT NULL,
    security_deposit_amount numeric,
    notes text,
    status text DEFAULT 'active'::text NOT NULL,
    is_unassigned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    maintenance_notes text,
    location text,
    maintenance_issue_reported_date date,
    usage_type character varying(20) DEFAULT 'service_unit'::character varying,
    is_service_unit boolean DEFAULT false,
    is_client_owned boolean DEFAULT false,
    condition text DEFAULT 'good'::text,
    assignment_effective_date date DEFAULT CURRENT_DATE,
    reason_for_change text,
    last_service_date date,
    department text,
    CONSTRAINT printer_assignments_condition_check CHECK ((condition = ANY (ARRAY['good'::text, 'needs_maintenance'::text, 'retired'::text]))),
    CONSTRAINT usage_type_check CHECK (((usage_type)::text = ANY ((ARRAY['service_unit'::character varying, 'client_owned'::character varying, 'rental'::character varying])::text[])))
);


--
-- TOC entry 3871 (class 0 OID 0)
-- Dependencies: 299
-- Name: COLUMN printer_assignments.department; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.printer_assignments.department IS 'Department name for backward compatibility';


--
-- TOC entry 3865 (class 0 OID 36994)
-- Dependencies: 299
-- Data for Name: printer_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.printer_assignments (id, printer_id, client_id, department_location_id, serial_number, deployment_date, is_rental, monthly_price, has_security_deposit, security_deposit_amount, notes, status, is_unassigned, created_at, updated_at, maintenance_notes, location, maintenance_issue_reported_date, usage_type, is_service_unit, is_client_owned, condition, assignment_effective_date, reason_for_change, last_service_date, department) FROM stdin;
776407b0-19fa-4437-a452-8e93f8916745	656994ae-9b26-474c-9106-f42e36301cc6	3030fd7c-abd2-43a3-86da-75e083f5c298	646cf39f-3c04-4e56-9b33-621835a1f1d3	\N	2025-06-17	f	\N	f	\N	\N	active	f	2025-06-17 05:25:46.138662+00	2025-06-19 14:56:32.898622+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
3d75dd63-303f-4b87-beb2-12cde14f34ec	8f37e3e5-6797-4424-b896-0b22f18aa1ca	c716cb3b-0765-4271-b88f-e1ecff73ec24	7549aa73-7848-479f-ba76-31029d2c7aaa	\N	2025-06-19	f	\N	f	\N	\N	active	f	2025-06-19 12:34:09.151971+00	2025-06-19 14:56:32.898622+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
c93cab35-9eb2-4dcb-8578-7165823aafb4	f2fb4a1c-1281-4d8f-bc26-a227c70e73f0	c4bde792-9152-4423-844c-da987305c7a8	a1eec3a8-71d6-46a6-bcdf-fbe34e78cdb9	\N	2025-06-19	f	\N	f	\N	\N	active	f	2025-06-19 13:41:40.897904+00	2025-06-19 14:56:32.898622+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
0b4825bf-3c75-4b6b-b319-a20f2d7fd498	f2fb4a1c-1281-4d8f-bc26-a227c70e73f0	c4bde792-9152-4423-844c-da987305c7a8	a1eec3a8-71d6-46a6-bcdf-fbe34e78cdb9	\N	2025-06-19	f	\N	f	\N	\N	active	f	2025-06-19 13:42:15.797316+00	2025-06-19 14:56:32.898622+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
3bfcf908-70f8-4eb2-9f83-5da212cf3b9e	92abdb81-2af9-40d8-a811-416cc1d019a8	c716cb3b-0765-4271-b88f-e1ecff73ec24	7549aa73-7848-479f-ba76-31029d2c7aaa	\N	2025-06-19	f	\N	f	\N	\N	active	f	2025-06-19 13:44:06.541343+00	2025-06-19 14:56:32.898622+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
e44c3384-aa16-4f95-af05-147decde220b	92abdb81-2af9-40d8-a811-416cc1d019a8	3030fd7c-abd2-43a3-86da-75e083f5c298	646cf39f-3c04-4e56-9b33-621835a1f1d3	\N	2025-06-19	f	\N	f	\N	\N	active	f	2025-06-19 13:50:29.575154+00	2025-06-19 14:56:32.898622+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
7c845e02-6186-4de7-9ccd-fe60756c7e16	87576484-dd27-4ef7-8552-72541437c5bf	c716cb3b-0765-4271-b88f-e1ecff73ec24	7549aa73-7848-479f-ba76-31029d2c7aaa	123131455111	2025-06-19	f	\N	f	\N	\N	active	f	2025-06-19 13:51:11.457668+00	2025-06-19 14:56:32.898622+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
6fe2b893-611d-4952-91a4-c13d1880b436	92abdb81-2af9-40d8-a811-416cc1d019a8	c716cb3b-0765-4271-b88f-e1ecff73ec24	d0e28fa5-bf9c-49ec-b7c0-3017da040458	\N	2025-06-22	f	\N	f	\N	\N	active	f	2025-06-22 17:24:58.181783+00	2025-06-22 17:24:58.181783+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
0d083d7d-2ba3-482c-93d6-2ae9cdc97151	7b620092-8ff8-4fb7-818f-ae33a5ee2505	c716cb3b-0765-4271-b88f-e1ecff73ec24	42eef37b-27be-43fa-9532-0b91902ace0b	\N	2025-06-23	f	\N	f	\N	\N	active	f	2025-06-23 08:16:02.079298+00	2025-06-23 08:16:02.079298+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
83e72b90-5923-496e-8ff9-6b837c57372e	0dcd5336-1442-4dcd-8cd9-fa3ec4bda131	c716cb3b-0765-4271-b88f-e1ecff73ec24	d70989b3-70ea-4e43-a525-0d8b1245b03e	\N	2025-06-23	f	\N	f	\N	\N	active	f	2025-06-23 08:33:11.385511+00	2025-06-23 08:33:11.385511+00	\N	\N	\N	client_owned	f	f	good	2025-07-07	\N	\N	\N
9d7df442-cc2d-4b7d-ab5b-93396b243859	49d23f46-08e9-47e6-8085-ebd75883fccb	c716cb3b-0765-4271-b88f-e1ecff73ec24	70c3b37d-7372-47f4-a88b-ec4faf01a639	\N	2025-06-23	f	\N	f	\N	\N	active	f	2025-06-23 12:01:27.029883+00	2025-06-23 12:01:27.029883+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
87b5c930-62ca-4501-9152-6f44cb55595d	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	c716cb3b-0765-4271-b88f-e1ecff73ec24	3ef2bcdf-2bc1-43cd-820b-5432417af49a	\N	2025-06-23	f	\N	f	\N	\N	active	f	2025-06-23 12:50:43.292202+00	2025-06-23 14:19:53.845293+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
42a694d5-7b38-4ee7-888a-4510784cec66	91c68cc3-30b5-419d-8eb8-20930ebc1d16	c716cb3b-0765-4271-b88f-e1ecff73ec24	70c3b37d-7372-47f4-a88b-ec4faf01a639	E71879H4J436499	2025-06-22	f	\N	f	\N	\N	active	f	2025-06-22 17:21:44.114979+00	2025-06-23 14:34:20.619887+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
85a18971-a25a-4c7a-b8cf-20878d0983f6	ccd8cfb6-dcbc-4ef4-93f1-d87be23625ca	c716cb3b-0765-4271-b88f-e1ecff73ec24	54de28f0-723a-4653-a59f-f7cbd96050b9	\N	2025-06-23	f	\N	f	\N	\N	active	f	2025-06-23 15:55:10.694723+00	2025-06-23 15:55:10.694723+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
38be8682-70e2-4de5-ab72-175f906f72b5	6d5f176c-f1df-4d4c-9fc9-a90d40d5f67c	c716cb3b-0765-4271-b88f-e1ecff73ec24	54de28f0-723a-4653-a59f-f7cbd96050b9	\N	2025-06-23	f	\N	f	\N	\N	active	f	2025-06-23 15:55:21.439564+00	2025-06-23 15:55:21.439564+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
b99e0715-8777-49bf-a753-4e61069c34ac	a421669e-1ec9-4ef8-bf1d-ecc94d2075fc	c716cb3b-0765-4271-b88f-e1ecff73ec24	d4953573-4e1a-4c36-a1af-22cc53622c50	\N	2025-06-24	f	\N	f	\N	\N	active	f	2025-06-24 04:57:48.968082+00	2025-06-24 04:57:48.968082+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
347d559a-58e1-4d00-9d76-59adf563e098	cf8956a6-1c2e-48d2-aabb-62dcd40a3a8c	c716cb3b-0765-4271-b88f-e1ecff73ec24	d0e28fa5-bf9c-49ec-b7c0-3017da040458	\N	2025-06-24	f	\N	f	\N	\N	active	f	2025-06-24 21:09:59.496691+00	2025-06-24 21:09:59.496691+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
e512e080-9109-47c6-9f74-d1475c9dcb2e	ebce9078-34b7-4ecc-b570-1192380ef485	c716cb3b-0765-4271-b88f-e1ecff73ec24	d70989b3-70ea-4e43-a525-0d8b1245b03e	\N	2025-06-24	f	\N	f	\N	\N	active	f	2025-06-24 21:15:34.304736+00	2025-06-30 21:36:31.455881+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
ead4f414-de8f-4c8e-ab00-d9edff3e0a49	a7adb9e7-e6cc-4ced-b4fd-486f6fa5dba4	c716cb3b-0765-4271-b88f-e1ecff73ec24	d4953573-4e1a-4c36-a1af-22cc53622c50	\N	2025-06-24	f	\N	f	\N	\N	active	f	2025-06-24 20:49:31.956047+00	2025-07-01 05:55:03.983043+00	\N	\N	\N	client_owned	f	f	good	2025-07-07	\N	\N	\N
36ca94fa-07cd-42f3-b828-14b71c73a683	92abdb81-2af9-40d8-a811-416cc1d019a8	c716cb3b-0765-4271-b88f-e1ecff73ec24	42eef37b-27be-43fa-9532-0b91902ace0b	\N	2025-07-01	f	\N	f	\N	\N	active	f	2025-07-01 14:49:12.878739+00	2025-07-01 14:49:12.878739+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
755916d6-1617-4203-9590-90e2a6fa6c0b	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	c716cb3b-0765-4271-b88f-e1ecff73ec24	169cb229-7dda-4344-809b-534e4fcfef50	\N	2025-07-01	f	\N	f	\N	\N	active	f	2025-07-01 14:49:49.622426+00	2025-07-01 14:49:49.622426+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
8e8d8ba5-bdc1-4cc7-b6b3-b5e4a0937498	0ebe5efb-2328-47a3-ac7f-ab2bcb5a0c95	e7636f67-bf8c-4e0b-969b-19f07bb2cbc8	c484aa25-edd6-4d67-9a6b-f60100c54ac4	VNBRQ6M2HS	2025-07-01	f	\N	t	15000	\N	active	f	2025-07-01 06:25:09.788665+00	2025-07-01 16:00:53.073604+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
35db1f0e-6f6b-4218-9fc9-162bc10063a5	50f4dab4-a3ba-4912-96cf-d929b3de6233	6e4139f4-b341-44dd-8a84-24a9bff971fa	18a78117-5268-439e-8234-880d4c70e98c	\N	2025-07-01	f	\N	f	\N	\N	active	f	2025-07-01 20:46:47.701461+00	2025-07-01 20:46:47.701461+00	\N	\N	\N	client_owned	f	f	good	2025-07-07	\N	\N	\N
51974248-17ae-4176-b0cc-240b704a84a6	92abdb81-2af9-40d8-a811-416cc1d019a8	c716cb3b-0765-4271-b88f-e1ecff73ec24	d4953573-4e1a-4c36-a1af-22cc53622c50	123	2025-06-19	f	\N	f	\N	\N	active	f	2025-06-19 12:26:48.106885+00	2025-07-08 21:56:46.288733+00	\N	\N	\N	service_unit	f	f	good	2025-07-07	\N	\N	\N
\.


--
-- TOC entry 3704 (class 2606 OID 37007)
-- Name: printer_assignments printer_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_assignments
    ADD CONSTRAINT printer_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 3701 (class 1259 OID 37066)
-- Name: idx_printer_assignments_department_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_printer_assignments_department_location_id ON public.printer_assignments USING btree (department_location_id);


--
-- TOC entry 3702 (class 1259 OID 64371)
-- Name: idx_printer_assignments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_printer_assignments_status ON public.printer_assignments USING btree (status);


--
-- TOC entry 3708 (class 2620 OID 60970)
-- Name: printer_assignments printer_assignment_history_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER printer_assignment_history_trigger AFTER INSERT OR DELETE OR UPDATE ON public.printer_assignments FOR EACH ROW EXECUTE FUNCTION public.trigger_printer_assignment_history();


--
-- TOC entry 3709 (class 2620 OID 37041)
-- Name: printer_assignments trigger_update_printer_counts_v4; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_printer_counts_v4 AFTER INSERT OR DELETE OR UPDATE ON public.printer_assignments FOR EACH ROW EXECUTE FUNCTION public.update_printer_counts_v4();


--
-- TOC entry 3710 (class 2620 OID 37025)
-- Name: printer_assignments update_printer_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_printer_assignments_updated_at BEFORE UPDATE ON public.printer_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3711 (class 2620 OID 37065)
-- Name: printer_assignments update_printer_counts_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_printer_counts_trigger AFTER INSERT OR DELETE OR UPDATE ON public.printer_assignments FOR EACH ROW EXECUTE FUNCTION public.update_printer_counts();


--
-- TOC entry 3705 (class 2606 OID 37013)
-- Name: printer_assignments printer_assignments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_assignments
    ADD CONSTRAINT printer_assignments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 3706 (class 2606 OID 37072)
-- Name: printer_assignments printer_assignments_department_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_assignments
    ADD CONSTRAINT printer_assignments_department_location_id_fkey FOREIGN KEY (department_location_id) REFERENCES public.departments_location(id) ON DELETE SET NULL;


--
-- TOC entry 3707 (class 2606 OID 37008)
-- Name: printer_assignments printer_assignments_printer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_assignments
    ADD CONSTRAINT printer_assignments_printer_id_fkey FOREIGN KEY (printer_id) REFERENCES public.printers(id) ON DELETE CASCADE;


--
-- TOC entry 3860 (class 3256 OID 37039)
-- Name: printer_assignments Enable delete for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for all users" ON public.printer_assignments FOR DELETE USING (true);


--
-- TOC entry 3861 (class 3256 OID 37037)
-- Name: printer_assignments Enable insert for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for all users" ON public.printer_assignments FOR INSERT WITH CHECK (true);


--
-- TOC entry 3862 (class 3256 OID 37036)
-- Name: printer_assignments Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.printer_assignments FOR SELECT USING (true);


--
-- TOC entry 3863 (class 3256 OID 37038)
-- Name: printer_assignments Enable update for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for all users" ON public.printer_assignments FOR UPDATE USING (true);


--
-- TOC entry 3859 (class 0 OID 36994)
-- Dependencies: 299
-- Name: printer_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.printer_assignments ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:33:42 UTC

--
-- PostgreSQL database dump complete
--

