--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:12 UTC

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
-- TOC entry 280 (class 1259 OID 17426)
-- Name: product_printers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_printers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    printer_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    compatibility_notes text,
    is_recommended boolean DEFAULT false
);


--
-- TOC entry 3851 (class 0 OID 17426)
-- Dependencies: 280
-- Data for Name: product_printers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_printers (id, product_id, printer_id, created_at, compatibility_notes, is_recommended) FROM stdin;
1f2c8ef3-15f7-46b6-97ea-d37c80611f72	449076fd-24dd-44cb-8b8f-d3566411c31b	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	2025-06-18 03:41:41.197293+00	\N	f
2b648864-8565-43a3-a016-3f0def128828	0dc4ab0e-486a-4853-b585-75dbb2109842	50f4dab4-a3ba-4912-96cf-d929b3de6233	2025-06-19 02:00:07.881992+00	\N	f
8bd9b800-d299-4ab2-83a4-94bc703f1260	36f9fdd7-8d20-4d2b-ad9c-6ca9a96ae570	cf8956a6-1c2e-48d2-aabb-62dcd40a3a8c	2025-06-19 04:54:39.296687+00	\N	f
03f6ecb2-11bd-46c4-a46e-9baad32118bf	85aa8577-a033-4c02-9e83-548c7f8fa123	cf8956a6-1c2e-48d2-aabb-62dcd40a3a8c	2025-06-19 04:54:53.862854+00	\N	f
97106c9a-c699-4000-b246-5ff4355666ca	e08de55f-5176-4bb9-a27b-7370193116c0	cf8956a6-1c2e-48d2-aabb-62dcd40a3a8c	2025-06-19 04:55:04.066775+00	\N	f
cbb10382-fb7b-4e01-ba09-e954ca42bb61	e305be74-a39d-4ab9-9a5d-53a04f10c726	cf8956a6-1c2e-48d2-aabb-62dcd40a3a8c	2025-06-19 04:55:10.905535+00	\N	f
b813dae0-d3e2-467e-8665-db0a67f97695	513d53ab-9c8b-4438-93fb-6efb64f67c50	f2fb4a1c-1281-4d8f-bc26-a227c70e73f0	2025-06-19 13:29:19.183895+00	\N	f
31b6e7c4-1463-48bb-8c3e-acf3b0101c52	e1b114a2-4f90-4ed2-b9c7-f6688bfbdfd8	386a08a4-aaa6-4c07-a6e7-3c2168055d21	2025-06-22 06:01:47.84033+00	\N	f
079d5009-35c9-46f2-98d4-f93dbad86179	e1b114a2-4f90-4ed2-b9c7-f6688bfbdfd8	a421669e-1ec9-4ef8-bf1d-ecc94d2075fc	2025-06-22 06:01:47.84033+00	\N	f
962065c0-0d1d-441e-81a5-48331b977616	01521495-cac2-4e03-847e-f4bba0fa85ee	a7adb9e7-e6cc-4ced-b4fd-486f6fa5dba4	2025-06-24 20:58:02.088393+00	\N	f
889d0a05-2cd3-4996-becf-26e8f2335f37	0117a2b6-d6e8-4ae2-8e92-e3fe5ff0c0f6	a7adb9e7-e6cc-4ced-b4fd-486f6fa5dba4	2025-06-24 20:58:02.088393+00	\N	f
3404d3b8-884c-43e5-baab-805880c1dbd6	29ae943e-705d-4c1f-9b37-5ae70419cbab	a7adb9e7-e6cc-4ced-b4fd-486f6fa5dba4	2025-06-24 20:58:02.088393+00	\N	f
9ba0259b-39a0-4eaa-8faa-81443bc39f3d	8dc822d0-f7b1-4b42-a823-a292eb36bf6e	a7adb9e7-e6cc-4ced-b4fd-486f6fa5dba4	2025-06-24 20:58:02.088393+00	\N	f
7b0216a6-a96b-4cee-9a65-15a388e70245	fcec0d6b-c945-4855-ac3e-9742eea735aa	7b620092-8ff8-4fb7-818f-ae33a5ee2505	2025-06-23 08:12:00.104201+00	\N	f
6ae5a1bc-9ae4-40ca-8068-b0d72f493f80	a12c4807-d102-4f55-93ba-596e33547244	7b620092-8ff8-4fb7-818f-ae33a5ee2505	2025-06-23 08:12:19.009265+00	\N	f
e484d9b8-34b5-45e7-8dc4-ea65cdd8c39e	bcbf4289-e65f-4f62-84e3-efdcf9d94b9e	7b620092-8ff8-4fb7-818f-ae33a5ee2505	2025-06-23 08:12:42.833658+00	\N	f
f2ddf38e-04f3-4ecf-bc0a-349d30ecaef6	9463c83b-d346-49c7-a81b-1df6c4f91653	8f37e3e5-6797-4424-b896-0b22f18aa1ca	2025-05-31 11:11:05.301411+00	\N	f
629142e7-efbf-4140-8c78-9a879fd3895a	48b74b22-45a2-469f-b4f8-f5e139ce7034	7b620092-8ff8-4fb7-818f-ae33a5ee2505	2025-06-23 08:12:56.948032+00	\N	f
5a649115-681e-4011-b335-c36adc5341f5	8fee6f29-7fbc-4964-af01-c34d92048cfe	92abdb81-2af9-40d8-a811-416cc1d019a8	2025-07-01 19:55:32.525788+00	\N	f
67f72d40-7369-40b7-b4bc-49d13a3d69b2	8fee6f29-7fbc-4964-af01-c34d92048cfe	87576484-dd27-4ef7-8552-72541437c5bf	2025-07-01 19:55:32.525788+00	\N	f
2731b629-1adb-41f1-8384-aae527b7a76b	c1dd6958-fdb6-4154-b63f-6137b8f23d74	0dcd5336-1442-4dcd-8cd9-fa3ec4bda131	2025-06-23 08:28:55.073445+00	\N	f
997e16ac-0a99-4a35-8724-de51e7090ffb	e6b965a6-6e09-461b-9d6a-022b533299c2	0dcd5336-1442-4dcd-8cd9-fa3ec4bda131	2025-06-23 08:28:29.875594+00	\N	f
9897afb5-2d5f-4f6c-93e2-f4f2a3a9e819	1f37dce9-4a9a-4df7-90ed-63f84b75e0bf	0dcd5336-1442-4dcd-8cd9-fa3ec4bda131	2025-06-23 08:27:38.278494+00	\N	f
08c801e2-3b89-4164-ae76-5b0e748e1eae	f24b7f85-3147-43a8-8f2c-e23bd45515d7	0dcd5336-1442-4dcd-8cd9-fa3ec4bda131	2025-06-23 08:28:06.151439+00	\N	f
a8c697e7-3e0f-475d-9384-d2fe04e2a2f0	46c2e658-1a0e-409a-a89f-0f3b20fe9eaa	49d23f46-08e9-47e6-8085-ebd75883fccb	2025-06-23 13:21:59.225537+00	\N	f
36654235-3b16-4aee-b966-b1d9b5a0fefe	b010bad8-f638-43e5-a385-bd491a739857	ccd8cfb6-dcbc-4ef4-93f1-d87be23625ca	2025-06-23 14:41:01.415401+00	\N	f
fd65961a-f3ad-492e-aaee-6d61729404ca	604d7243-7b8c-42da-9f7f-49a5c07467ec	63336d94-1e7c-4a7e-8ace-463b0cb62f7d	2025-06-04 01:04:16.235367+00	\N	f
9822ac99-132a-4140-b667-270ff6579730	604d7243-7b8c-42da-9f7f-49a5c07467ec	5f6b1c2c-72f9-494d-abff-a28c25dc26f6	2025-06-04 01:04:16.235367+00	\N	f
7840bf46-48b7-4bf2-8bb7-f2857c9fdde9	604d7243-7b8c-42da-9f7f-49a5c07467ec	006b1299-70d2-4c42-b7b8-de4ab40c5284	2025-06-04 01:04:16.235367+00	\N	f
2ec993e8-7e0d-462d-8cc8-7f0b05e07c86	604d7243-7b8c-42da-9f7f-49a5c07467ec	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	2025-06-10 01:31:11.355998+00	\N	f
171b8a18-c553-40e9-9fdd-380f086956e8	8daa0c10-519a-41cc-9095-385c33bdbdb2	91c68cc3-30b5-419d-8eb8-20930ebc1d16	2025-06-10 01:42:37.773817+00	\N	f
82fa39de-bb17-42a8-8df9-54b0d83dca9c	7afa3b89-beb7-4de7-9232-1f851a718204	91c68cc3-30b5-419d-8eb8-20930ebc1d16	2025-06-10 01:42:37.773817+00	\N	f
7a90823e-8552-4fe7-8f54-d50a25e564c5	4a7a13b9-c514-4013-b34f-f4451fb14911	91c68cc3-30b5-419d-8eb8-20930ebc1d16	2025-06-10 01:42:37.773817+00	\N	f
8e8f5391-7141-47aa-bfbd-9a56a5d0bce6	4693dd0c-adb9-4dd6-8fc4-1d9913ebd47d	91c68cc3-30b5-419d-8eb8-20930ebc1d16	2025-06-10 01:42:37.773817+00	\N	f
3ec7e72f-21f2-4cc4-9fee-b938abd83fa7	5cbeb745-5005-47f5-b063-2ff3429582c9	386a08a4-aaa6-4c07-a6e7-3c2168055d21	2025-06-12 14:15:17.541029+00	\N	f
c9dd97bc-07b8-425a-bc1e-4124dcd2c080	ba8f531e-e275-4d68-b595-d0e85aba02a6	386a08a4-aaa6-4c07-a6e7-3c2168055d21	2025-06-12 14:15:17.541029+00	\N	f
cc3c431d-12a3-46b9-970b-fe16ee182285	624a6c5a-5451-4773-b5a0-0dd9d39d77d8	386a08a4-aaa6-4c07-a6e7-3c2168055d21	2025-06-12 14:15:17.541029+00	\N	f
4306847f-3a36-43a9-9cfd-8ad368d4ca1b	d423da9d-02d8-43d6-b6ea-2368c7b88431	6d5f176c-f1df-4d4c-9fc9-a90d40d5f67c	2025-06-12 17:57:31.827514+00	\N	f
dc0a141a-f567-4edf-aab1-59e3572367d0	ab7a260f-bfeb-4548-8f06-864478f3ca1b	6d5f176c-f1df-4d4c-9fc9-a90d40d5f67c	2025-06-12 17:57:54.417528+00	\N	f
3f4a899a-1475-43ed-9f09-f5b9913bbe9c	88639204-122a-44bf-b912-d18cb723b2e6	6d5f176c-f1df-4d4c-9fc9-a90d40d5f67c	2025-06-12 17:58:27.197933+00	\N	f
68f874c8-ef32-4849-89aa-c217951aeabb	d6b80448-e951-4319-9c7b-d9a1087e9659	6d5f176c-f1df-4d4c-9fc9-a90d40d5f67c	2025-06-12 17:58:58.273154+00	\N	f
09d6941e-17df-42fb-ac1f-4dc974e53935	d7168cd8-5d59-45b1-ba34-936a87592937	0ebe5efb-2328-47a3-ac7f-ab2bcb5a0c95	2025-06-16 14:12:30.09742+00	\N	f
2fcd6706-fc86-4ccd-b12b-d7659c02e169	c14f4925-4810-4783-82b8-4548c36ea659	0ebe5efb-2328-47a3-ac7f-ab2bcb5a0c95	2025-06-16 14:12:30.09742+00	\N	f
9502b9b7-33ff-4011-bbbe-22cca16ea1e3	3c14c0c8-9caf-4a03-9d92-4b931d4909c9	0ebe5efb-2328-47a3-ac7f-ab2bcb5a0c95	2025-06-16 14:12:30.09742+00	\N	f
52c4f533-5e31-4492-8a10-1e960bda3175	8a573470-d76e-4ca8-8c45-9915ae565655	0ebe5efb-2328-47a3-ac7f-ab2bcb5a0c95	2025-06-16 14:12:30.09742+00	\N	f
d89f510b-3535-4c89-b3d4-87628fe0dd57	5cbeb745-5005-47f5-b063-2ff3429582c9	a421669e-1ec9-4ef8-bf1d-ecc94d2075fc	2025-06-17 07:00:38.899763+00	\N	f
05705971-19f3-46a9-afc8-34e8bb58c60c	ba8f531e-e275-4d68-b595-d0e85aba02a6	a421669e-1ec9-4ef8-bf1d-ecc94d2075fc	2025-06-17 07:00:38.899763+00	\N	f
768437a1-14ea-42b6-b148-8a832805edd6	624a6c5a-5451-4773-b5a0-0dd9d39d77d8	a421669e-1ec9-4ef8-bf1d-ecc94d2075fc	2025-06-17 07:00:38.899763+00	\N	f
\.


--
-- TOC entry 3693 (class 2606 OID 17432)
-- Name: product_printers product_printers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_printers
    ADD CONSTRAINT product_printers_pkey PRIMARY KEY (id);


--
-- TOC entry 3695 (class 2606 OID 17434)
-- Name: product_printers product_printers_product_id_printer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_printers
    ADD CONSTRAINT product_printers_product_id_printer_id_key UNIQUE (product_id, printer_id);


--
-- TOC entry 3690 (class 1259 OID 17447)
-- Name: idx_product_printers_printer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_printers_printer_id ON public.product_printers USING btree (printer_id);


--
-- TOC entry 3691 (class 1259 OID 17446)
-- Name: idx_product_printers_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_printers_product_id ON public.product_printers USING btree (product_id);


--
-- TOC entry 3696 (class 2606 OID 17440)
-- Name: product_printers product_printers_printer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_printers
    ADD CONSTRAINT product_printers_printer_id_fkey FOREIGN KEY (printer_id) REFERENCES public.printers(id) ON DELETE CASCADE;


--
-- TOC entry 3697 (class 2606 OID 17435)
-- Name: product_printers product_printers_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_printers
    ADD CONSTRAINT product_printers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 3846 (class 3256 OID 54137)
-- Name: product_printers Enable delete access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for all users" ON public.product_printers FOR DELETE USING (true);


--
-- TOC entry 3847 (class 3256 OID 54135)
-- Name: product_printers Enable insert access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for all users" ON public.product_printers FOR INSERT WITH CHECK (true);


--
-- TOC entry 3848 (class 3256 OID 54134)
-- Name: product_printers Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.product_printers FOR SELECT USING (true);


--
-- TOC entry 3849 (class 3256 OID 54136)
-- Name: product_printers Enable update access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for all users" ON public.product_printers FOR UPDATE USING (true);


--
-- TOC entry 3845 (class 0 OID 17426)
-- Dependencies: 280
-- Name: product_printers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_printers ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:33:14 UTC

--
-- PostgreSQL database dump complete
--

