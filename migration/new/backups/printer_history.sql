--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:01 UTC

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
-- TOC entry 282 (class 1259 OID 18602)
-- Name: printer_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.printer_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    printer_id uuid NOT NULL,
    action_type text NOT NULL,
    description text NOT NULL,
    performed_by text,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    related_assignment_id uuid
);


--
-- TOC entry 3842 (class 0 OID 18602)
-- Dependencies: 282
-- Data for Name: printer_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.printer_history (id, printer_id, action_type, description, performed_by, "timestamp", related_assignment_id) FROM stdin;
14f39932-624f-4b3d-b67a-8ad50642aeac	92abdb81-2af9-40d8-a811-416cc1d019a8	removed	Assignment removed from department: Library	System User	2025-06-15 08:06:35.905428+00	a8c2a83c-e50f-45ab-b107-5def9dd1fec1
cee3fd4d-013b-47b9-b20b-6d95c6cda5ed	92abdb81-2af9-40d8-a811-416cc1d019a8	updated	Assignment updated: Library Light House	System User	2025-06-16 12:43:40.406587+00	a8c2a83c-e50f-45ab-b107-5def9dd1fec1
1cda53f5-ba94-4e2f-ad63-50adff661226	92abdb81-2af9-40d8-a811-416cc1d019a8	transferred	Transferred from "Library Light House" to "Library MPC"	System User	2025-06-16 13:49:14.197707+00	d6a56cf6-6796-4bb8-bfdd-78e2422ee9bc
07f24b4c-b103-4fb6-91d6-c30a57d3232d	8f37e3e5-6797-4424-b896-0b22f18aa1ca	removed	Assignment removed from department: Library MPC	System User	2025-06-16 13:53:22.313595+00	83e8deb9-2d14-4fa4-8122-3e3fc44c3d47
29b44935-d6df-42ab-ae30-4dcaa21999af	92abdb81-2af9-40d8-a811-416cc1d019a8	removed	Assignment removed from department: Library MPC	System User	2025-06-16 13:53:45.247075+00	d6a56cf6-6796-4bb8-bfdd-78e2422ee9bc
922df165-1ff5-46ae-84c5-dadeb3119f8e	0ebe5efb-2328-47a3-ac7f-ab2bcb5a0c95	removed	Assignment removed from department: Admin Main Office	System User	2025-06-16 14:33:53.596052+00	b4ebcf55-ec80-4157-8d73-5ee469032791
8fcab67c-2f29-410a-b35c-21814ee216fb	0ebe5efb-2328-47a3-ac7f-ab2bcb5a0c95	removed	Assignment removed from department: Main Office	System User	2025-06-16 14:51:33.242102+00	c650a9b8-67ea-4430-9047-ac63889f5b66
3adc135d-9add-40b6-aa48-4ed17cc5e75e	0dcd5336-1442-4dcd-8cd9-fa3ec4bda131	removed	Assignment removed from department: CRC Main Office	System User	2025-06-16 15:05:37.133157+00	aedc6457-d5a2-459c-9651-60e7064c4bea
58b2f0db-a140-4cce-ad64-9eb74b2ab33f	92abdb81-2af9-40d8-a811-416cc1d019a8	removed	Assignment removed from department: Library	System User	2025-06-16 15:10:48.510169+00	43e638ee-7069-48fa-b48d-bc950415a92e
12938617-e18e-4702-a2d2-c89e09c42cf6	8f37e3e5-6797-4424-b896-0b22f18aa1ca	transferred	Printer unassigned from location "bemo main" due to location removal.	System User	2025-06-16 17:39:47.137194+00	3de1af79-95f5-4901-8240-91cf8cec11b2
5a1e34d9-fb46-4c65-ac91-e6820bf8922b	8f37e3e5-6797-4424-b896-0b22f18aa1ca	transferred	Printer unassigned from location "TEST3 test4" due to location removal.	System User	2025-06-16 17:39:58.687125+00	30609301-813f-4b1e-b131-9176e7d48dd0
5996acdd-2492-424a-b340-c788982280dd	cf8956a6-1c2e-48d2-aabb-62dcd40a3a8c	transferred	Printer unassigned from location "Library Light House" due to location removal.	System User	2025-06-16 17:40:04.281922+00	841e46e6-7ce4-4ab7-9879-793a79ec65e3
d8aee133-256b-482e-8d44-1c4e76da777d	8f37e3e5-6797-4424-b896-0b22f18aa1ca	transferred	Assignment removed from location:  - 	System User	2025-06-16 17:45:51.797814+00	3de1af79-95f5-4901-8240-91cf8cec11b2
e0c9eb26-5a28-44ad-aea6-3bbb7dc0486c	8f37e3e5-6797-4424-b896-0b22f18aa1ca	transferred	Assignment removed from location:  - 	System User	2025-06-16 17:45:54.093034+00	30609301-813f-4b1e-b131-9176e7d48dd0
4ea95140-7b2c-4ba1-8fa9-1653bbc9572f	cf8956a6-1c2e-48d2-aabb-62dcd40a3a8c	transferred	Assignment removed from location:  - 	System User	2025-06-16 17:45:56.251139+00	841e46e6-7ce4-4ab7-9879-793a79ec65e3
7a18312f-b722-4289-9f13-39f691c242fc	92abdb81-2af9-40d8-a811-416cc1d019a8	transferred	Assignment removed from location: Library - MPC	System User	2025-06-16 17:46:11.8521+00	3f257ca5-a4a8-4ef2-995a-aa8948ea94ff
08615b16-6d1b-48ee-94ab-85f56ff45169	8f37e3e5-6797-4424-b896-0b22f18aa1ca	removed	Assignment removed from department: Library - Light House	System User	2025-06-17 04:48:46.586474+00	afa9bcb2-bea4-4a57-b85e-efc21e843984
ec3393f2-02ca-4783-962c-acf7f3ee3662	8f37e3e5-6797-4424-b896-0b22f18aa1ca	removed	Assignment removed from department: Library - MPC	System User	2025-06-17 04:48:49.816254+00	18bce2b2-b706-402c-af18-f3c178e5b353
00f0c2c6-0550-4c4d-85b1-ad4181c811bb	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	transferred	Transferred to department: Test Department - Test Location1	System User	2025-06-17 07:50:18.123702+00	7997c3ec-63aa-4761-8c8a-b706a50a1ee9
ab45ceea-3674-42c1-8c9a-c3424a8c9603	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	transferred	Transferred to department: Test Department - Test Location2	System User	2025-06-17 07:51:25.610308+00	7997c3ec-63aa-4761-8c8a-b706a50a1ee9
082b34d0-e47e-48da-b946-86d8d409fc2e	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	transferred	Transferred to department: Test Department - Test Location1	System User	2025-06-17 07:53:52.588974+00	7997c3ec-63aa-4761-8c8a-b706a50a1ee9
56d79de5-be6f-4638-937a-77536f729dc1	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	transferred	Transferred to department: Test Department - Test Location2	System User	2025-06-17 07:57:42.592786+00	7997c3ec-63aa-4761-8c8a-b706a50a1ee9
9452eeb4-eba2-4b71-ae1e-445d6ab75d49	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	transferred	Transferred to department: Test Department - Test Location1	System User	2025-06-17 07:58:54.264722+00	7997c3ec-63aa-4761-8c8a-b706a50a1ee9
58efd7c8-67e0-442b-bad9-fe6ab0ca4849	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	transferred	Transferred to department: Test Department - Test Location2	System User	2025-06-17 08:18:00.923441+00	7997c3ec-63aa-4761-8c8a-b706a50a1ee9
9b3b25c1-8547-4211-928f-c723fb70cdad	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	maintenance	Maintenance: Replaced on Drumkit, Fuser Assembly, Toner	System User	2025-06-17 13:17:32.944407+00	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af
5ec30d99-68ca-4391-b6e1-cd1f5bca03ab	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af	maintenance	Maintenance: Replaced on Fuser Assembly	System User	2025-06-17 13:48:06.810461+00	830a19f7-f4d3-41cf-8bc2-8d7a9ee535af
3f6747b5-da65-4509-bba3-7e775798ea49	8f37e3e5-6797-4424-b896-0b22f18aa1ca	removed	Assignment removed from department: Admission Main Office	System User	2025-06-19 12:18:55.055114+00	bedca245-9ef5-4bbc-9594-3107f85d3cf3
c89c4e0d-9b6e-4581-a68a-83a77cc40f21	ebce9078-34b7-4ecc-b570-1192380ef485	transferred	Transferred to department: Admission Main Office	System User	2025-06-30 21:36:14.63228+00	e512e080-9109-47c6-9f74-d1475c9dcb2e
bc2befe1-44d8-4add-a67c-130c5271cbee	ebce9078-34b7-4ecc-b570-1192380ef485	transferred	Transferred to department: - Client Owned Printers Office	System User	2025-06-30 21:36:31.603417+00	e512e080-9109-47c6-9f74-d1475c9dcb2e
57df8234-37e1-452e-af6d-49d3741f3dc4	a7adb9e7-e6cc-4ced-b4fd-486f6fa5dba4	transferred	Transferred to department: Admission Main Office	System User	2025-07-01 05:55:04.15054+00	ead4f414-de8f-4c8e-ab00-d9edff3e0a49
ce3897fd-379f-4fe6-8165-a0f6d3392b3b	92abdb81-2af9-40d8-a811-416cc1d019a8	updated	Serial number updated to: 123	Admin User	2025-07-08 21:56:46.62357+00	51974248-17ae-4176-b0cc-240b704a84a6
\.


--
-- TOC entry 3692 (class 2606 OID 18611)
-- Name: printer_history printer_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_history
    ADD CONSTRAINT printer_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3689 (class 1259 OID 18645)
-- Name: idx_printer_history_printer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_printer_history_printer_id ON public.printer_history USING btree (printer_id);


--
-- TOC entry 3690 (class 1259 OID 18646)
-- Name: idx_printer_history_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_printer_history_timestamp ON public.printer_history USING btree ("timestamp");


--
-- TOC entry 3693 (class 2606 OID 18612)
-- Name: printer_history printer_history_printer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_history
    ADD CONSTRAINT printer_history_printer_id_fkey FOREIGN KEY (printer_id) REFERENCES public.printers(id) ON DELETE CASCADE;


-- Completed on 2025-07-14 11:33:04 UTC

--
-- PostgreSQL database dump complete
--

