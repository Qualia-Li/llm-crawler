--
-- PostgreSQL database dump
--

\restrict QRqf8XOZ2YGMR0U0GIrEncTxysgYnUSmvyr8Beqz8kZfP9ypuZqMA4OIqa8OklW

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: engineresult; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.engineresult (
    corekeyword text NOT NULL,
    enginename text NOT NULL,
    response text[] NOT NULL,
    id integer NOT NULL,
    "time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.engineresult OWNER TO postgres;

--
-- Name: engineresult_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.engineresult ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.engineresult_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: question; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question (
    corekeyword text NOT NULL,
    extendedkeywords text[]
);


ALTER TABLE public.question OWNER TO postgres;

--
-- Data for Name: engineresult; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.engineresult (corekeyword, enginename, response, id, "time") FROM stdin;
\.


--
-- Data for Name: question; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question (corekeyword, extendedkeywords) FROM stdin;
\.


--
-- Name: engineresult_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.engineresult_id_seq', 1, false);


--
-- Name: question question_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question
    ADD CONSTRAINT question_pk PRIMARY KEY (corekeyword);


--
-- Name: engineresult engineresult_question_corekeyword_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.engineresult
    ADD CONSTRAINT engineresult_question_corekeyword_fk FOREIGN KEY (corekeyword) REFERENCES public.question(corekeyword);


--
-- PostgreSQL database dump complete
--

\unrestrict QRqf8XOZ2YGMR0U0GIrEncTxysgYnUSmvyr8Beqz8kZfP9ypuZqMA4OIqa8OklW

