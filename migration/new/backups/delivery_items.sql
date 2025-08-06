--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:28 UTC

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
-- TOC entry 332 (class 1259 OID 65628)
-- Name: delivery_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    delivery_id uuid NOT NULL,
    product_id uuid,
    quantity_delivered integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT delivery_items_quantity_delivered_check CHECK ((quantity_delivered > 0))
);


--
-- TOC entry 3845 (class 0 OID 65628)
-- Dependencies: 332
-- Data for Name: delivery_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_items (id, delivery_id, product_id, quantity_delivered, created_at) FROM stdin;
5b00be21-0d8a-4b44-9b61-53e3b11d2de7	4cffbc6f-bf4b-4c81-8733-c1bfb1c4d197	f24b7f85-3147-43a8-8f2c-e23bd45515d7	2	2025-07-11 22:03:15.859234+00
d5a729d4-4bb0-4450-bfa6-06cacbcc75fe	4cffbc6f-bf4b-4c81-8733-c1bfb1c4d197	f8527963-984c-44d4-bef8-bcb64141fc37	1	2025-07-11 22:03:15.859234+00
81904691-a9ae-480f-91d7-dbeb15eb2720	4cffbc6f-bf4b-4c81-8733-c1bfb1c4d197	c1dd6958-fdb6-4154-b63f-6137b8f23d74	1	2025-07-11 22:03:15.859234+00
1fad1e6a-a8f3-4081-bd2f-ace378956818	4cffbc6f-bf4b-4c81-8733-c1bfb1c4d197	002f1f73-bedd-48da-9f6e-078f32c37ad9	3	2025-07-11 22:03:15.859234+00
e0538b3e-ed4b-42c1-be7f-675713401402	4cffbc6f-bf4b-4c81-8733-c1bfb1c4d197	e6b965a6-6e09-461b-9d6a-022b533299c2	1	2025-07-11 22:03:15.859234+00
90f9cf0e-a134-4bca-8eca-89224044be5a	4cffbc6f-bf4b-4c81-8733-c1bfb1c4d197	36f9fdd7-8d20-4d2b-ad9c-6ca9a96ae570	3	2025-07-11 22:03:15.859234+00
3a273965-8f72-43a3-a64a-6159911952fe	4cffbc6f-bf4b-4c81-8733-c1bfb1c4d197	9063199d-fd74-4cc7-83b2-c79595259539	1	2025-07-11 22:03:15.859234+00
1531256f-c9e3-44ea-af9b-74f58faac561	0d36e33f-1e59-4686-a3d1-e51d1292134d	f5051a8a-645b-4365-a1b0-37987b8a67e2	3	2025-07-11 22:04:54.394663+00
16b8c532-62db-48fd-9aed-df20fa97542c	0d36e33f-1e59-4686-a3d1-e51d1292134d	8fee6f29-7fbc-4964-af01-c34d92048cfe	5	2025-07-11 22:04:54.394663+00
a99faf09-0a24-480c-9dc5-3b8d7d16a12b	0d36e33f-1e59-4686-a3d1-e51d1292134d	1f37dce9-4a9a-4df7-90ed-63f84b75e0bf	3	2025-07-11 22:04:54.394663+00
d3f80b7f-44b7-473e-8eb7-d92e3ed452bf	0d36e33f-1e59-4686-a3d1-e51d1292134d	9463c83b-d346-49c7-a81b-1df6c4f91653	3	2025-07-11 22:04:54.394663+00
e5c133e4-81c4-45f7-add7-bb5f129c2e88	1756d2d0-9f8e-49b2-bfc6-e9a743033ec8	28faa43a-a858-482f-acd1-df94e8ddc9eb	3	2025-07-11 22:05:53.010154+00
3abcdd89-9284-4f72-932c-fee753264eb0	382b8f4a-416d-4c78-9d7a-488eeb21680e	8fee6f29-7fbc-4964-af01-c34d92048cfe	3	2025-07-11 22:28:45.431414+00
80d1700e-4538-4c93-a40a-4e33b9443d01	3a1652cc-13a2-4446-b61a-d50db0dbf414	8fee6f29-7fbc-4964-af01-c34d92048cfe	2	2025-07-11 22:28:45.62574+00
9ee98486-a2e1-4797-9256-9e96ac641177	4923c5db-ed48-4d37-b5a2-677d34c41067	f5051a8a-645b-4365-a1b0-37987b8a67e2	1	2025-07-11 22:28:45.851428+00
1f82e454-dba9-433e-ada8-8a07f06e98eb	ffe5b348-dd8b-4419-b86d-e01bb95e787f	f24b7f85-3147-43a8-8f2c-e23bd45515d7	1	2025-07-11 22:28:46.032386+00
1a1d8468-fda6-4ad3-9013-6d1da45c5fbe	ffe5b348-dd8b-4419-b86d-e01bb95e787f	c1dd6958-fdb6-4154-b63f-6137b8f23d74	1	2025-07-11 22:28:46.032386+00
7383adb1-acc9-4c27-9705-2961f81c8195	ffe5b348-dd8b-4419-b86d-e01bb95e787f	1f37dce9-4a9a-4df7-90ed-63f84b75e0bf	1	2025-07-11 22:28:46.032386+00
eeaefadd-063a-4ed6-87d3-6cb77180372d	ffe5b348-dd8b-4419-b86d-e01bb95e787f	e6b965a6-6e09-461b-9d6a-022b533299c2	1	2025-07-11 22:28:46.032386+00
9a59de13-6036-411a-972c-1abb27330da0	cd1ea371-9e79-479f-bf99-1858188e54ab	e6b965a6-6e09-461b-9d6a-022b533299c2	2	2025-07-11 22:28:46.189571+00
6acdf1a8-c143-4614-8f14-3eb55e13f143	cd1ea371-9e79-479f-bf99-1858188e54ab	c1dd6958-fdb6-4154-b63f-6137b8f23d74	2	2025-07-11 22:28:46.189571+00
00adb556-55e4-4bac-b490-c45a14e1b698	cd1ea371-9e79-479f-bf99-1858188e54ab	ba8f531e-e275-4d68-b595-d0e85aba02a6	2	2025-07-11 22:28:46.189571+00
8b0639a1-233e-4c72-91f0-a037352c5f14	cd1ea371-9e79-479f-bf99-1858188e54ab	5cbeb745-5005-47f5-b063-2ff3429582c9	1	2025-07-11 22:28:46.189571+00
4740d54e-0b09-49c2-a859-0341ca369f68	cd1ea371-9e79-479f-bf99-1858188e54ab	e1b114a2-4f90-4ed2-b9c7-f6688bfbdfd8	2	2025-07-11 22:28:46.189571+00
f5d1dd5e-e394-48ac-b404-3148d492b734	cd1ea371-9e79-479f-bf99-1858188e54ab	624a6c5a-5451-4773-b5a0-0dd9d39d77d8	2	2025-07-11 22:28:46.189571+00
b61e480e-15cb-40a1-acb2-2027c2ce7caa	cd1ea371-9e79-479f-bf99-1858188e54ab	f24b7f85-3147-43a8-8f2c-e23bd45515d7	2	2025-07-11 22:28:46.189571+00
7b134bc8-6657-486e-88da-a2b012ea6c3e	cd1ea371-9e79-479f-bf99-1858188e54ab	1f37dce9-4a9a-4df7-90ed-63f84b75e0bf	2	2025-07-11 22:28:46.189571+00
b876ead6-0317-47f6-9a0b-3b37577f0ff9	a6753887-a1d4-47d3-8541-147ea653fc23	01521495-cac2-4e03-847e-f4bba0fa85ee	2	2025-07-11 22:28:46.40917+00
08a3a34c-d1d1-457b-813e-b136da46c12a	a6753887-a1d4-47d3-8541-147ea653fc23	29ae943e-705d-4c1f-9b37-5ae70419cbab	2	2025-07-11 22:28:46.40917+00
dd795512-fbdc-4d72-9666-9f35d35f3b2e	a6753887-a1d4-47d3-8541-147ea653fc23	48b74b22-45a2-469f-b4f8-f5e139ce7034	2	2025-07-11 22:28:46.40917+00
e37113cc-bc48-406f-a091-6aa30ce8d227	a6753887-a1d4-47d3-8541-147ea653fc23	a12c4807-d102-4f55-93ba-596e33547244	1	2025-07-11 22:28:46.40917+00
40253713-3749-462a-a4bd-8d42ebd43a0b	a6753887-a1d4-47d3-8541-147ea653fc23	fcec0d6b-c945-4855-ac3e-9742eea735aa	1	2025-07-11 22:28:46.40917+00
3932624c-de59-4798-8fd1-51bbc161e0f8	7fa0e82a-f574-4df1-94fc-e416021cdfe1	8fee6f29-7fbc-4964-af01-c34d92048cfe	5	2025-07-11 22:28:46.616782+00
a9f25f89-1ee2-4d0e-8235-2920805df87e	7fa0e82a-f574-4df1-94fc-e416021cdfe1	9463c83b-d346-49c7-a81b-1df6c4f91653	3	2025-07-11 22:28:46.616782+00
1d39410d-ec6e-4ea9-8e94-fe8fd109c974	7fa0e82a-f574-4df1-94fc-e416021cdfe1	513d53ab-9c8b-4438-93fb-6efb64f67c50	3	2025-07-11 22:28:46.616782+00
ddd25864-2910-464a-8269-b89186088fca	7fa0e82a-f574-4df1-94fc-e416021cdfe1	f5051a8a-645b-4365-a1b0-37987b8a67e2	4	2025-07-11 22:28:46.616782+00
721d8334-cf84-451a-9797-266967e04964	721c8fbc-1a4c-4402-bccd-5bcc2fd5620e	624a6c5a-5451-4773-b5a0-0dd9d39d77d8	1	2025-07-11 22:28:46.791686+00
52f677e3-31be-40b2-a05c-4906aa0f06be	721c8fbc-1a4c-4402-bccd-5bcc2fd5620e	ba8f531e-e275-4d68-b595-d0e85aba02a6	1	2025-07-11 22:28:46.791686+00
fe612fc5-ec00-4fe1-a046-49a7cd0698d1	721c8fbc-1a4c-4402-bccd-5bcc2fd5620e	5cbeb745-5005-47f5-b063-2ff3429582c9	1	2025-07-11 22:28:46.791686+00
22e60163-6669-42ff-ab91-50fa3c7ef764	721c8fbc-1a4c-4402-bccd-5bcc2fd5620e	e1b114a2-4f90-4ed2-b9c7-f6688bfbdfd8	1	2025-07-11 22:28:46.791686+00
cbc6b5fb-9a0f-4c6f-951d-84f88a5d4bfb	07d9c17d-9912-490a-a0c5-9bd9433f932c	e1b114a2-4f90-4ed2-b9c7-f6688bfbdfd8	1	2025-07-11 22:28:46.963834+00
41bedcab-be39-4fcb-9771-353e3c5e13c6	07d9c17d-9912-490a-a0c5-9bd9433f932c	ba8f531e-e275-4d68-b595-d0e85aba02a6	1	2025-07-11 22:28:46.963834+00
77f98b39-6c7d-4b6a-8323-95ce0e5489eb	07d9c17d-9912-490a-a0c5-9bd9433f932c	5cbeb745-5005-47f5-b063-2ff3429582c9	1	2025-07-11 22:28:46.963834+00
f21d7c60-fce8-49be-8f89-d619069da45d	07d9c17d-9912-490a-a0c5-9bd9433f932c	624a6c5a-5451-4773-b5a0-0dd9d39d77d8	1	2025-07-11 22:28:46.963834+00
28634c97-f9d7-42ee-b800-d384eb1aa4ea	31dbf829-05b6-46ef-a6aa-cc24ab57ebd6	fcec0d6b-c945-4855-ac3e-9742eea735aa	1	2025-07-11 22:28:47.13509+00
5a9e47e6-59bb-46cc-8ffe-47b00b0c9628	31dbf829-05b6-46ef-a6aa-cc24ab57ebd6	a12c4807-d102-4f55-93ba-596e33547244	1	2025-07-11 22:28:47.13509+00
\.


--
-- TOC entry 3691 (class 2606 OID 65635)
-- Name: delivery_items delivery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_items
    ADD CONSTRAINT delivery_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3692 (class 1259 OID 65660)
-- Name: idx_delivery_items_delivery; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_delivery_items_delivery ON public.delivery_items USING btree (delivery_id);


--
-- TOC entry 3693 (class 2606 OID 65636)
-- Name: delivery_items delivery_items_delivery_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_items
    ADD CONSTRAINT delivery_items_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id) ON DELETE CASCADE;


--
-- TOC entry 3694 (class 2606 OID 65641)
-- Name: delivery_items delivery_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_items
    ADD CONSTRAINT delivery_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 3843 (class 3256 OID 65665)
-- Name: delivery_items Enable all operations for delivery_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all operations for delivery_items" ON public.delivery_items USING (true);


--
-- TOC entry 3842 (class 0 OID 65628)
-- Dependencies: 332
-- Name: delivery_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:33:31 UTC

--
-- PostgreSQL database dump complete
--

