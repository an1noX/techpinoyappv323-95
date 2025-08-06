--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:32:28 UTC

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
-- TOC entry 331 (class 1259 OID 65614)
-- Name: deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deliveries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    purchase_order_id uuid,
    delivery_date date NOT NULL,
    delivery_receipt_number text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 3846 (class 0 OID 65614)
-- Dependencies: 331
-- Data for Name: deliveries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deliveries (id, purchase_order_id, delivery_date, delivery_receipt_number, notes, created_at) FROM stdin;
4cffbc6f-bf4b-4c81-8733-c1bfb1c4d197	39f6c212-534a-4d80-b853-f7dfae7fa8a9	2025-03-31	331	Imported from transaction records (DR: 331)	2025-07-11 22:03:15.760705+00
0d36e33f-1e59-4686-a3d1-e51d1292134d	39f6c212-534a-4d80-b853-f7dfae7fa8a9	2025-03-31	332	Imported from transaction records (DR: 332)	2025-07-11 22:04:54.310994+00
1756d2d0-9f8e-49b2-bfc6-e9a743033ec8	39f6c212-534a-4d80-b853-f7dfae7fa8a9	2025-04-05	334	Imported from transaction records (DR: 334)	2025-07-11 22:05:52.949947+00
382b8f4a-416d-4c78-9d7a-488eeb21680e	6db0b0ef-fd49-4371-b62a-df5c384801a0	2025-04-08	337	Imported from transaction records (DR: 337)	2025-07-11 22:28:45.253351+00
3a1652cc-13a2-4446-b61a-d50db0dbf414	39f6c212-534a-4d80-b853-f7dfae7fa8a9	2025-04-20	345	Imported from transaction records (DR: 345)	2025-07-11 22:28:45.528163+00
4923c5db-ed48-4d37-b5a2-677d34c41067	39f6c212-534a-4d80-b853-f7dfae7fa8a9	2025-04-20	346	Imported from transaction records (DR: 346)	2025-07-11 22:28:45.754908+00
ffe5b348-dd8b-4419-b86d-e01bb95e787f	2f67a1de-83cb-4473-bbca-f65cc3441dc2	2025-04-26	348	Imported from transaction records (DR: 348)	2025-07-11 22:28:45.936059+00
cd1ea371-9e79-479f-bf99-1858188e54ab	6db0b0ef-fd49-4371-b62a-df5c384801a0	2025-05-06	353	Imported from transaction records (DR: 353)	2025-07-11 22:28:46.101065+00
a6753887-a1d4-47d3-8541-147ea653fc23	6db0b0ef-fd49-4371-b62a-df5c384801a0	2025-05-06	354	Imported from transaction records (DR: 354)	2025-07-11 22:28:46.322174+00
7fa0e82a-f574-4df1-94fc-e416021cdfe1	6db0b0ef-fd49-4371-b62a-df5c384801a0	2025-05-06	355	Imported from transaction records (DR: 355)	2025-07-11 22:28:46.495696+00
721c8fbc-1a4c-4402-bccd-5bcc2fd5620e	6db0b0ef-fd49-4371-b62a-df5c384801a0	2025-05-06	357	Imported from transaction records (DR: 357)	2025-07-11 22:28:46.705972+00
07d9c17d-9912-490a-a0c5-9bd9433f932c	2f67a1de-83cb-4473-bbca-f65cc3441dc2	2025-05-27	368	Imported from transaction records (DR: 368)	2025-07-11 22:28:46.880443+00
31dbf829-05b6-46ef-a6aa-cc24ab57ebd6	2f67a1de-83cb-4473-bbca-f65cc3441dc2	2025-04-20	347/354	Imported from transaction records (DR: 347/354)	2025-07-11 22:28:47.044594+00
\.


--
-- TOC entry 3690 (class 2606 OID 65622)
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);


--
-- TOC entry 3691 (class 1259 OID 65692)
-- Name: idx_deliveries_dr_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deliveries_dr_number ON public.deliveries USING btree (delivery_receipt_number);


--
-- TOC entry 3692 (class 1259 OID 65659)
-- Name: idx_deliveries_po; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deliveries_po ON public.deliveries USING btree (purchase_order_id);


--
-- TOC entry 3695 (class 2620 OID 65696)
-- Name: deliveries trigger_link_transactions_to_delivery; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_link_transactions_to_delivery AFTER INSERT ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.link_transactions_to_delivery();


--
-- TOC entry 3693 (class 2606 OID 65623)
-- Name: deliveries deliveries_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);


--
-- TOC entry 3694 (class 2606 OID 65684)
-- Name: deliveries fk_delivery_purchase_order; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT fk_delivery_purchase_order FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;


--
-- TOC entry 3844 (class 3256 OID 65664)
-- Name: deliveries Enable all operations for deliveries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all operations for deliveries" ON public.deliveries USING (true);


--
-- TOC entry 3843 (class 0 OID 65614)
-- Dependencies: 331
-- Name: deliveries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:32:31 UTC

--
-- PostgreSQL database dump complete
--

