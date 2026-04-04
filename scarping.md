# Web Scraping Implementation & Future Roadmap

**Date**: 2026-04-04  
**Status**: ✅ Implemented & Extensible

## 📋 Overview

The Orka Web Scraping system is designed to automate the onboarding process for new businesses. It crawls a business's existing website, extracts relevant information (business hours, services, policies) into the Knowledge Base, and stages products/services for administrative approval.

This allows the Orka Agent to be "ready-to-chat" within minutes of a user providing their website URL.

---

## 🛠️ Technology Stack

### Core Libraries
- **[Crawl4AI](https://github.com/unclecode/crawl4ai)**: A powerful, LLM-friendly web crawler designed specifically for RAG (Retrieval-Augmented Generation) workflows.
- **Playwright (Chromium)**: The underlying browser engine used for high-fidelity rendering of dynamic JavaScript-heavy websites.
- **FastAPI**: Backend framework for managing scraping jobs and exposing extracted data via REST APIs.
- **SQLAlchemy (PostgreSQL)**: Database ORM for tracking job status and staging extracted products.

### Infrastructure
- **Dockerized Environment**: The backend container installs `playwright` and its system dependencies (`chromium`) to ensure consistent scraping across environments.
- **Asynchronous Processing**: Scraping tasks run as background tasks to prevent blocking the main API response.

---

## 🏗️ System Architecture

### 1. Data Models (`backend/app/models/scraping.py`)
- **`ScrapingJob`**: Tracks the lifecycle of a crawl (URL, Status, Config, Knowledge Base ID).
- **`ScrapingJobProduct`**: A staging table for extracted products. Products are kept here until an admin reviews and "imports" them into the main product catalog.

### 2. Scraping Agent (`backend/app/agents/action_agents/scraping_agent.py`)
The `ScrapingAgent` is the core logic handler. It:
1.  **Crawls**: Navigates the website starting from the seed URL.
2.  **Filters**: Uses heuristics to identify relevant pages (pricing, services, about us).
3.  **Extracts**: Utilizes `Crawl4AI`'s LLM extraction capabilities to convert raw HTML into structured JSON (Product name, price, description).
4.  **Saves**: Updates the `KnowledgeBase` and populates `ScrapingJobProduct`.

### 3. API Flow
1.  `POST /api/v1/scraping/scrape`: Starts a background job.
2.  `GET /api/v1/scraping/jobs/{job_id}`: Polls for job status.
3.  `POST /api/v1/scraping/products/{id}/approve`: Transfers a staged product to the live `Product` table.

---

## 🚀 Future Roadmap

### 1. Advanced LLM Extraction
- **Visual Extraction**: Integrate GPT-4o or Claude 3.5 Sonnet with vision to extract info from images/banners that traditional scrapers might miss.
- **Multi-lingual Support**: Automatic translation of scraped content into the tenant's primary language.

### 2. Scalability & Performance
- **Distributed Scraping**: Move scraping logic to a dedicated Celery/Redis worker cluster to handle high-volume tenants without impacting the API server.
- **Proxy Rotation**: Integration with Bright Data or Oxylabs to bypass anti-scraping measures on protected sites.

### 3. Agent Integration
- **Real-time Knowledge Updates**: Periodically re-crawl websites to keep the agent's knowledge base in sync with business changes (e.g., price updates, new menu items).
- **Deep Link Verification**: Ensure the agent can provide direct links to the source page for every piece of information it cites.

### 4. UI/UX Improvements
- **Live Preview**: A dashboard view that shows the crawler's progress in real-time (crawled vs. pending URLs).
- **Interactive Correction**: An interface where admins can "correct" the LLM's extraction errors, which then tunes the extraction prompt for future crawls.

---

## 📦 Tool Configuration (Summary)

| Tool | Purpose | Version |
| :--- | :--- | :--- |
| `crawl4ai` | Web Crawling & LLM Extraction | `0.4.248` |
| `playwright` | Browser Automation | Latest |
| `beautifulsoup4` | Fallback HTML Parsing | `4.12.2` |
| `sqlalchemy` | Persistence & RLS | `2.0.x` |

---

*This document serves as the technical reference for the Orka Web Scraping sub-system.*
