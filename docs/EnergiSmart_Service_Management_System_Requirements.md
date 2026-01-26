# EnergiSmart Service Management System
## Requirements Specification

**Document:** Requirements Specification  
**Date:** January 26, 2026  
**Prepared for:** EnergiSmart Norge AS  
**Classification:** Confidential

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context](#2-business-context)
3. [System Architecture](#3-system-architecture)
4. [Functional Requirements](#4-functional-requirements)
5. [Technical Requirements](#5-technical-requirements)
6. [Integrations](#6-integrations)
7. [Security and Compliance](#7-security-and-compliance)
8. [User Experience](#8-user-experience)
9. [AI and Automation](#9-ai-and-automation)
10. [Reporting and Analytics](#10-reporting-and-analytics)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Implementation Plan](#12-implementation-plan)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

### 1.1 Purpose
This document describes the requirements for a complete Service Management System (SMS) for EnergiSmart's service department. The system shall handle the entire lifecycle of service agreements, from sales and creation, through planning and execution, to invoicing and follow-up.

### 1.2 Scope
The system shall support:
- Administration of service agreements for solar panel installations and battery systems (BESS)
- Planning and optimization of service visits
- Digital checklists and documentation
- AI-assisted report generation
- Integration with Tripletex for invoicing and customer master data
- Customer portal for self-service
- Mobile field application for technicians

### 1.3 Target Users
| User Group | Description | Primary Functions |
|------------|-------------|-------------------|
| Service Manager | Overall responsibility for service department | Dashboard, KPIs, resource allocation |
| Planner | Coordinates service visits | Calendar, route optimization, dispatch |
| Service Technician | Performs field service | Mobile app, checklists, documentation |
| Finance | Invoicing and follow-up | Tripletex integration, reports |
| Customer | External users | Portal, agreements, reports |
| Administrator | System administration | Configuration, user management |

### 1.4 Key Design Principles

#### 1.4.1 Code Language Convention
**IMPORTANT:** Although the user interface will be in Norwegian, all code must use English for:
- Class names
- Variable names
- Function and method names
- Struct and type definitions
- Enum values
- Constants
- Comments in code
- Database field names
- API endpoints and parameters

This ensures maintainability, international collaboration, and industry standard compliance.

#### 1.4.2 Customer Data Source of Truth
Tripletex is the single source of truth for all customer data. The application:
- SHALL fetch all customer information from Tripletex API
- MAY cache customer data locally for performance
- SHALL NEVER create customer records directly in the local database
- SHALL NEVER modify customer information directly in the local database
- SHALL synchronize customer data from Tripletex on a regular basis

#### 1.4.3 Shared Authentication and Common Functions
The system SHALL use the `@energismart/shared` package for:
- User management
- Authentication (Google OAuth)
- Common database operations
- Employee availability checking across EnergiSmart applications

---

## 2. Business Context

### 2.1 Background
EnergiSmart Norge AS operates as Norway's largest solar panel installer with presence in Fredrikstad, Oslo, Bergen, and Trondheim. The service department operates as an independent unit focused on:
- Proactive maintenance of installed systems
- Troubleshooting and repairs
- Performance optimization
- Warranty follow-up
- Customer satisfaction

### 2.2 Business Goals
| Goal | Description | KPI |
|------|-------------|-----|
| Efficiency | Increase service visits per technician per day | Min. 4 visits/day |
| First-Time Fix Rate | Resolve issues on first visit | >85% |
| Customer Satisfaction | NPS and customer ratings | NPS >50 |
| Response Time | Time from inquiry to resolution | <24 hours critical, <5 days normal |
| Agreement Renewal | Percentage of customers renewing | >80% |
| Invoicing Rate | Percentage of work invoiced | >95% |

### 2.3 Value Chain

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Agreement  │───▶│  Planning   │───▶│  Execution  │───▶│  Reporting  │───▶│  Invoicing  │
│    Sales    │    │  & Dispatch │    │  & Document │    │  & Follow-up│    │  & Analysis │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼                  ▼
   Tripletex          Resources          Checklists       AI Reports         Tripletex
   Customers          Route Opt.         Photos/Video     Trend Analysis     Invoicing
   Price Lists        Notifications      Signatures       Recommendations    KPIs
```

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                     │
├────────────────────┬───────────────────┬───────────────────┬──────────────────┤
│   Web Dashboard    │   Customer Portal │   Mobile App      │   Admin Panel    │
│   (Next.js/React)  │   (Next.js/React) │   (React Native/  │   (Next.js)      │
│                    │                   │    PWA)           │                  │
└────────────────────┴───────────────────┴───────────────────┴──────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY (Vercel Edge)                         │
│                    Rate Limiting │ Authentication │ Routing                    │
└────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                                  │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────────┤
│  Agreement   │   Scheduler  │  Checklist   │   Report     │   Invoicing      │
│  Service     │   Service    │   Service    │   Service    │   Service        │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                         SHARED SERVICES LAYER                                   │
│                         (@energismart/shared)                                   │
├──────────────────────────────────────┬─────────────────────────────────────────┤
│           Authentication             │           Common Database               │
│           (Google OAuth)             │           Operations                    │
│           User Management            │           Employee Availability         │
└──────────────────────────────────────┴─────────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                              INTEGRATION LAYER                                  │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────────┤
│   Tripletex  │   Gemini AI  │   Google     │   Messaging  │   Maps           │
│   Adapter    │   Adapter    │   Calendar   │  (Email/SMS) │  (Google Maps)   │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                         │
├─────────────────────┬─────────────────────┬────────────────────────────────────┤
│     PostgreSQL      │   Redis (Shared)    │        Redis (App)                 │
│  (Primary Storage)  │ (@energismart/shared│     (App-Specific Cache)           │
│  - Agreements       │  via Upstash)       │     - Geolocation cache            │
│  - Installations    │  - Sessions         │     - Job queues                   │
│  - Checklists       │  - User data        │     - Rate limiting                │
│  - Reports          │  - Cross-app sync   │     - Real-time updates            │
│  - Customer Cache   │                     │                                    │
└─────────────────────┴─────────────────────┴────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                              FILE STORAGE                                       │
│                    Vercel Blob / Cloudflare R2 / AWS S3                        │
│              Images │ Documents │ Reports │ Signatures                         │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Frontend | Next.js 14+ (App Router) | Server components, optimal Vercel integration |
| Styling | Tailwind CSS + shadcn/ui | Rapid development, consistent design |
| State Management | Zustand + React Query | Lightweight, performant, good caching |
| Backend | Next.js API Routes + tRPC | End-to-end type safety |
| Database | PostgreSQL (Neon/Supabase) | Scalable, Vercel-compatible |
| Cache (Shared) | Upstash Redis | For @energismart/shared package |
| Cache (App) | Upstash Redis (separate instance) | App-specific caching and queues |
| ORM | Prisma | Type-safe database access |
| Authentication | @energismart/shared (NextAuth.js) | Shared across EnergiSmart apps |
| File Storage | Vercel Blob | Native integration |
| AI | Google Gemini API | Cost-effective, good Norwegian support |
| Maps | Google Maps Platform | Route optimization, geocoding |
| Push/SMS | Twilio / SendGrid | Reliable notifications |
| Hosting | Vercel | Edge functions, global CDN |

### 3.3 Data Model

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  CustomerCache  │       │   Installation  │       │ServiceAgreement │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │◄──────│ customer_id     │◄──────│ installation_id │
│ tripletex_id(PK)│       │ id              │       │ id              │
│ name            │       │ address         │       │ agreement_type  │
│ org_number      │       │ system_type     │       │ start_date      │
│ contact_person  │       │ capacity_kw     │       │ end_date        │
│ email           │       │ install_date    │       │ base_price      │
│ phone           │       │ inverter_type   │       │ sla_level       │
│ synced_at       │       │ panel_count     │       │ status          │
│ (Read-Only      │       │ battery_kwh     │       │ auto_renew      │
│  from Tripletex)│       │ monitoring_id   │       │ custom_addons[] │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                  │                         │
                                  ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  ServiceVisit   │       │    Checklist    │       │   ServicePlan   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │       │ id              │
│ agreement_id    │       │ visit_id        │       │ agreement_id    │
│ technician_id   │       │ template_id     │       │ visit_frequency │
│ scheduled_date  │       │ completed_at    │       │ next_visit      │
│ actual_date     │       │ technician_id   │       │ visit_window    │
│ status          │       │ signature       │       │ preferred_day   │
│ visit_type      │       │ items[]         │       │ seasonal_adj    │
│ duration_min    │       │ photos[]        │       └─────────────────┘
│ notes           │       │ ai_summary      │               
│ customer_sign   │       └─────────────────┘               
└─────────────────┘               │                         
        │                         ▼                         
        ▼                 ┌─────────────────┐       ┌─────────────────┐
┌─────────────────┐       │ ChecklistItem   │       │    Invoice      │
│    Employee     │       ├─────────────────┤       ├─────────────────┤
│(@energismart/   │       │ id              │       │ id              │
│    shared)      │       │ checklist_id    │       │ visit_id        │
├─────────────────┤       │ category        │       │ tripletex_id    │
│ id              │       │ description     │       │ amount          │
│ name            │       │ status          │       │ status          │
│ email           │       │ value           │       │ due_date        │
│ phone           │       │ photo_required  │       │ sent_at         │
│ certifications  │       │ notes           │       │ paid_at         │
│ skills[]        │       │ severity        │       └─────────────────┘
│ home_location   │       └─────────────────┘               
│ calendar_id     │                                         
│ availability    │       ┌─────────────────┐       ┌─────────────────┐
└─────────────────┘       │  AddonProduct   │       │ AgreementAddon  │
                          ├─────────────────┤       ├─────────────────┤
                          │ id              │◄──────│ addon_id        │
                          │ name            │       │ agreement_id    │
                          │ description     │       │ quantity        │
                          │ category        │       │ custom_price    │
                          │ base_price      │       │ notes           │
                          │ unit            │       └─────────────────┘
                          │ is_active       │
                          │ tripletex_       │
                          │   product_id    │
                          └─────────────────┘
```

### 3.4 Environment Configuration

#### Required Environment Variables

```env
# ===========================================
# SHARED PACKAGE CONFIGURATION
# (Used by @energismart/shared - DO NOT use for app-specific features)
# ===========================================
UPSTASH_REDIS_REST_URL=https://shared-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=shared-xxx

# Google OAuth (via @energismart/shared)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
AUTH_SECRET=xxx

# ===========================================
# APPLICATION-SPECIFIC CONFIGURATION
# ===========================================

# App-specific Redis (for caching, queues, rate limiting)
APP_REDIS_URL=https://app-xxx.upstash.io
APP_REDIS_TOKEN=app-xxx

# PostgreSQL Database
DATABASE_URL=postgresql://xxx

# Tripletex API
TRIPLETEX_CONSUMER_TOKEN=xxx
TRIPLETEX_EMPLOYEE_TOKEN=xxx
TRIPLETEX_API_BASE_URL=https://tripletex.no/v2

# Google Services
GEMINI_API_KEY=xxx
GOOGLE_MAPS_API_KEY=xxx

# Communication Services
SENDGRID_API_KEY=xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx

# File Storage
BLOB_READ_WRITE_TOKEN=xxx
```

---

## 4. Functional Requirements

### 4.1 Module: Service Agreements (SA)

#### SA-001: Service Agreement Creation
**Priority:** Critical

**Description:**
The system shall support creation of various service agreement types with flexible configuration and customizable add-on products.

**Agreement Types:**
| Type | Description | Typical Frequency | Includes |
|------|-------------|-------------------|----------|
| Basic | Annual inspection | 1x/year | Visual check, cleaning, report |
| Standard | Regular maintenance | 2x/year | Basic + performance analysis + minor adjustments |
| Premium | Complete service program | 4x/year | Standard + priority response + spare parts |
| Enterprise | Customized enterprise agreement | Custom | Fully customized SLA |

**Functional Requirements:**
- SA-001.1: Agreement wizard with step-by-step creation
- SA-001.2: Automatic price calculator based on system size and agreement type
- SA-001.3: Support for discount structures (volume, duration, early payment)
- SA-001.4: Digital signing via BankID or equivalent
- SA-001.5: Automatic linking to installation and customer data from Tripletex
- SA-001.6: Version control for agreement changes
- SA-001.7: Support for group agreements (multiple installations under one agreement)
- SA-001.8: Automatic PDF agreement generation from template
- SA-001.9: Customer data SHALL be fetched from Tripletex (read-only)

#### SA-002: Agreement Add-on Products
**Priority:** High

**Description:**
The system shall support customizing service agreements with add-on products from a configurable catalog.

**Add-on Product Categories:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    ADD-ON PRODUCT CATALOG                        │
├─────────────────────────────────────────────────────────────────┤
│  MAINTENANCE ADD-ONS                                             │
│  ├── Panel cleaning (per m²)                                    │
│  ├── Inverter deep cleaning                                     │
│  ├── Extended warranty coverage                                 │
│  └── Snow removal service                                       │
│                                                                  │
│  MONITORING ADD-ONS                                              │
│  ├── 24/7 performance monitoring                                │
│  ├── Real-time alerts                                           │
│  ├── Monthly performance reports                                │
│  └── Annual yield guarantee                                     │
│                                                                  │
│  PRIORITY ADD-ONS                                                │
│  ├── Same-day response                                          │
│  ├── Weekend service availability                               │
│  ├── Dedicated technician                                       │
│  └── Priority scheduling                                        │
│                                                                  │
│  EQUIPMENT ADD-ONS                                               │
│  ├── Spare parts coverage                                       │
│  ├── Battery health check                                       │
│  ├── Thermal imaging inspection                                 │
│  └── Electrical safety certification                            │
└─────────────────────────────────────────────────────────────────┘
```

**Functional Requirements:**
- SA-002.1: Configurable add-on product catalog with categories
- SA-002.2: Each add-on SHALL have a linked Tripletex product ID for invoicing
- SA-002.3: Support for quantity-based add-ons (e.g., per m², per visit)
- SA-002.4: Support for one-time and recurring add-ons
- SA-002.5: Custom pricing overrides per agreement
- SA-002.6: Add-on dependency rules (e.g., "Premium monitoring requires Standard agreement")
- SA-002.7: Add-on bundles/packages with discounted pricing
- SA-002.8: Visual add-on selector in agreement wizard
- SA-002.9: Automatic price recalculation when add-ons are modified
- SA-002.10: Add-on history tracking per agreement

#### SA-003: Agreement Administration
**Priority:** Critical

**Functional Requirements:**
- SA-003.1: Dashboard with overview of all active agreements
- SA-003.2: Filtering options (status, type, expiration date, customer, region)
- SA-003.3: Notifications for expiring agreements (90, 60, 30, 14, 7 days)
- SA-003.4: Automatic renewal process with customer confirmation
- SA-003.5: Handling of agreement upgrades and downgrades
- SA-003.6: Cancellation process with reason registration
- SA-003.7: History of all agreement changes
- SA-003.8: Export of agreement overview to Excel/CSV

#### SA-004: Pricing Models and Invoicing
**Priority:** High

**Supported Pricing Structures:**
```
┌─────────────────────────────────────────────────────────────────┐
│                     PRICING MODELS                               │
├─────────────────────────────────────────────────────────────────┤
│  1. Fixed Annual Price                                          │
│     └─ Based on: system size, agreement type, SLA               │
│                                                                  │
│  2. Price per kW                                                 │
│     └─ Scales with installation capacity                        │
│                                                                  │
│  3. Hybrid                                                       │
│     └─ Fixed base price + variable component + add-ons          │
│                                                                  │
│  4. Time-based (service on demand)                              │
│     └─ Hourly rates + travel + materials                        │
│                                                                  │
│  5. Performance-based                                            │
│     └─ Bonuses/reductions based on system performance           │
└─────────────────────────────────────────────────────────────────┘
```

**Functional Requirements:**
- SA-004.1: Pricing engine supporting all pricing models
- SA-004.2: Automatic price index regulation (CPI or fixed percentage)
- SA-004.3: Campaign codes and time-limited offers
- SA-004.4: Price simulation before agreement creation
- SA-004.5: Margin calculator for internal use
- SA-004.6: Add-on pricing integration with base agreement price

### 4.2 Module: Service Planning (SP)

#### SP-001: Annual Service Planning
**Priority:** Critical

**Description:**
The system shall automatically generate annual plans for all active service agreements.

**Functional Requirements:**
- SP-001.1: Automatic generation of service orders at agreement start
- SP-001.2: Consider seasonal variations (avoid snowy periods, prioritize spring/fall)
- SP-001.3: Customer preferences for timing (morning/afternoon, weekdays)
- SP-001.4: Geographic clustering for efficient route planning
- SP-001.5: Automatic adjustment for holidays and vacations
- SP-001.6: Capacity planning based on available technicians

**Season Matrix:**
| Month | Priority | Comment |
|-------|----------|---------|
| Jan-Feb | Low | Winter conditions, emergency only |
| Mar-Apr | High | Spring service, before peak production |
| May-Jun | Medium | Normal operations |
| Jul | Low | Holiday period |
| Aug-Sep | High | Fall service, before winter |
| Oct-Nov | Medium | Last window before winter |
| Dec | Low | Emergency only |

#### SP-002: Daily Dispatch and Route Optimization
**Priority:** Critical

**Functional Requirements:**
- SP-002.1: Drag-and-drop calendar interface for planners
- SP-002.2: AI-assisted route optimization (minimize driving, maximize visits)
- SP-002.3: Real-time tracking of technician positions
- SP-002.4: Automatic re-optimization on changes/cancellations
- SP-002.5: Consider technician competencies and certifications
- SP-002.6: Buffer time between assignments (default: 30 min)
- SP-002.7: Support for multi-technician assignments
- SP-002.8: Emergency planning for illness/absence

**Optimization Criteria:**
```
Priority order for route optimization:
1. SLA commitments (critical customers first)
2. Minimize total driving time
3. Technician competency match
4. Customer preferences
5. Minimize overtime
6. Even workload distribution among technicians
```

#### SP-003: Resource Management
**Priority:** High

**Functional Requirements:**
- SP-003.1: Technician profiles with competencies and certifications
- SP-003.2: Vacation planning and absence registration
- SP-003.3: Capacity view (available hours per week/month)
- SP-003.4: Automatic alerts for under-capacity
- SP-003.5: Support for contracted workers/subcontractors
- SP-003.6: Competency gap analysis and training needs
- SP-003.7: Integration with @energismart/shared for cross-app availability

**Competency Matrix:**
| Certification | Description | Required For |
|---------------|-------------|--------------|
| FSE | Electrical safety regulations | All electrical work |
| Solar Level 1 | Basic solar panel service | Basic agreements |
| Solar Level 2 | Advanced troubleshooting | Standard/Premium |
| BESS | Battery systems | All BESS installations |
| High Voltage | High voltage work | Large-scale installations |
| Roof/Fall | Work at heights | Roof installations |

### 4.3 Module: Field Work and Checklists (FW)

#### FW-001: Digital Checklists
**Priority:** Critical

**Description:**
The system shall have a flexible checklist system adapted to various installation types and service types.

**Checklist Categories:**
```
┌─────────────────────────────────────────────────────────────────┐
│                   CHECKLIST HIERARCHY                            │
├─────────────────────────────────────────────────────────────────┤
│  MASTER CHECKLISTS (templates)                                   │
│  ├── Solar Panel Systems                                        │
│  │   ├── Annual Inspection                                      │
│  │   ├── Semi-annual Maintenance                                │
│  │   ├── Quarterly Premium Service                              │
│  │   └── Troubleshooting/Repair                                 │
│  ├── Battery Systems (BESS)                                     │
│  │   ├── Annual Inspection                                      │
│  │   ├── Capacity Test                                          │
│  │   └── Troubleshooting                                        │
│  └── Combined Systems                                           │
│      └── Complete System Check                                  │
│                                                                  │
│  DYNAMIC ADDITIONS                                               │
│  ├── Based on installation age                                  │
│  ├── Based on previous findings                                 │
│  ├── Based on weather conditions                                │
│  └── Based on production deviation                              │
└─────────────────────────────────────────────────────────────────┘
```

**Functional Requirements:**
- FW-001.1: Checklist builder for creating and customizing templates
- FW-001.2: Version control on checklists
- FW-001.3: Conditional logic (show/hide items based on previous answers)
- FW-001.4: Support for various input types:
  - Yes/No/Not Applicable
  - Numeric values (with min/max validation)
  - Free text
  - Multiple choice
  - Image attachment (mandatory/optional)
  - Signature
  - GPS coordinates
  - Temperature reading
  - Electrical measurements

- FW-001.5: Automatic severity grading of findings:
  | Grade | Color | Action |
  |-------|-------|--------|
  | Critical | Red | Immediate follow-up required |
  | Serious | Orange | Schedule repair within 30 days |
  | Moderate | Yellow | Include in next service |
  | Minor | Green | Information only |

- FW-001.6: Offline support with automatic synchronization
- FW-001.7: Timestamps on all items
- FW-001.8: Ability to add ad-hoc items

#### FW-002: Example - Solar Panel Annual Inspection Checklist

**Category 1: Safety and Access**
| # | Check Point | Type | Mandatory |
|---|-------------|------|-----------|
| 1.1 | HSE assessment completed before start | Yes/No | Yes |
| 1.2 | Access to installation verified | Yes/No | Yes |
| 1.3 | Emergency shutdown identified and tested | Yes/No | Yes |
| 1.4 | Photo of HSE board/markings | Image | Yes |

**Category 2: Solar Panels**
| # | Check Point | Type | Mandatory |
|---|-------------|------|-----------|
| 2.1 | Visual inspection - physical damage | Yes/No + Image | Yes |
| 2.2 | Dirt/debris on panels | Scale 1-5 | Yes |
| 2.3 | Cleaning performed | Yes/No | No |
| 2.4 | Hotspot scanning | Thermal image | Conditional |
| 2.5 | Micro-cracks identified | Count | No |
| 2.6 | Mounting points checked | Yes/No | Yes |

**Category 3: Inverters**
| # | Check Point | Type | Mandatory |
|---|-------------|------|-----------|
| 3.1 | Inverter status OK | Yes/No | Yes |
| 3.2 | Error codes recorded | Text | Conditional |
| 3.3 | Firmware version | Text | Yes |
| 3.4 | Ventilation openings clean | Yes/No | Yes |
| 3.5 | AC/DC voltage measured | Numeric | Yes |
| 3.6 | Production reading | Numeric (kWh) | Yes |

**Category 4: Cables and Connections**
| # | Check Point | Type | Mandatory |
|---|-------------|------|-----------|
| 4.1 | Visual inspection of cables | Yes/No + Image | Yes |
| 4.2 | MC4 connectors checked | Yes/No | Yes |
| 4.3 | Ground fault test | Yes/No/Value | Yes |
| 4.4 | Cable penetrations sealed | Yes/No | Yes |

**Category 5: Mounting and Structure**
| # | Check Point | Type | Mandatory |
|---|-------------|------|-----------|
| 5.1 | Roof clamps/mounting system | Yes/No | Yes |
| 5.2 | Corrosion observed | Yes/No + Image | Conditional |
| 5.3 | Roof sealing OK | Yes/No | Yes |

**Category 6: Performance and Documentation**
| # | Check Point | Type | Mandatory |
|---|-------------|------|-----------|
| 6.1 | Comparison with expected production | Percentage | Yes |
| 6.2 | Deviation noted | Text | Conditional |
| 6.3 | Recommendations | Text | No |
| 6.4 | Customer signature | Signature | Yes |
| 6.5 | General comments | Text | No |

#### FW-003: Photo Documentation
**Priority:** High

**Functional Requirements:**
- FW-003.1: Mandatory photos per checkpoint (configurable)
- FW-003.2: Automatic GPS and timestamp on all photos
- FW-003.3: Image annotation (draw on image)
- FW-003.4: Image categorization (before/after, damage, general)
- FW-003.5: Automatic compression for mobile
- FW-003.6: Comparison with previous photos (same point)
- FW-003.7: AI-assisted image analysis (identify damage)

#### FW-004: Mobile Field Application
**Priority:** Critical

**Functional Requirements:**
- FW-004.1: Native-like performance (PWA or React Native)
- FW-004.2: Full offline functionality
- FW-004.3: Camera integration with overlay guide
- FW-004.4: Signature capture with finger/stylus
- FW-004.5: Automatic position tracking
- FW-004.6: Voice notes with transcription
- FW-004.7: Push notifications for new assignments
- FW-004.8: Navigation to next assignment (Google Maps integration)
- FW-004.9: Customer history available on device
- FW-004.10: Time registration with start/stop
- FW-004.11: Material/spare parts registration
- FW-004.12: Chat function with planner/office

### 4.4 Module: Reporting (RP)

#### RP-001: AI-Generated Service Reports
**Priority:** Critical

**Description:**
The system shall use Google Gemini to automatically generate professional service reports based on checklist data.

**Functional Requirements:**
- RP-001.1: Automatic report generation on checklist completion
- RP-001.2: Adaptation to customer segment (technical/non-technical)
- RP-001.3: Multilingual support (Norwegian Bokmål, Norwegian Nynorsk, English)
- RP-001.4: Include images with AI-generated captions
- RP-001.5: Summary of findings and recommendations
- RP-001.6: Comparison with previous service
- RP-001.7: PDF generation with EnergiSmart branding
- RP-001.8: Automatic sending to customer (email)
- RP-001.9: Manual editing option before sending

**AI Prompt Structure for Report Generation:**
```
SYSTEM: You are a service report generator for EnergiSmart Norge AS.
Generate a professional report based on checklist data.

CONTEXT:
- Customer name: {customer_name}
- System type: {system_type}
- Installation date: {install_date}
- Previous service: {last_service_date}

CHECKLIST DATA:
{checklist_json}

INSTRUCTIONS:
1. Write a short, positive summary (2-3 sentences)
2. List main findings categorized by severity
3. Provide concrete recommendations
4. Include production data and trends
5. Use professional but understandable language
6. Avoid technical jargon unless necessary
7. End with next scheduled service

FORMAT: Structured text suitable for PDF conversion
```

#### RP-002: Report Types
**Priority:** High

| Report Type | Recipient | Frequency | Content |
|-------------|-----------|-----------|---------|
| Service Report | Customer | Per visit | Findings, images, recommendations |
| Performance Report | Customer | Monthly/Quarterly | Production, trends, ROI |
| SLA Report | Enterprise Customer | Monthly | Response times, uptime, KPIs |
| Internal Report | Service Manager | Daily/Weekly | Capacity, efficiency, issues |
| Finance Report | Finance | Monthly | Invoicing, margin, outstanding |
| Customer Satisfaction | Management | Quarterly | NPS, feedback, trends |

#### RP-003: Dashboards and Visualization
**Priority:** High

**Functional Requirements:**
- RP-003.1: Real-time dashboard for service manager
- RP-003.2: Interactive charts and diagrams
- RP-003.3: Geographic view of assignments (map)
- RP-003.4: Drill-down capabilities (region → customer → installation)
- RP-003.5: Customizable widgets
- RP-003.6: Export to PDF/Excel
- RP-003.7: Scheduled reports (email)

**KPI Dashboard Elements:**
```
┌────────────────────────────────────────────────────────────────┐
│  SERVICE MANAGER DASHBOARD                                      │
├────────────┬────────────┬────────────┬────────────────────────┤
│  Today's   │  Week's    │  Month's   │  Critical Alerts       │
│  Jobs      │  Capacity  │  Trend     │                        │
│  [15/18]   │  [87%]     │  [↑12%]    │  [!] 3 SLA breaches    │
├────────────┴────────────┴────────────┴────────────────────────┤
│                                                                │
│  [MAP: Today's routes and technician positions]               │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  First-Time Fix Rate    │  Customer Satisfaction │  Avg Response │
│  [████████░░] 85%       │  [NPS: 52]             │  [4.2 hours]  │
├────────────────────────────────────────────────────────────────┤
│  Upcoming Renewals (30 days)           │  [12 agreements]      │
│  Expiring Warranties (90 days)         │  [8 installations]    │
└────────────────────────────────────────────────────────────────┘
```

### 4.5 Module: Invoicing (IN)

#### IN-001: Tripletex Integration
**Priority:** Critical

**Description:**
Full two-way integration with Tripletex for automated invoicing and customer data synchronization.

**Functional Requirements:**
- IN-001.1: Synchronization of customer data (Tripletex → SMS, read-only)
- IN-001.2: Automatic invoice generation on service completion
- IN-001.3: Support for various invoicing models:
  - Prepaid invoicing (annual/quarterly)
  - Postpaid invoicing per visit
  - Subscription invoicing
  - Time and materials
- IN-001.4: Automatic price calculator (labor + materials + travel)
- IN-001.5: Discount handling
- IN-001.6: Credit notes for deviations
- IN-001.7: Reminder automation (configurable intervals)
- IN-001.8: Payment reminders (SMS/email)
- IN-001.9: Finance reports and reconciliation

**Tripletex API Integration Points:**
| Endpoint | Direction | Use |
|----------|-----------|-----|
| /customer | Tripletex → SMS | Sync customer data (read-only) |
| /invoice | SMS → Tripletex | Create invoices |
| /product | Tripletex → SMS | Price lists and products |
| /order | SMS → Tripletex | Order registration |
| /payment | Tripletex → SMS | Payment status |
| /project | Bidirectional | Project linking |

**Customer Data Synchronization Rules:**
```
┌─────────────────────────────────────────────────────────────────┐
│              CUSTOMER DATA SYNC (Tripletex → SMS)                │
├─────────────────────────────────────────────────────────────────┤
│  SYNC TRIGGERS:                                                  │
│  ├── On-demand: When creating new agreement                     │
│  ├── Scheduled: Daily sync at 02:00                             │
│  ├── Webhook: On customer update in Tripletex                   │
│  └── Manual: Admin-triggered full sync                          │
│                                                                  │
│  SYNCED FIELDS (Read-Only in SMS):                              │
│  ├── tripletex_id (Primary Key)                                 │
│  ├── name                                                       │
│  ├── organization_number                                        │
│  ├── contact_person                                             │
│  ├── email                                                      │
│  ├── phone_number                                               │
│  ├── postal_address                                             │
│  ├── physical_address                                           │
│  ├── invoice_email                                              │
│  └── invoice_send_method                                        │
│                                                                  │
│  RULES:                                                          │
│  ├── NEVER create customer in SMS database directly             │
│  ├── NEVER modify customer data in SMS database                 │
│  ├── Always redirect customer edits to Tripletex                │
│  └── Log all sync operations for audit                          │
└─────────────────────────────────────────────────────────────────┘
```

#### IN-002: Invoicing Workflow
**Priority:** High

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Service   │────▶│  Validation │────▶│   Invoice   │────▶│   Sending   │
│  Completed  │     │   of Data   │     │  Generation │     │  (Tripletex)│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  Technician          Automatic          Tripletex API       E-invoice/
  completes           check of           call                EHF
  checklist           prices/hours
```

**Functional Requirements:**
- IN-002.1: Automatic validation of invoiceable elements
- IN-002.2: Approval workflow for large invoices
- IN-002.3: Combined invoice (multiple visits on one invoice)
- IN-002.4: Partial invoicing
- IN-002.5: Automatic VAT handling
- IN-002.6: Export to accounting system

### 4.6 Module: Customer Portal (CP)

#### CP-001: Self-Service Functions
**Priority:** High

**Functional Requirements:**
- CP-001.1: Secure login (BankID, email/password, SSO)
- CP-001.2: Overview of agreements and installations
- CP-001.3: History of service visits
- CP-001.4: Access to service reports (PDF)
- CP-001.5: Booking of ad-hoc service
- CP-001.6: Registration of error reports
- CP-001.7: Chat with support
- CP-001.8: Invoice overview and payment history
- CP-001.9: Update of contact information (synced back to Tripletex)
- CP-001.10: Notification settings

#### CP-002: Production Data and Performance
**Priority:** Medium

**Functional Requirements:**
- CP-002.1: Real-time production view (if integrated monitoring)
- CP-002.2: Historical production graphs
- CP-002.3: Comparison against expected performance
- CP-002.4: Savings calculator (NOK, CO2)
- CP-002.5: Downloadable reports
- CP-002.6: Alerts on production deviation

### 4.7 Module: Notifications and Communication (NC)

#### NC-001: Automatic Notifications
**Priority:** High

**Notification Events:**
| Event | Recipient | Channel | Timing |
|-------|-----------|---------|--------|
| New agreement created | Customer | Email | Immediately |
| Service scheduled | Customer | Email + SMS | 7 days before |
| Service reminder | Customer | SMS | 1 day before |
| Technician en route | Customer | SMS | 30 min before |
| Service completed | Customer | Email | Immediately |
| Report ready | Customer | Email | 24 hours after |
| Invoice sent | Customer | Email | Immediately |
| Agreement expiring | Customer | Email | 30 days before |
| Critical finding | Internal | Email + Push | Immediately |
| SLA breach imminent | Internal | Push | Immediately |

**Functional Requirements:**
- NC-001.1: Template system for all notifications (customizable)
- NC-001.2: Multilingual support
- NC-001.3: Notification preferences per customer
- NC-001.4: Escalation rules
- NC-001.5: Unsubscribe handling
- NC-001.6: Delivery log and error handling

---

## 5. Technical Requirements

### 5.1 Infrastructure

#### TR-001: Hosting and Deployment
**Priority:** Critical

**Requirements:**
- TR-001.1: Hosting on Vercel with automatic scaling
- TR-001.2: Edge functions for low latency
- TR-001.3: Automatic CI/CD via GitHub Actions
- TR-001.4: Preview deployments for all PRs
- TR-001.5: Rollback capability within 5 minutes
- TR-001.6: Multi-region deployment (Europe primary)

#### TR-002: Database
**Priority:** Critical

**PostgreSQL Requirements:**
- TR-002.1: Managed PostgreSQL (Neon, Supabase, or PlanetScale)
- TR-002.2: Automatic backup every 6 hours
- TR-002.3: Point-in-time recovery (30 days)
- TR-002.4: Read replicas for reporting
- TR-002.5: Connection pooling (PgBouncer)
- TR-002.6: Encrypted data at rest (AES-256)

**Redis Requirements (Shared - @energismart/shared):**
- TR-002.7: Managed Redis (Upstash) for shared package
- TR-002.8: Used for:
  - Session storage
  - User data caching
  - Cross-app employee availability
- TR-002.9: Separate configuration from app-specific Redis

**Redis Requirements (App-Specific):**
- TR-002.10: Separate Upstash Redis instance for application
- TR-002.11: Used for:
  - API rate limiting
  - Geolocation cache
  - Real-time updates
  - Job queues (Bull/BullMQ)
- TR-002.12: Persistence enabled
- TR-002.13: TTL policies for automatic cleanup

### 5.2 API Design

#### TR-003: API Architecture
**Priority:** High

**Requirements:**
- TR-003.1: REST API with OpenAPI 3.0 documentation
- TR-003.2: tRPC for internal frontend-backend communication
- TR-003.3: GraphQL support for customer portal (optional)
- TR-003.4: Versioning (v1, v2) in URL
- TR-003.5: Rate limiting (100 req/min standard, 1000 req/min authenticated)
- TR-003.6: Webhook support for integrations
- TR-003.7: CORS configuration for approved domains

### 5.3 Frontend

#### TR-004: Web Application
**Priority:** Critical

**Requirements:**
- TR-004.1: Next.js 14+ with App Router
- TR-004.2: Server Components as default
- TR-004.3: Optimistic UI updates
- TR-004.4: Responsive design (mobile-first)
- TR-004.5: Dark mode support
- TR-004.6: Accessibility (WCAG 2.1 AA)
- TR-004.7: Internationalization (i18n) ready
- TR-004.8: Lazy loading of components
- TR-004.9: Core Web Vitals optimization:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

#### TR-005: Mobile Application
**Priority:** High

**Choice: Progressive Web App (PWA) or React Native**

**PWA Requirements (recommended for Phase 1):**
- TR-005.1: Service Worker for offline functionality
- TR-005.2: Background sync for data transfer
- TR-005.3: Push notifications
- TR-005.4: App-like navigation
- TR-005.5: Installable on home screen
- TR-005.6: Camera access via Web API
- TR-005.7: Geolocation API

**React Native Requirements (optional for Phase 2):**
- TR-005.8: Shared codebase iOS/Android
- TR-005.9: Native camera with overlay
- TR-005.10: Background location
- TR-005.11: Offline-first architecture

---

## 6. Integrations

### 6.1 Tripletex

**INT-001: Tripletex API Integration**

**API Documentation:** https://tripletex.no/v2-docs/

**Scope:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    TRIPLETEX INTEGRATION                         │
├─────────────────────────────────────────────────────────────────┤
│  SYNCHRONIZATION (Tripletex → SMS, Read-Only)                   │
│  ├── Customers and contact persons                              │
│  ├── Products and price lists                                   │
│  ├── Projects                                                   │
│  └── Payment status                                             │
│                                                                  │
│  CREATION (SMS → Tripletex)                                     │
│  ├── Invoices                                                   │
│  ├── Credit notes                                               │
│  ├── Orders                                                     │
│  └── Time entries (if applicable)                               │
│                                                                  │
│  REPORTING                                                       │
│  └── Finance reports via Tripletex API                          │
│                                                                  │
│  IMPORTANT CONSTRAINTS:                                          │
│  ├── Customer data is READ-ONLY in SMS                          │
│  ├── All customer modifications MUST go through Tripletex       │
│  └── SMS maintains a cache, NOT a source of truth               │
└─────────────────────────────────────────────────────────────────┘
```

**Technical Requirements:**
- INT-001.1: Session token authentication (consumerToken + employeeToken)
- INT-001.2: Webhook reception for real-time updates
- INT-001.3: Daily batch synchronization (backup)
- INT-001.4: Error handling with retry logic
- INT-001.5: Logging of all API calls
- INT-001.6: Rate limit handling
- INT-001.7: Customer cache invalidation on Tripletex webhook

### 6.2 Shared Authentication Package

**INT-002: @energismart/shared Integration**

**Scope:**
```
┌─────────────────────────────────────────────────────────────────┐
│                 @energismart/shared INTEGRATION                  │
├─────────────────────────────────────────────────────────────────┤
│  AUTHENTICATION                                                  │
│  ├── Google OAuth via NextAuth.js                               │
│  ├── Session management                                         │
│  └── Permission checking                                        │
│                                                                  │
│  USER MANAGEMENT                                                 │
│  ├── SystemUser CRUD operations                                 │
│  ├── Role-based access control                                  │
│  └── App-specific permissions                                   │
│                                                                  │
│  EMPLOYEE DATA                                                   │
│  ├── Employee profiles                                          │
│  ├── Team assignments                                           │
│  └── Cross-app availability checking                            │
│                                                                  │
│  COMMON OPERATIONS                                               │
│  ├── isEmployeeAvailable() - Check across all EnergiSmart apps  │
│  ├── getEmployee()                                              │
│  └── Assignment synchronization                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**
```typescript
import type { 
  Employee, 
  Assignment, 
  SystemUser,
  Permission 
} from '@energismart/shared';

import { 
  getEmployee, 
  createAssignment,
  isEmployeeAvailable,
  hasPermission,
  hasAppAccess
} from '@energismart/shared';

// Check employee availability across all EnergiSmart apps
const checkAvailability = async (employeeId: string, date: string) => {
  const availability = await isEmployeeAvailable(employeeId, date);
  if (!availability.available) {
    console.log(`Blocked by: ${availability.blockedBy}`);
  }
  return availability;
};

// Verify user has access to this app
const verifyAccess = (user: SystemUser) => {
  return hasAppAccess(user, 'service-management');
};

// Check specific permission
const canCreateAgreement = (user: SystemUser) => {
  return hasPermission(user, 'agreements:write');
};
```

**Technical Requirements:**
- INT-002.1: Install @energismart/shared from GitHub
- INT-002.2: Configure shared Redis (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
- INT-002.3: Configure Google OAuth credentials
- INT-002.4: Use shared types for all employee and user operations
- INT-002.5: Always check cross-app availability before scheduling

### 6.3 Google Gemini AI

**INT-003: Gemini API Integration**

**Use Cases:**
| Function | Model | Description |
|----------|-------|-------------|
| Report Generation | Gemini Pro | Text based on checklist data |
| Image Analysis | Gemini Pro Vision | Identify damage on panels |
| Recommendations | Gemini Pro | Predictive maintenance suggestions |
| Chatbot | Gemini Pro | Customer service assistant |
| Voice Transcription | Gemini Pro | Voice notes → text |

**Technical Requirements:**
- INT-003.1: API key management via environment variables
- INT-003.2: Prompt versioning and testing
- INT-003.3: Fallback on API errors
- INT-003.4: Cost tracking and budget limits
- INT-003.5: Content filtering for output
- INT-003.6: Logging for prompt improvement

### 6.4 Google Maps Platform

**INT-004: Maps and Route Optimization**

**Services:**
- INT-004.1: Geocoding API (address → coordinates)
- INT-004.2: Distance Matrix API (travel time between points)
- INT-004.3: Directions API (optimal route)
- INT-004.4: Maps JavaScript API (map display)
- INT-004.5: Routes API (advanced route optimization)

### 6.5 Communication Services

**INT-005: Email and SMS**

**Requirements:**
- INT-005.1: SendGrid or Postmark for email
- INT-005.2: Twilio for SMS
- INT-005.3: Template engine for dynamic content
- INT-005.4: Delivery reporting
- INT-005.5: Bounce/complaint handling

### 6.6 Monitoring Integrations (Future)

**INT-006: Installation Monitoring**

**Potential Integrations:**
- INT-006.1: SolarEdge Monitoring API
- INT-006.2: Enphase Enlighten API
- INT-006.3: Fronius Solar.web API
- INT-006.4: Huawei FusionSolar API
- INT-006.5: Generic Modbus/API adapter

**Functionality:**
- Automatic alerts on production deviation
- Proactive service planning
- Remote diagnostics

---

## 7. Security and Compliance

### 7.1 Authentication and Authorization

**SEC-001: Identity Management**

**Requirements:**
- SEC-001.1: Multi-factor authentication (MFA) for all internal users
- SEC-001.2: BankID integration for customer portal (recommended)
- SEC-001.3: Role-Based Access Control (RBAC) via @energismart/shared
- SEC-001.4: Session timeout (30 min inactivity)
- SEC-001.5: Audit logging of all sensitive actions
- SEC-001.6: Password policy (min 12 characters, complexity)
- SEC-001.7: Account lockout after 5 failed attempts

**Roles and Permissions:**
| Role | Agreements | Planning | Checklists | Invoice | Admin |
|------|-----------|----------|------------|---------|-------|
| Admin | Full | Full | Full | Full | Full |
| ServiceManager | Full | Full | Read/Write | Read | Partial |
| Planner | Read | Full | Read | None | None |
| Technician | Read (own) | Read (own) | Full (own) | None | None |
| Finance | Read | Read | Read | Full | None |
| Customer | Read (own) | Read (own) | Read (own) | Read (own) | None |

### 7.2 Privacy (GDPR)

**SEC-002: GDPR Compliance**

**Requirements:**
- SEC-002.1: Privacy policy available
- SEC-002.2: Consent management
- SEC-002.3: Data Subject Access Request (DSAR) workflow
- SEC-002.4: Right to deletion implemented
- SEC-002.5: Data portability (JSON/CSV export)
- SEC-002.6: Data processing agreements with all subcontractors
- SEC-002.7: Privacy by Design in all development
- SEC-002.8: Data retention policies:
  | Data Type | Retention Period | After Deletion |
  |-----------|------------------|----------------|
  | Customer data | Agreement period + 3 years | Anonymized |
  | Service reports | 10 years | Archived |
  | Checklists | 10 years | Archived |
  | Log data | 2 years | Deleted |
  | Images | 5 years | Deleted |

### 7.3 Data Security

**SEC-003: Technical Security**

**Requirements:**
- SEC-003.1: HTTPS everywhere (TLS 1.3)
- SEC-003.2: Encryption of data in transit and at rest
- SEC-003.3: API keys in Secret Manager
- SEC-003.4: SQL injection protection (parameterized queries)
- SEC-003.5: XSS protection (Content Security Policy)
- SEC-003.6: CSRF tokens
- SEC-003.7: Rate limiting on all endpoints
- SEC-003.8: Security headers (HSTS, X-Frame-Options, etc.)
- SEC-003.9: Dependency scanning (Dependabot/Snyk)
- SEC-003.10: Annual penetration testing

### 7.4 Industry Regulations

**SEC-004: Electrical Safety**

**Requirements:**
- SEC-004.1: Checklists compliant with NEK 400
- SEC-004.2: Documentation for DSB reporting
- SEC-004.3: FSE compliance declarations stored
- SEC-004.4: Traceability of performed work
- SEC-004.5: Digital signature on safety-related work

---

## 8. User Experience

### 8.1 Design Principles

**UX-001: Overarching Principles**

1. **Efficiency first**: Minimize clicks for common tasks
2. **Contextual help**: Inline guidance where needed
3. **Consistency**: Same actions, same appearance
4. **Error tolerance**: Clear error messages, undo capability
5. **Progressive disclosure**: Hide complexity until needed
6. **Mobile-first**: Design for field first, then desktop

### 8.2 User Flows

**UX-002: Critical User Flows**

**Technician - Perform Service Visit:**
```
1. Open app → See today's assignments (automatic)
2. Tap "Start" on first assignment
   → GPS registered, customer notified
3. Navigate to customer (one-tap Google Maps)
4. Register arrival (automatic GPS or manual)
5. Complete checklist
   → Automatic saving throughout
   → Photos taken directly in app
6. Register any findings/deviations
7. Get customer signature
8. Tap "Complete"
   → Report generated automatically
   → Next assignment shown

MAX CLICKS: 10 for standard visit
```

**Planner - Plan the Week:**
```
1. Open dashboard → See week overview
2. Check capacity per technician
3. Drag pending assignments to calendar
   → Automatic route suggestions
4. Adjust as needed
5. Approve plan
   → Notifications sent automatically

MAX TIME: 30 min for full week (30 assignments)
```

### 8.3 Accessibility

**UX-003: WCAG 2.1 AA Compliance**

**Requirements:**
- UX-003.1: Keyboard navigation
- UX-003.2: Screen reader friendly markup
- UX-003.3: Color contrast minimum 4.5:1
- UX-003.4: Focus indicators visible
- UX-003.5: Alternative text on images
- UX-003.6: Resizable text (200%)
- UX-003.7: No flashing elements

---

## 9. AI and Automation

### 9.1 AI Features

**AI-001: Report Generation (MVP)**

**Functionality:**
- Automatic summary of checklist data
- Categorization of findings by severity
- Generation of recommendations
- Professional language adapted to recipient

**Implementation:**
```typescript
// Example: Gemini API call for report generation
const generateReport = async (
  checklistData: ChecklistData, 
  customerProfile: CustomerProfile
): Promise<ServiceReport> => {
  const prompt = `
    Based on the following checklist data for a solar panel installation,
    generate a professional service report in Norwegian.
    
    Customer info: ${JSON.stringify(customerProfile)}
    Checklist data: ${JSON.stringify(checklistData)}
    
    Include:
    1. Short summary (2-3 sentences)
    2. Main findings categorized (critical/important/minor)
    3. Recommended actions with prioritization
    4. Production analysis if data available
    5. Next recommended service
  `;
  
  return await gemini.generateContent(prompt);
};
```

**AI-002: Intelligent Planning (Phase 2)**

**Functionality:**
- Predictive capacity planning
- Optimal route suggestions based on history
- Automatic re-planning on changes
- Season-based recommendations

**AI-003: Predictive Maintenance (Phase 3)**

**Functionality:**
- Analysis of production data for anomalies
- Prediction of component failures
- Automatic generation of service orders
- ROI calculation for preventive measures

**AI-004: Image Analysis (Phase 3)**

**Functionality:**
- Automatic identification of panel damage
- Hotspot detection from thermal images
- Dirt level assessment
- Before/after comparison

### 9.2 Automation Rules

**AUTO-001: Event-Based Automation**

| Trigger | Action | Configurable |
|---------|--------|--------------|
| Agreement created | Generate service plan, send welcome | Yes |
| 30 days until service | Send reminder to customer | Yes |
| Service completed | Generate report, send to customer | Yes |
| Critical finding | Alert service manager, create follow-up | Yes |
| Agreement expires in 60 days | Start renewal process | Yes |
| Invoice unpaid 14 days | Send reminder | Yes |
| Technician delayed 30+ min | Notify customer automatically | Yes |

---

## 10. Reporting and Analytics

### 10.1 Standard Reports

**REP-001: Operational Reports**

| Report | Frequency | Content |
|--------|-----------|---------|
| Daily Summary | Daily | Completed/cancelled assignments, deviations |
| Weekly KPI | Weekly | FTFR, response time, capacity, NPS |
| Monthly Performance | Monthly | Trends, SLA compliance, finance |
| Quarterly Analysis | Quarterly | Strategic metrics, customer analysis |
| Annual Report | Annual | Complete overview, YoY comparison |

### 10.2 KPI Definitions

**REP-002: Key Metrics**

| KPI | Definition | Target | Calculation |
|-----|------------|--------|-------------|
| First-Time Fix Rate | Percent resolved on first visit | >85% | Resolved first visit / Total visits |
| Mean Time To Respond | Average response time | <24h (critical) | Sum response time / Number of inquiries |
| Technician Utilization | Productive time per day | >75% | Billable time / Available time |
| Customer Satisfaction | NPS score | >50 | (Promoters - Detractors) / Total |
| Agreement Renewal Rate | Renewal rate | >80% | Renewed / Expired same period |
| Service Revenue/Tech | Revenue per technician | Growing | Total service revenue / Number of technicians |
| SLA Compliance | SLA adherence | >95% | Within SLA / Total assignments |

### 10.3 Business Intelligence

**REP-003: Advanced Analytics**

**Functional Requirements:**
- REP-003.1: Ad-hoc queries via dashboard
- REP-003.2: Export to Excel/CSV for further analysis
- REP-003.3: Integration with BI tools (Power BI, Metabase)
- REP-003.4: Predictive analysis (churn, capacity)
- REP-003.5: Geographic analysis (heatmaps)
- REP-003.6: Trend analysis over time

---

## 11. Non-Functional Requirements

### 11.1 Performance

**NFR-001: Performance Requirements**

| Metric | Requirement | Comment |
|--------|-------------|---------|
| Page load | <2 seconds | 90th percentile |
| API response time | <200ms | 95th percentile |
| Database queries | <100ms | 95th percentile |
| Report generation | <30 seconds | Complex reports |
| Search | <500ms | Full-text search |
| File download | <5 seconds | <10MB files |

### 11.2 Scalability

**NFR-002: Scaling Requirements**

**Capacity Goals (Year 1-3):**
| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Active agreements | 500 | 1500 | 3000 |
| Monthly service visits | 200 | 600 | 1200 |
| Concurrent users | 20 | 50 | 100 |
| Data growth | 50GB | 200GB | 500GB |

### 11.3 Availability

**NFR-003: Uptime**

**Requirements:**
- NFR-003.1: 99.5% uptime (excluding planned maintenance)
- NFR-003.2: Max 4 hours downtime per month
- NFR-003.3: Recovery Time Objective (RTO): 4 hours
- NFR-003.4: Recovery Point Objective (RPO): 1 hour
- NFR-003.5: Planned maintenance: Sundays 02:00-06:00

### 11.4 Maintainability

**NFR-004: Code Quality**

**Requirements:**
- NFR-004.1: Test coverage >80%
- NFR-004.2: Automated E2E tests for critical flows
- NFR-004.3: Code review for all PRs
- NFR-004.4: API documentation (OpenAPI)
- NFR-004.5: Architecture documentation maintained
- NFR-004.6: Changelog for all releases
- NFR-004.7: All code naming in English (classes, variables, functions, etc.)

---

## 12. Implementation Plan

### 12.1 Phase Plan

**Phase 1: MVP (3-4 months)**

**Scope:**
- Basic agreement management
- Simple planning (manual)
- Digital checklists (1-2 templates)
- Basic mobile app (PWA)
- AI report generation (text)
- Tripletex integration (invoicing + customer sync)
- Internal user support
- Add-on product catalog (basic)

**Deliverables:**
- [ ] Data model and database
- [ ] @energismart/shared integration (auth + users)
- [ ] Agreement CRUD with add-ons
- [ ] Customer sync from Tripletex
- [ ] Checklist engine
- [ ] Mobile PWA (basic)
- [ ] Gemini report generation
- [ ] Tripletex invoice integration
- [ ] Admin dashboard

**Phase 2: Extended Functionality (2-3 months)**

**Scope:**
- Advanced planning with route optimization
- Customer portal
- Extended checklist library
- Complete notification system
- Dashboard and KPIs
- Mobile app improvements
- Add-on bundles and advanced pricing

**Deliverables:**
- [ ] Google Maps integration
- [ ] Route optimization
- [ ] Customer portal (basic)
- [ ] Email/SMS notifications
- [ ] KPI dashboard
- [ ] More checklist templates
- [ ] Offline improvements mobile
- [ ] Advanced add-on configuration

**Phase 3: Advanced (2-3 months)**

**Scope:**
- Predictive analysis
- AI image analysis
- Monitoring integrations
- Advanced reporting
- Customer portal extended
- Native mobile app (optional)

**Deliverables:**
- [ ] Predictive maintenance module
- [ ] Gemini Vision integration
- [ ] SolarEdge/Enphase API
- [ ] Advanced BI dashboard
- [ ] Customer portal full
- [ ] React Native app (optional)

### 12.2 Resource Requirements

**Team (recommended):**
| Role | Count | Responsibility |
|------|-------|----------------|
| Tech Lead/Architect | 1 | Architecture, code review, technical decisions |
| Full-stack Developer | 2 | Frontend + Backend development |
| UX/UI Designer | 0.5 | Design, prototyping, user testing |
| QA/Test | 0.5 | Testing, quality assurance |
| Project Manager | 0.5 | Coordination, reporting |

**Tools and Services (estimated monthly cost):**
| Service | Cost/month | Comment |
|---------|------------|---------|
| Vercel Pro | $20-50 | Hosting |
| PostgreSQL (Neon) | $25-100 | Database |
| Upstash Redis (Shared) | $10-25 | For @energismart/shared |
| Upstash Redis (App) | $10-25 | App-specific cache |
| Vercel Blob | $0-50 | File storage |
| Google Gemini API | $50-200 | AI services |
| Google Maps | $50-200 | Map services |
| SendGrid | $15-50 | Email |
| Twilio | $50-100 | SMS |
| **Total** | **$230-800** | |

### 12.3 Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Tripletex API changes | Medium | High | Abstraction layer, versioning |
| Gemini API cost overrun | Medium | Medium | Budget limits, caching |
| Offline sync conflicts | High | Medium | Conflict resolution logic |
| Performance at scale | Low | High | Load testing, caching |
| Mobile user adoption | Medium | Medium | UX testing, training |
| GDPR compliance gap | Low | High | Privacy review, DPO |
| Customer data sync issues | Medium | High | Robust error handling, manual override |

---

## 13. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| BESS | Battery Energy Storage System |
| FTFR | First-Time Fix Rate |
| FSE | Regulations on Safety in Electrical Installations |
| KPI | Key Performance Indicator |
| MVP | Minimum Viable Product |
| NPS | Net Promoter Score |
| PWA | Progressive Web App |
| RBAC | Role-Based Access Control |
| RTO | Recovery Time Objective |
| RPO | Recovery Point Objective |
| SLA | Service Level Agreement |
| SMS | Service Management System (in this context) |

### Appendix B: References

**Best Practice Sources:**
- ServiceMax Field Service Best Practices
- Salesforce Field Service Lightning
- Microsoft Dynamics 365 Field Service
- IFS Service Management
- Oracle Field Service Cloud

**Standards:**
- ISO 9001:2015 Quality Management
- ISO 27001 Information Security
- GDPR (EU 2016/679)
- NEK 400 Electrical Low Voltage Installations
- NS-EN 62446 Grid Connected PV Systems

**API Documentation:**
- Tripletex API: https://tripletex.no/v2-docs/
- @energismart/shared: Internal package documentation

### Appendix C: Checklist Templates (Complete)

*See separate document: EnergiSmart_Checklists_Complete.md*

### Appendix D: API Specifications

*See separate document: EnergiSmart_API_Specification.yaml (OpenAPI 3.0)*

### Appendix E: Wireframes and Mockups

*See separate document: EnergiSmart_Wireframes_Figma.pdf*

### Appendix F: Code Naming Conventions

**All code MUST use English for naming. Examples:**

| Norwegian Concept | English Code Name |
|-------------------|-------------------|
| Serviceavtale | ServiceAgreement |
| Sjekkliste | Checklist |
| Tekniker | Technician |
| Planlegger | Scheduler / Planner |
| Faktura | Invoice |
| Tilleggsprodukt | AddonProduct |
| Serviceleder | ServiceManager |
| Besøksfrekvens | VisitFrequency |
| Kundeportal | CustomerPortal |

---

**Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| CEO | _____________ | _____________ | ______ |
| CTO | _____________ | _____________ | ______ |
| Service Manager | _____________ | _____________ | ______ |

---

*This document is prepared for EnergiSmart Norge AS.  
All rights reserved by EnergiSmart Norge AS.*
