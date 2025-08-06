--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:32:58 UTC

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
-- TOC entry 283 (class 1259 OID 18622)
-- Name: printer_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.printer_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    printer_id uuid NOT NULL,
    document_type text NOT NULL,
    title text NOT NULL,
    file_path text,
    file_url text,
    file_size integer,
    mime_type text,
    uploaded_by text,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT printer_documents_document_type_check CHECK ((document_type = ANY (ARRAY['contract'::text, 'accountability'::text, 'manual'::text, 'warranty'::text, 'other'::text])))
);


--
-- TOC entry 3842 (class 0 OID 18622)
-- Dependencies: 283
-- Data for Name: printer_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.printer_documents (id, printer_id, document_type, title, file_path, file_url, file_size, mime_type, uploaded_by, uploaded_at) FROM stdin;
\.


--
-- TOC entry 3692 (class 2606 OID 18631)
-- Name: printer_documents printer_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_documents
    ADD CONSTRAINT printer_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 3690 (class 1259 OID 18647)
-- Name: idx_printer_documents_printer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_printer_documents_printer_id ON public.printer_documents USING btree (printer_id);


--
-- TOC entry 3693 (class 2606 OID 18632)
-- Name: printer_documents printer_documents_printer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_documents
    ADD CONSTRAINT printer_documents_printer_id_fkey FOREIGN KEY (printer_id) REFERENCES public.printers(id) ON DELETE CASCADE;


-- Completed on 2025-07-14 11:33:01 UTC

--
-- PostgreSQL database dump complete
--

