--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Debian 15.13-0+deb12u1)

-- Started on 2025-07-14 11:29:48 UTC

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
-- TOC entry 293 (class 1259 OID 28914)
-- Name: revision_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revision_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    affected_area text NOT NULL,
    dashboard_type text NOT NULL,
    status text DEFAULT 'unresolved'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    category text NOT NULL,
    assigned_to text,
    reported_by text,
    identified_date date DEFAULT CURRENT_DATE NOT NULL,
    resolved_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT revision_history_category_check CHECK ((category = ANY (ARRAY['bug'::text, 'missing_feature'::text, 'incomplete_feature'::text, 'enhancement'::text, 'workflow_issue'::text, 'ui_issue'::text]))),
    CONSTRAINT revision_history_dashboard_type_check CHECK ((dashboard_type = ANY (ARRAY['owner_admin'::text, 'sales_admin'::text, 'system'::text]))),
    CONSTRAINT revision_history_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT revision_history_status_check CHECK ((status = ANY (ARRAY['unresolved'::text, 'work_in_progress'::text, 'pending_review'::text, 'resolved'::text, 'wont_fix'::text])))
);


--
-- TOC entry 3850 (class 0 OID 28914)
-- Dependencies: 293
-- Data for Name: revision_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.revision_history (id, title, description, affected_area, dashboard_type, status, priority, category, assigned_to, reported_by, identified_date, resolved_date, created_at, updated_at) FROM stdin;
993ca987-8b49-45dc-8588-ffa2275f9175	Price Comparison Export Feature Missing	Export functionality for price comparison data is not implemented	Price Comparison	owner_admin	unresolved	medium	missing_feature	\N	System Audit	2025-06-10	\N	2025-06-10 02:34:31.294432+00	2025-06-10 02:34:31.294432+00
8eac08f6-e769-435f-91eb-b118ec8d3bfb	Bulk Product Import Validation	CSV import validation for products needs improvement for error handling	Product Management > Import	owner_admin	unresolved	medium	enhancement	\N	System Audit	2025-06-10	\N	2025-06-10 02:34:31.294432+00	2025-06-10 02:34:31.294432+00
553d1835-c4a0-4e52-bfeb-2baaeaec7836	Client Document Management Integration	Document upload and management for clients is partially implemented	Client Management > Documents	owner_admin	unresolved	medium	incomplete_feature	\N	System Audit	2025-06-10	\N	2025-06-10 02:34:31.294432+00	2025-06-10 02:34:31.294432+00
7049622e-4a9b-43fe-a706-aeafb143e38a	Printer Maintenance Scheduling Automation	Automatic scheduling of printer maintenance based on usage patterns	Printer Management > Maintenance	owner_admin	unresolved	low	enhancement	\N	System Audit	2025-06-10	\N	2025-06-10 02:34:31.294432+00	2025-06-10 02:34:31.294432+00
d25140d3-b0a2-42e0-9342-ab1ae551f718	Change Status Feature Missing For Maintenance Status	In the Clients > Printers tab, the "Change Status" feature does not correctly support the recently added "For Maintenance" status; logic is either missing or incomplete	Sales Dashboard > Clients > Printers	sales_admin	unresolved	high	bug	\N	System Audit	2025-06-10	\N	2025-06-10 02:34:31.294432+00	2025-06-10 02:34:31.294432+00
1922d6db-beb6-41ac-9670-d0bd135ebb30	Client Price Quote Generation	Automated quote generation for clients based on product selections is not implemented	Sales Dashboard > Products	sales_admin	unresolved	medium	missing_feature	\N	System Audit	2025-06-10	\N	2025-06-10 02:34:31.294432+00	2025-06-10 02:34:31.294432+00
c16615cc-288d-4b0e-ada9-a91226cce231	Printer Assignment Transfer Workflow	Transfer printer between departments/clients workflow needs streamlining	Sales Dashboard > Printers	sales_admin	unresolved	medium	workflow_issue	\N	System Audit	2025-06-10	\N	2025-06-10 02:34:31.294432+00	2025-06-10 02:34:31.294432+00
9aeadaa4-9608-4232-9d68-2e9e7d903d31	Department Product Set Assignment	Ability to assign product sets to specific departments is incomplete	Sales Dashboard > Clients > Departments	sales_admin	unresolved	medium	incomplete_feature	\N	System Audit	2025-06-10	\N	2025-06-10 02:34:31.294432+00	2025-06-10 02:34:31.294432+00
c054592a-8f31-410e-a0d2-0faccfa7f669	Mobile Responsive Design Issues	Some components in sales dashboard have responsive design issues on smaller screens	Sales Dashboard > UI/UX	sales_admin	unresolved	low	ui_issue	\N	System Audit	2025-06-10	\N	2025-06-10 02:34:31.294432+00	2025-06-10 02:34:31.294432+00
8a6ce4c1-e092-407f-96da-6ace51bd57ba	Product Set Creation with Similar SKUs Malfunction	Creating a product set using existing products with similar SKUs is malfunctioning due to incomplete or improperly integrated logic/flow	Product Management > Product Sets	owner_admin	pending_review	high	bug	\N	System Audit	2025-06-10	\N	2025-06-10 02:34:31.294432+00	2025-06-11 04:29:09.417+00
\.


--
-- TOC entry 3698 (class 2606 OID 28930)
-- Name: revision_history revision_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_history
    ADD CONSTRAINT revision_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3847 (class 3256 OID 28932)
-- Name: revision_history Admins can manage revision history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage revision history" ON public.revision_history TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'owner'::text]))))));


--
-- TOC entry 3848 (class 3256 OID 28931)
-- Name: revision_history Authenticated users can view revision history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view revision history" ON public.revision_history FOR SELECT TO authenticated USING (true);


--
-- TOC entry 3846 (class 0 OID 28914)
-- Dependencies: 293
-- Name: revision_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.revision_history ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-07-14 11:29:50 UTC

--
-- PostgreSQL database dump complete
--

