--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:32:12 UTC

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
-- TOC entry 296 (class 1259 OID 33424)
-- Name: support_ticket_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_ticket_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    draft_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3844 (class 0 OID 33424)
-- Dependencies: 296
-- Data for Name: support_ticket_drafts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.support_ticket_drafts (id, client_id, draft_data, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3691 (class 2606 OID 33433)
-- Name: support_ticket_drafts support_ticket_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_drafts
    ADD CONSTRAINT support_ticket_drafts_pkey PRIMARY KEY (id);


--
-- TOC entry 3693 (class 2620 OID 33446)
-- Name: support_ticket_drafts handle_support_ticket_drafts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_support_ticket_drafts_updated_at BEFORE UPDATE ON public.support_ticket_drafts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3692 (class 2606 OID 33434)
-- Name: support_ticket_drafts support_ticket_drafts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_drafts
    ADD CONSTRAINT support_ticket_drafts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 3842 (class 3256 OID 33441)
-- Name: support_ticket_drafts Clients can manage their own drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can manage their own drafts" ON public.support_ticket_drafts USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.contact_email = (( SELECT users.email
           FROM auth.users
          WHERE (users.id = auth.uid())))::text))));


--
-- TOC entry 3841 (class 0 OID 33424)
-- Dependencies: 296
-- Name: support_ticket_drafts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_ticket_drafts ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:32:15 UTC

--
-- PostgreSQL database dump complete
--

