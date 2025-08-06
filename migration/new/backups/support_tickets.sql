--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:33:20 UTC

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
-- TOC entry 295 (class 1259 OID 33397)
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_number text NOT NULL,
    client_id uuid NOT NULL,
    printer_id uuid,
    request_type text NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    department text,
    contact_person text,
    contact_phone text,
    preferred_schedule text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    CONSTRAINT support_tickets_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT support_tickets_request_type_check CHECK ((request_type = ANY (ARRAY['maintenance'::text, 'technician'::text]))),
    CONSTRAINT support_tickets_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'resolved'::text, 'cancelled'::text])))
);


--
-- TOC entry 3854 (class 0 OID 33397)
-- Dependencies: 295
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.support_tickets (id, ticket_number, client_id, printer_id, request_type, title, description, status, priority, department, contact_person, contact_phone, preferred_schedule, created_at, updated_at, resolved_at) FROM stdin;
\.


--
-- TOC entry 3696 (class 2606 OID 33411)
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 3698 (class 2606 OID 33413)
-- Name: support_tickets support_tickets_ticket_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_ticket_number_key UNIQUE (ticket_number);


--
-- TOC entry 3701 (class 2620 OID 33445)
-- Name: support_tickets handle_support_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- TOC entry 3702 (class 2620 OID 33444)
-- Name: support_tickets set_support_ticket_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_support_ticket_number BEFORE INSERT ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_ticket_number();


--
-- TOC entry 3699 (class 2606 OID 33414)
-- Name: support_tickets support_tickets_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 3700 (class 2606 OID 33419)
-- Name: support_tickets support_tickets_printer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_printer_id_fkey FOREIGN KEY (printer_id) REFERENCES public.printers(id) ON DELETE SET NULL;


--
-- TOC entry 3851 (class 3256 OID 33440)
-- Name: support_tickets Clients can create their own support tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can create their own support tickets" ON public.support_tickets FOR INSERT WITH CHECK ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.contact_email = (( SELECT users.email
           FROM auth.users
          WHERE (users.id = auth.uid())))::text))));


--
-- TOC entry 3852 (class 3256 OID 33439)
-- Name: support_tickets Clients can view their own support tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view their own support tickets" ON public.support_tickets FOR SELECT USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.contact_email = (( SELECT users.email
           FROM auth.users
          WHERE (users.id = auth.uid())))::text))));


--
-- TOC entry 3850 (class 0 OID 33397)
-- Dependencies: 295
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:33:23 UTC

--
-- PostgreSQL database dump complete
--

