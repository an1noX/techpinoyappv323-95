--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:30:35 UTC

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
-- TOC entry 290 (class 1259 OID 27673)
-- Name: client_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    document_type text NOT NULL,
    document_number text NOT NULL,
    description text,
    file_path text NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    status text DEFAULT 'uploaded'::text NOT NULL,
    extracted_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_documents_document_type_check CHECK ((document_type = ANY (ARRAY['purchase_order'::text, 'quote_request'::text, 'invoice'::text, 'other'::text]))),
    CONSTRAINT client_documents_status_check CHECK ((status = ANY (ARRAY['uploaded'::text, 'processing'::text, 'extracted'::text, 'completed'::text])))
);


--
-- TOC entry 3855 (class 0 OID 27673)
-- Dependencies: 290
-- Data for Name: client_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_documents (id, client_id, document_type, document_number, description, file_path, file_name, file_size, mime_type, status, extracted_data, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3694 (class 2606 OID 27685)
-- Name: client_documents client_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_documents
    ADD CONSTRAINT client_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 3695 (class 1259 OID 27691)
-- Name: idx_client_documents_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_documents_client_id ON public.client_documents USING btree (client_id);


--
-- TOC entry 3696 (class 1259 OID 27694)
-- Name: idx_client_documents_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_documents_created_at ON public.client_documents USING btree (created_at);


--
-- TOC entry 3697 (class 1259 OID 27692)
-- Name: idx_client_documents_document_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_documents_document_type ON public.client_documents USING btree (document_type);


--
-- TOC entry 3698 (class 1259 OID 27693)
-- Name: idx_client_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_documents_status ON public.client_documents USING btree (status);


--
-- TOC entry 3700 (class 2620 OID 27695)
-- Name: client_documents handle_client_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_client_documents_updated_at BEFORE UPDATE ON public.client_documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3699 (class 2606 OID 27686)
-- Name: client_documents client_documents_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_documents
    ADD CONSTRAINT client_documents_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 3849 (class 3256 OID 27703)
-- Name: client_documents Allow deleting client documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow deleting client documents" ON public.client_documents FOR DELETE USING (true);


--
-- TOC entry 3850 (class 3256 OID 27701)
-- Name: client_documents Allow inserting client documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow inserting client documents" ON public.client_documents FOR INSERT WITH CHECK (true);


--
-- TOC entry 3851 (class 3256 OID 27702)
-- Name: client_documents Allow updating client documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow updating client documents" ON public.client_documents FOR UPDATE USING (true);


--
-- TOC entry 3852 (class 3256 OID 27700)
-- Name: client_documents Allow viewing client documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow viewing client documents" ON public.client_documents FOR SELECT USING (true);


--
-- TOC entry 3853 (class 3256 OID 27696)
-- Name: client_documents Enable all operations for client_documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all operations for client_documents" ON public.client_documents USING (true);


--
-- TOC entry 3848 (class 0 OID 27673)
-- Dependencies: 290
-- Name: client_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:30:38 UTC

--
-- PostgreSQL database dump complete
--

