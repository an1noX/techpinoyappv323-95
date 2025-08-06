--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:32:26 UTC

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
-- TOC entry 278 (class 1259 OID 17383)
-- Name: client_price_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_price_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_client_id uuid NOT NULL,
    price numeric NOT NULL,
    margin_percentage numeric DEFAULT 0,
    note text,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3846 (class 0 OID 17383)
-- Dependencies: 278
-- Data for Name: client_price_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_price_history (id, product_client_id, price, margin_percentage, note, "timestamp") FROM stdin;
cca0330a-08b6-48f3-b556-1328417c23ca	f06dd844-d491-4f29-a597-3d26a3aa40f3	1200	0	Initial quote	2025-05-31 01:08:52.787442+00
6c975dbf-f635-4bc0-8f75-c82a2f9eb8ec	8ecbac28-c874-450e-b469-86d07f9ec948	1500	0	Initial quote	2025-05-31 08:14:56.965182+00
8ea9c1a5-331b-4583-88bf-3feab119b748	0495935e-01fe-4e7f-acd6-7d6ee449ae79	1300	0	Initial quote	2025-05-31 08:14:57.187194+00
1004e6d2-4600-4a7d-b82a-037933fb67c0	53aa04fb-796e-46cd-939d-f35f5bb99252	1200	0	Initial quote	2025-05-31 08:14:57.779127+00
b0afca7c-14bf-40b0-9e7c-219b0cdc1a21	e35b3efe-f4c9-4bc4-a35e-cdf76fc2a910	4300	0	Initial quote	2025-05-31 08:14:58.113088+00
3edabce3-8306-4a0e-b939-defa8b7c117b	fee49c6c-dfbf-48c4-8521-764b74a075f0	3300	0	Initial quote	2025-05-31 08:14:58.445164+00
cef5e598-3afb-4687-8272-070a540ee767	bfd3e491-76a6-4c75-9332-36205ab46a8e	3300	0	Initial quote	2025-05-31 08:14:58.777757+00
a2326027-8175-46e1-8680-1cc3475742df	1fa043f4-dc1c-4430-a567-dbd034002fae	3300	0	Initial quote	2025-05-31 08:14:59.097373+00
892b9a65-6e0f-44dd-8590-3cc7559de3ce	d3ffc6cf-388e-418d-892a-20103453dcf4	3300	0	Initial quote	2025-05-31 08:15:00.163123+00
a1783c7f-f658-431a-aa3f-598693a9a9dd	6133d146-1435-450f-8244-d18c87a9d009	3000	0	Initial quote	2025-05-31 08:15:02.028507+00
a6e85031-1aa4-453c-87a5-929f4418c502	41ee7f9f-29d6-48fc-abcf-abb006e7a61e	3500	0	Initial quote	2025-05-31 08:15:02.267045+00
7420d298-0b21-4674-93e4-91edaa9a1341	ed3f06f7-dde0-4ee5-83a0-4f4d4bb1d2dc	3000	0	Initial quote	2025-05-31 08:15:02.615102+00
510d235c-254e-40cd-b450-b2484dcf3aba	59cf44a3-ce79-4fbf-9447-a0020cbe25cf	3500	0	Initial quote	2025-05-31 08:15:02.837985+00
1107d3ea-1c6e-4576-96b1-c58bf2bec080	8b010f1e-7e78-46dc-a064-7ad2dbe4f9d5	2000	0	Initial quote	2025-05-31 08:15:07.428834+00
272740a4-7378-4ee6-95f6-c8a087cef7c0	c7dc75d9-a26d-48ab-8a22-b5ee9ad12ecd	1500	0	Initial quote	2025-05-31 08:15:07.627691+00
2d129f2f-b176-46a3-a5e6-a8a69ef229cc	726e9c91-e764-45ec-97c3-2753e428cfdc	2000	0	Initial quote	2025-05-31 08:15:09.267807+00
8562f923-4033-487b-91ed-a9e390d78020	8f04539e-e4b2-481d-ba6f-beb960642c45	1500	0	Initial quote	2025-05-31 08:15:09.429053+00
f43b569c-dd1f-4828-814d-c6f64bdb482e	0a6d1a16-6627-46b3-ab17-9f006ae4aabc	1500	0	Initial quote	2025-05-31 08:15:09.598792+00
675447c2-73c3-4bc1-a385-b62df4afc183	e8153509-0683-471d-8b00-f0b81ac55f34	1200	0	Initial quote	2025-05-31 08:15:09.758052+00
71875f7c-8b12-42d9-98d0-0f4bd4975b29	9131f107-e83e-488b-9e14-583536b36ca7	1500	0	Initial quote	2025-05-31 08:15:09.94345+00
72ccb489-e48c-49a5-afdd-4e7fb1daba02	1e2235d0-21dc-4df3-9b3b-eec9fefeec3b	2000	0	Initial quote	2025-05-31 08:15:10.250671+00
33633d9f-0d8d-4607-840e-1715ab29ae54	cc53dcbe-f62a-460f-bef4-ee82426ef04a	3000	0	Initial quote	2025-05-31 08:15:10.435686+00
a52b3751-5e55-4644-bd68-962e5c8c8519	dc32cfff-be19-4092-9c96-941cd0c7bafa	2500	0	Initial quote	2025-05-31 08:15:10.928376+00
d2de8004-bbaa-4b53-8b70-247c5efcf1b7	37caefce-6379-4fbd-968a-7cefb4233454	3500	\N	Initial quote	2025-06-19 02:51:35.779766+00
ec209645-ef6b-4825-ba07-e57c9c034657	8b0d62f2-3ea0-48b0-a950-d62a9cc39686	3500	0	Initial quote	2025-06-19 03:04:43.20795+00
220852e5-dd77-49de-a34e-51630031fde3	63488f0a-c244-4a23-aa26-ca8a4c9fa69f	3500	0	Initial quote	2025-06-19 03:04:43.929655+00
a89f6494-e0b9-4ac8-b3bb-c270afd03162	6d42c22f-c943-48be-acb7-f35488914da8	2500	0	Initial quote	2025-06-19 03:04:45.047546+00
a54cea0b-b83b-4839-9bb6-14f8f1a7546e	9f60790b-a1c6-4da4-bdf9-0e369197f64d	4300	0	Initial quote	2025-06-19 03:04:56.393106+00
63d026c2-dabf-49c6-9301-3dc6c1754f36	1c021049-8b4c-407e-a7b7-88b14ec2b85b	3300	0	Initial quote	2025-06-19 03:04:56.872213+00
236a45d9-addd-471d-8fe2-63640786f05c	5dd9d3ca-a6eb-4919-9023-fe7448a27a83	3300	0	Initial quote	2025-06-19 03:04:57.265618+00
23501549-645f-4c60-aa49-03682c99606c	34c8e38f-cc0e-4323-b69c-e4cad42de270	3000	0	Initial quote	2025-06-19 03:05:05.24465+00
30916cfa-a28a-48c0-90f2-66bd16871a33	3ac9d290-2576-447f-b49e-1b9f5552864a	1200	0	Initial quote	2025-06-19 03:05:06.166282+00
ba338fec-f82e-4f10-8b42-6184d9eda470	c69b553b-63c2-4f12-92f8-031e2ee6718d	1500	0	Initial quote	2025-06-19 03:05:08.331031+00
9c4c4820-a0b1-4e01-bf03-dc878e395ef2	efb4696c-a67d-4930-a3ac-cb37de18e58f	1200	0	Initial quote	2025-06-19 03:05:08.812526+00
3da23cb9-cace-4fcb-8288-ef4d2407f0a5	a6151ad0-1ac0-4b24-b94c-619cfb44057c	3000	0	Initial quote	2025-06-19 03:05:17.763661+00
5ffc4090-79c6-4be6-a726-541c93676fc6	1e8ef496-9f4f-4919-9acf-6115edebfbdc	3000	0	Initial quote	2025-06-19 03:05:18.129562+00
e54fadcc-bc29-466e-9176-e792f9a240ed	352119b4-5c5e-43e2-ae74-9ce3d2798236	2000	0	Initial quote	2025-06-19 03:05:31.453094+00
849981ec-2d77-47e9-8e2a-6d7585664b10	6fbd0dcf-6d16-4895-bc7e-a8c9f4b7f467	3000	0	Initial quote	2025-06-19 03:05:33.334661+00
3d54aaa7-e2df-4457-a51e-b51c5b153f5c	ccb975e1-772c-43c9-98d1-59bcde5ca869	1500	0	Initial quote	2025-06-19 03:05:35.703348+00
b1ec455f-7721-4d1f-86e0-797551fb3b08	a115c0cd-49cf-4e36-a4f3-ca0bdebc970f	3000	0	Initial quote	2025-06-19 03:05:18.557233+00
57a073a7-408b-49eb-98a2-9f7904547981	dab3b0d4-4f69-4035-a12d-1f69c6787003	1500	0	Initial quote	2025-06-19 03:05:21.838768+00
b776c11b-34f5-44df-85fb-517bb0bfe718	fd37105f-36b1-428b-9132-b69596c2522f	1200	0	Initial quote	2025-06-19 03:05:22.832625+00
ac85b8ff-9567-4cda-aec8-27cdbbc7caf6	67d496d2-9c64-443f-a658-ec53c44a433f	3200	0	Initial quote	2025-06-19 03:05:35.140223+00
24bd6154-b2f9-4094-8970-3d6754146db2	0d97eac5-23ec-49e0-af33-920f17587b69	3000	0	Initial quote	2025-06-19 03:05:32.946273+00
13b5d7e1-1cfc-40fc-b10f-d32f06f76aa5	811418d7-4737-4285-ad52-95f14522e7bf	3000	0	Initial quote	2025-06-19 03:48:03.004068+00
5ff7acab-b011-41c8-a551-42b8f2ee46a9	65a7be59-8a11-4755-b0e4-d9739e350aac	1500	0	Initial quote	2025-06-19 03:52:19.294305+00
0e3c5b36-59ec-4f55-ac8d-fae25d14f7a6	472a7d38-24d2-493f-89a0-bdfaab94faaf	1500	0	Initial quote	2025-06-19 03:52:19.557221+00
848bef33-3c22-4454-8034-2f564d49a20a	57993d92-b39e-4700-b7f1-4e1893e0d23d	3000	0	Initial quote	2025-06-19 04:46:53.370832+00
e44d3def-fd94-429c-abee-5edb4d705948	32859539-7094-44cc-aa00-38ebd2cebe6e	1500	0	Initial quote	2025-06-19 04:53:05.384787+00
d8b28e29-5691-4f36-8bae-2e30ab57d8e8	0b00de2b-a538-4539-8a8f-b51d95b6be18	3500	0	Initial quote	2025-06-19 04:53:05.648063+00
18bddfcf-7116-4a52-8a3d-88f43cdaddf2	40600925-4a88-471b-8929-fb88d82bfc63	1200	0	Initial quote	2025-06-19 04:53:05.935276+00
64200052-617e-4b29-88cf-683ef093e6fd	762c173c-07a1-4329-8aa1-57f22980b5f0	3000	0	Initial quote	2025-06-19 04:54:08.379073+00
a1b83a87-ba3b-4e97-8608-460f38bb45f5	cbfe068b-376c-431f-9b7a-c6345495c7cd	3000	0	Initial quote	2025-06-22 17:43:39.556892+00
d8ac20d7-bbab-4422-bb9f-4f5e5b79ab15	96eb8c9d-31c9-48f7-9de3-fb6d543147a6	3000	0	Initial quote	2025-06-22 17:43:56.306267+00
9724870e-930a-4cfb-912b-a3be4acbe9f1	13a82ed9-ef64-4391-b9fd-69f478e73d66	3000	0	Initial quote	2025-06-22 17:44:12.514337+00
297b693e-f17f-4794-95e0-a0baf2ee89b8	e5ab2d3d-4db8-442a-bfb1-a5bb10155888	3000	0	Initial quote	2025-06-22 17:44:25.948345+00
da09a3ff-67bb-4deb-ad73-814f5a1d6ffa	d4ab9d4d-2abc-4471-8bfa-5d1fe4b826a1	1500	0	Initial quote	2025-06-23 13:45:33.992032+00
b5ec8941-2d2f-4e6b-aa17-d261cd7785a0	3fac1081-9027-412c-9612-ca47d3055f1c	7500	0	Initial quote	2025-06-23 14:41:29.705759+00
ae5aef85-b3e1-4df0-8f94-06ce43cda063	d7a2cacc-a055-4870-a0d9-b3f45369e427	7500	0	Initial quote	2025-06-23 17:21:05.940994+00
a84a7102-8f4d-4028-91dd-7be6907fe7de	38af4a03-a9e8-4929-a201-5f43ee72727e	7500	0	Initial quote	2025-06-23 17:21:09.663605+00
7844b111-380c-4c9b-bd3e-9c37d6433544	5f8c4d68-c5f1-458e-b8a6-f2f0004624bb	7500	0	Initial quote	2025-06-23 17:21:12.725379+00
a8a162a8-321a-42f1-b256-8c35f1e3baaf	105826c6-0670-4d4b-800b-b4c1de4c485f	8500	0	Initial quote	2025-06-23 17:21:16.989245+00
0c26c80d-7258-47b0-85f5-04dff96486a2	eb68685b-6e81-4d15-8261-13bca7198b11	3000	0	Initial quote	2025-06-24 05:18:24.170301+00
78d6a334-c383-4331-8ab0-2b5ae13e192d	cda3c572-5d8c-4681-bccc-fdecb62d6277	3000	0	Initial quote	2025-06-24 05:18:28.175834+00
f260b038-1e92-4e4d-821a-f3a400610fec	e32c7c81-1b16-4551-af27-ebc1f64a6360	3000	0	Initial quote	2025-06-24 05:18:32.291526+00
1190f481-3d43-435b-84f3-1429cba20f74	727b7eb5-8735-499c-bb2f-3fe5614f3aec	3000	0	Initial quote	2025-07-01 20:36:23.478934+00
ff6a21c0-9283-48a1-8982-50709c2bb9d3	714b75de-7de0-4c93-afd4-014fbeb407a0	3000	0	Initial quote	2025-07-01 20:36:52.28546+00
d825bf04-9bbd-4fb4-951c-333a662d3413	81e45834-f052-4a47-a92c-c59d59649009	3000	0	Initial quote	2025-07-01 20:38:04.21977+00
a9a00399-2eaa-4b85-88ab-f7e96e720d13	217a58dd-7624-40b4-9da6-1aeaf70f04b3	3000	0	Initial quote	2025-07-01 20:38:04.21977+00
d1fb2cd3-d7eb-4671-b06a-1357e2b3eb2c	b63325d3-3540-47d5-a69d-479cd876f110	1200	0	Initial quote	2025-07-01 20:47:40.627187+00
\.


--
-- TOC entry 3691 (class 2606 OID 17392)
-- Name: client_price_history client_price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_price_history
    ADD CONSTRAINT client_price_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3692 (class 2606 OID 17393)
-- Name: client_price_history client_price_history_product_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_price_history
    ADD CONSTRAINT client_price_history_product_client_id_fkey FOREIGN KEY (product_client_id) REFERENCES public.product_clients(id) ON DELETE CASCADE;


--
-- TOC entry 3841 (class 3256 OID 17413)
-- Name: client_price_history Enable delete access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for all users" ON public.client_price_history FOR DELETE USING (true);


--
-- TOC entry 3842 (class 3256 OID 17411)
-- Name: client_price_history Enable insert access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for all users" ON public.client_price_history FOR INSERT WITH CHECK (true);


--
-- TOC entry 3843 (class 3256 OID 17410)
-- Name: client_price_history Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.client_price_history FOR SELECT USING (true);


--
-- TOC entry 3844 (class 3256 OID 17412)
-- Name: client_price_history Enable update access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for all users" ON public.client_price_history FOR UPDATE USING (true);


--
-- TOC entry 3840 (class 0 OID 17383)
-- Dependencies: 278
-- Name: client_price_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_price_history ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:32:28 UTC

--
-- PostgreSQL database dump complete
--

