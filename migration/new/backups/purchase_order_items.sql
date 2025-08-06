--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:15 UTC

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
-- TOC entry 330 (class 1259 OID 65592)
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    purchase_order_id uuid NOT NULL,
    product_id uuid,
    model text,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) GENERATED ALWAYS AS (((quantity)::numeric * unit_price)) STORED,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT purchase_order_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT purchase_order_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


--
-- TOC entry 3847 (class 0 OID 65592)
-- Dependencies: 330
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_order_items (id, purchase_order_id, product_id, model, quantity, unit_price, created_at) FROM stdin;
276558d3-3d9d-4283-bf68-54503763a0fe	2f67a1de-83cb-4473-bbca-f65cc3441dc2	624a6c5a-5451-4773-b5a0-0dd9d39d77d8	TP-TN451 YL	1	3000.00	2025-07-11 21:41:03.372451+00
cbc34d45-d3a5-4705-ad54-fe7f4463b739	2f67a1de-83cb-4473-bbca-f65cc3441dc2	e1b114a2-4f90-4ed2-b9c7-f6688bfbdfd8	TP-TN451 CY	1	3000.00	2025-07-11 21:41:03.372451+00
a9391009-c6c2-431b-b866-13f544cef0eb	2f67a1de-83cb-4473-bbca-f65cc3441dc2	ba8f531e-e275-4d68-b595-d0e85aba02a6	TP-TN451 MG	1	3000.00	2025-07-11 21:41:03.372451+00
59f2a67f-99f8-4f7f-9e02-77f79c3ead62	2f67a1de-83cb-4473-bbca-f65cc3441dc2	5cbeb745-5005-47f5-b063-2ff3429582c9	TP-TN451 BK	1	3000.00	2025-07-11 21:41:03.372451+00
43b0d70f-f607-4223-822d-86d6d8abaecd	2f67a1de-83cb-4473-bbca-f65cc3441dc2	624a6c5a-5451-4773-b5a0-0dd9d39d77d8	TP-TN451 YL	1	3000.00	2025-07-11 21:41:03.372451+00
353b7f6f-ef9a-4ba6-9edd-90bcc51f228c	2f67a1de-83cb-4473-bbca-f65cc3441dc2	01521495-cac2-4e03-847e-f4bba0fa85ee	CF400 BK	2	4300.00	2025-07-11 21:41:03.372451+00
f0e9ba5a-5ba8-490e-b2d1-8877581fff5e	2f67a1de-83cb-4473-bbca-f65cc3441dc2	29ae943e-705d-4c1f-9b37-5ae70419cbab	CF403A MG	2	3300.00	2025-07-11 21:41:03.372451+00
b148ed8f-c0cf-49e4-96f7-4b8c3f68dfd4	2f67a1de-83cb-4473-bbca-f65cc3441dc2	ba8f531e-e275-4d68-b595-d0e85aba02a6	TP-TN451 MG	1	3000.00	2025-07-11 21:41:03.372451+00
ffb94082-1a3d-4c82-bf07-c22ea228a54d	2f67a1de-83cb-4473-bbca-f65cc3441dc2	5cbeb745-5005-47f5-b063-2ff3429582c9	TP-TN451 BK	1	3000.00	2025-07-11 21:41:03.372451+00
24c5ecc4-f4c0-4ed3-9c8f-f3320fcdd37d	2f67a1de-83cb-4473-bbca-f65cc3441dc2	e1b114a2-4f90-4ed2-b9c7-f6688bfbdfd8	TP-TN451 CY	1	3000.00	2025-07-11 21:41:03.372451+00
8ff46cba-df1b-45ca-b33f-4b397b297fc7	2f67a1de-83cb-4473-bbca-f65cc3441dc2	48b74b22-45a2-469f-b4f8-f5e139ce7034	TP-202A YL	2	3300.00	2025-07-11 21:41:03.372451+00
9c4ea4b0-dace-4808-b6db-5968d466a009	2f67a1de-83cb-4473-bbca-f65cc3441dc2	a12c4807-d102-4f55-93ba-596e33547244	TP-202A CY	1	3300.00	2025-07-11 21:41:03.372451+00
777af97f-13c1-4f2b-9f34-c4d9480fa6a1	2f67a1de-83cb-4473-bbca-f65cc3441dc2	fcec0d6b-c945-4855-ac3e-9742eea735aa	TP-202A BK	1	4300.00	2025-07-11 21:41:03.372451+00
ec68ac47-e240-4b4f-8a77-b0602d166785	2f67a1de-83cb-4473-bbca-f65cc3441dc2	fcec0d6b-c945-4855-ac3e-9742eea735aa	TP-202A BK	1	4300.00	2025-07-11 21:41:03.372451+00
c653be42-14de-45a0-8aac-24ac4c0cd2cc	2f67a1de-83cb-4473-bbca-f65cc3441dc2	a12c4807-d102-4f55-93ba-596e33547244	TP-202A CY	1	3300.00	2025-07-11 21:41:03.372451+00
543df348-14cb-463d-8496-e9f0cff83ddb	976d1ae8-3d89-480d-8f71-b64ba75d9782	28faa43a-a858-482f-acd1-df94e8ddc9eb	TP-TN261 BK	3	3000.00	2025-07-11 21:41:14.564314+00
ad33c401-d2c2-440b-8cd1-5a00373c42dd	976d1ae8-3d89-480d-8f71-b64ba75d9782	f5051a8a-645b-4365-a1b0-37987b8a67e2	TP-TN660	3	2000.00	2025-07-11 21:41:14.564314+00
d82cec44-9716-4387-9125-fdc9b2784b65	976d1ae8-3d89-480d-8f71-b64ba75d9782	8fee6f29-7fbc-4964-af01-c34d92048cfe	TP-TN850	5	2000.00	2025-07-11 21:41:14.564314+00
0e3cde32-b484-4d02-892f-f2cebf90d19d	976d1ae8-3d89-480d-8f71-b64ba75d9782	1f37dce9-4a9a-4df7-90ed-63f84b75e0bf	TP-215A BK	3	3000.00	2025-07-11 21:41:14.564314+00
d89ad0ba-7d1b-4d27-85b6-f0da21dd86ba	976d1ae8-3d89-480d-8f71-b64ba75d9782	9463c83b-d346-49c7-a81b-1df6c4f91653	TP-12A	3	1500.00	2025-07-11 21:41:14.564314+00
9c464082-9662-4a10-9b08-1401bd2e0ad8	39f6c212-534a-4d80-b853-f7dfae7fa8a9	9463c83b-d346-49c7-a81b-1df6c4f91653	TP-12A	3	1500.00	2025-07-11 21:49:24.78425+00
cdd500fe-7da6-46e8-b03d-b62c7ab0e268	39f6c212-534a-4d80-b853-f7dfae7fa8a9	8fee6f29-7fbc-4964-af01-c34d92048cfe	TP-TN850	5	2000.00	2025-07-11 21:49:24.78425+00
07d6dcfe-c398-4285-9384-46aacc6ca418	39f6c212-534a-4d80-b853-f7dfae7fa8a9	513d53ab-9c8b-4438-93fb-6efb64f67c50	TP-17A	3	1500.00	2025-07-11 21:49:24.78425+00
0126f912-4aae-4d45-96f1-b4e92c980c2c	39f6c212-534a-4d80-b853-f7dfae7fa8a9	f5051a8a-645b-4365-a1b0-37987b8a67e2	TP-TN660	4	2000.00	2025-07-11 21:49:24.78425+00
1934d9f8-c096-49ca-9695-237ac5ed57de	39f6c212-534a-4d80-b853-f7dfae7fa8a9	f5051a8a-645b-4365-a1b0-37987b8a67e2	TP-TN660	1	2000.00	2025-07-11 21:49:24.78425+00
923c16ea-4053-46fd-a5de-b88f67f1de5d	39f6c212-534a-4d80-b853-f7dfae7fa8a9	8fee6f29-7fbc-4964-af01-c34d92048cfe	TP-TN850	2	2000.00	2025-07-11 21:49:24.78425+00
fdd27cfb-8b80-4dc2-94d4-6be7e4017a7f	39f6c212-534a-4d80-b853-f7dfae7fa8a9	8fee6f29-7fbc-4964-af01-c34d92048cfe	TP-TN850	3	2000.00	2025-07-11 21:49:24.78425+00
773e0703-2fa8-4f1a-8948-5f4b30754e7d	6db0b0ef-fd49-4371-b62a-df5c384801a0	c1dd6958-fdb6-4154-b63f-6137b8f23d74	TP-215A YL	1	3000.00	2025-07-11 22:27:55.525642+00
fb418756-79d5-488f-b4f7-84ae69fdbd78	6db0b0ef-fd49-4371-b62a-df5c384801a0	002f1f73-bedd-48da-9f6e-078f32c37ad9	TP-TN261 YL	3	3000.00	2025-07-11 22:27:55.525642+00
daedcb62-98d2-4d23-9b20-5b3d58a87e7a	6db0b0ef-fd49-4371-b62a-df5c384801a0	e6b965a6-6e09-461b-9d6a-022b533299c2	TP-215A MG	1	3000.00	2025-07-11 22:27:55.525642+00
90027da6-0e65-40b8-83ba-a91d08f3b36d	6db0b0ef-fd49-4371-b62a-df5c384801a0	36f9fdd7-8d20-4d2b-ad9c-6ca9a96ae570	TP-TN261 CY	3	3000.00	2025-07-11 22:27:55.525642+00
46f26029-0d3d-47b5-ab98-e86bf63115b3	6db0b0ef-fd49-4371-b62a-df5c384801a0	f24b7f85-3147-43a8-8f2c-e23bd45515d7	TP-215A CY	2	3000.00	2025-07-11 22:27:55.525642+00
970326a5-7ca1-450f-a7be-cd5f7c96d25d	6db0b0ef-fd49-4371-b62a-df5c384801a0	f8527963-984c-44d4-bef8-bcb64141fc37	TP-351 YL	1	3000.00	2025-07-11 22:27:55.525642+00
4ab14e41-2eff-4a33-94e9-90d54cb51834	6db0b0ef-fd49-4371-b62a-df5c384801a0	9063199d-fd74-4cc7-83b2-c79595259539	TP-351 MG	1	3000.00	2025-07-11 22:27:55.525642+00
\.


--
-- TOC entry 3694 (class 2606 OID 65603)
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3692 (class 1259 OID 65658)
-- Name: idx_purchase_order_items_po; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_order_items_po ON public.purchase_order_items USING btree (purchase_order_id);


--
-- TOC entry 3695 (class 2606 OID 65609)
-- Name: purchase_order_items purchase_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 3696 (class 2606 OID 65604)
-- Name: purchase_order_items purchase_order_items_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- TOC entry 3845 (class 3256 OID 65663)
-- Name: purchase_order_items Enable all operations for purchase_order_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all operations for purchase_order_items" ON public.purchase_order_items USING (true);


--
-- TOC entry 3844 (class 0 OID 65592)
-- Dependencies: 330
-- Name: purchase_order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:33:17 UTC

--
-- PostgreSQL database dump complete
--

