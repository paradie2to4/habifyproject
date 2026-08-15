# SMART RENTAL (Habify) — Intelligent Property Rental & Matching Platform

> **Production-Grade Full-Stack Real Estate Ecosystem**  
> *Engineered with Java 21, Spring Boot 3.3, Spring Security, Spring Data JPA, PostgreSQL, TypeScript, React, and Tailwind CSS.*

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [Problem Statement & Solution](#-problem-statement--solution)
3. [Key System Features](#-key-system-features)
4. [System Architecture](#-system-architecture)
5. [Smart Matching Algorithm & Heuristics](#-smart-matching-algorithm--heuristics)
6. [Intelligent Features Beyond Matching](#-intelligent-features-beyond-matching)
7. [Database Design & Relational Schema](#-database-design--relational-schema)
8. [Security & Authentication Architecture](#-security--authentication-architecture)
9. [REST API Specification](#-rest-api-specification)
10. [Project Directory Structure](#-project-directory-structure)
11. [Prerequisites & Getting Started](#-prerequisites--getting-started)
12. [Running with Docker Compose](#-running-with-docker-compose)
13. [Default Demo Accounts](#-default-demo-accounts)
14. [Automated Testing](#-automated-testing)
15. [Production Build & Packaging](#-production-build--packaging)
16. [Troubleshooting Guide](#-troubleshooting-guide)
17. [Interview Presentation Guide & 15 Deep-Dive Q&As](#-interview-presentation-guide--15-deep-dive-qas)

---

## 🌟 Project Overview

**Smart Rental (Habify)** is an intelligent property rental and multi-tenant matching platform engineered for modern urban housing markets, with realistic domain modeling tailored to Kigali and Rwanda's high-growth sectors (Kimihurura, Nyarutarama, Kacyiru, Gacuriro, Kibagabaga, Remera, Kiyovu, Kicukiro).

Unlike generic listing boards that rely solely on binary keyword filters, Smart Rental implements a **multidimensional 0–100 heuristic scoring engine** in Java 21 / Spring Boot 3. The algorithm quantifies budget flexibility, geographic alignment, bedroom thresholds, property types, and essential utility infrastructure (water storage tanks, solar water heating, 24/7 security guards, backup generators, high-speed fiber internet).

---

## 🎯 Problem Statement & Solution

### The Problems
1. **Search Fatigue**: Renters spend hours manually filtering through hundreds of unstructured listings, often encountering hidden constraints.
2. **Opaque Compatibility**: Prospective tenants don't know *why* a property is recommended or what trade-offs they are making until after they book an in-person viewing.
3. **Financial Overextension**: Renters frequently commit to leases exceeding 30% of their gross monthly income, causing lease defaults.
4. **Poor Landlord Listing Completeness**: Landlords upload sparse descriptions with missing critical utility data, leading to low inquiry conversion rates.

### The Solutions
- **7-Factor Weighted Matching Engine**: Evaluates budget, location, type, room count, furnishing, and amenities with transparent breakdown cards.
- **Explainable Recommendation Reasons**: Generates human-readable positive highlights and explicit trade-off warnings for every listing.
- **Built-In 30% Gross Income Affordability Evaluator**: Classifies properties as *Comfortable*, *Stretched*, or *High Risk* with tailored budgeting advice.
- **Automated Landlord Listing Quality Score (0–100%)**: Instant diagnostic scoring with actionable recommendations to maximize booking rates.
- **End-to-End Inquiry & Viewing Tour Workflow**: Complete appointment booking, status lifecycle tracking, and direct landlord communication.

---

## 🚀 Key System Features

### 👤 1. Prospective Tenants
- **Intelligent Property Discovery**: Filter by sector, rent range, bedroom count, property type, and amenities.
- **Weighted Recommendations Feed**: Properties ranked from highest compatibility to lowest with interactive breakdown modals.
- **Side-by-Side Property Comparison Matrix**: Compare up to 3 listings simultaneously across monthly rent, security deposit, square meters, furnishing, and infrastructure tags.
- **In-Person Tour Booking**: Request on-site viewings with instant date/time selection and live status tracking (Pending, Approved, Rejected, Completed).
- **Direct Landlord Inquiries**: Send messages with pre-populated inquiry templates.
- **Persistent Favorites**: Save preferred listings for quick offline review.

### 🏢 2. Landlords & Property Managers
- **Listing Portfolio Management**: Add, update, archive, and toggle availability across residential properties.
- **Automated Listing Quality Score (0–100%)**: Evaluates photo gallery depth, description richness, square meters, deposit terms, and infrastructure tags.
- **Viewing Request Processing**: Accept or reject tenant viewing appointments with instant feedback.
- **Inquiry Management Center**: Review tenant questions and maintain contact histories.
- **Portfolio Performance Metrics**: View count analytics, average listing quality, and tenant engagement rates.

### 🛡️ 3. System Administrators
- **Platform Health & Metrics**: Total registered tenants, verified landlords, active properties, and average market rent.
- **Listing Moderation & Fraud Prevention**: Review user-submitted fraud or misrepresentation reports with 1-click suspension.
- **User Governance**: Deactivate suspicious accounts or reactivate verified users.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND CLIENT LAYER                              │
│  - TypeScript & React 18+ (SPA with Vite / Next.js architecture)       │
│  - Tailwind CSS Utility Design System (Navy / Emerald / Neutral)       │
│  - Interactive Role Switcher & Live Architecture Inspector             │
│  - Spatial Geographic Map Visualizer & Multi-Factor Sliders            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ RESTful APIs / JSON (Stateless JWT)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICE LAYER (Java 21 / Spring Boot 3)     │
│  - SmartMatchingService (Multidimensional Heuristic Scoring Engine)    │
│  - AffordabilityService (30% Gross Income Rule Evaluator)              │
│  - ListingQualityService (Completeness & Conversion Diagnostic Engine) │
│  - PropertyService, ViewingRequestService, InquiryService, AuthService │
│  - Spring Security (Stateless JWT Authentication & BCrypt Encryption)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Spring Data JPA / Hibernate ORM
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER (PostgreSQL 16)                     │
│  - Normalized Relational Tables with Foreign Keys & Constraints       │
│  - Indexed on location_sector, monthly_rent, property_type, available  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Smart Matching Algorithm & Heuristics

The core differentiator is implemented in `SmartMatchingService.java`. The algorithm computes a normalized **0–100 Match Score** using a weighted multi-factor heuristic:

$$\text{Match Score} = S_{\text{budget}} + S_{\text{location}} + S_{\text{type}} + S_{\text{bedrooms}} + S_{\text{furnishing}} + S_{\text{amenities}}$$

### Factor Weights & Scoring Breakdown

| Factor | Max Points | Evaluation Algorithm |
| :--- | :---: | :--- |
| **Budget Compatibility** | **30 pts** | • **30 pts**: `rent <= maxBudget`<br>• **20 pts**: `rent` exceeds budget by $\le 10\%$ (minor stretch)<br>• **10 pts**: `rent` exceeds budget by $10\% - 25\%$ (moderate stretch)<br>• **0 pts**: `rent` exceeds budget by $> 25\%$ (severe over-budget) |
| **Location Match** | **25 pts** | • **25 pts**: Property `locationSector` matches any preferred sector or if tenant has no location restriction.<br>• **5 pts**: Baseline credit if located in an adjacent/unspecified sector. |
| **Property Type** | **15 pts** | • **15 pts**: Exact match with preferred types (Apartment, Villa, House, Studio, Townhouse, Duplex).<br>• **4 pts**: Partial credit for alternative residential types. |
| **Bedroom Count** | **10 pts** | • **10 pts**: `bedrooms >= minBedrooms`<br>• **3 pts**: Below minimum required bedrooms. |
| **Furnishing Status** | **10 pts** | • **10 pts**: Meets requirement (e.g. Furnished matches Furnished Required, or no preference).<br>• **0 pts**: Unfurnished when tenant strictly required furnished. |
| **Amenities Overlap** | **10 pts** | $\text{Score} = \text{round}\left(\frac{|\text{PropAmenities} \cap \text{PrefAmenities}|}{|\text{PrefAmenities}|} \times 10\right)$ (Jaccard-style overlap) |

### Transparent Match Reasons
For every property, the engine generates:
1. **Strengths / Positive Highlights**: e.g., *"RWF 50,000 under your maximum budget"*, *"Located in your preferred Kigali sector (Kimihurura)"*, *"Includes 4 of your preferred amenities"*, *"Passed 30% affordability rule"*.
2. **Trade-offs / Warning Alerts**: e.g., *"Exceeds budget by RWF 80,000 (+10%)"*, *"Located in Gisozi instead of preferred sectors"*, *"Missing requested: Backup Generator, Swimming Pool"*.

---

## 💡 Intelligent Features Beyond Matching

### 1. 30% Gross Income Affordability Engine (`AffordabilityService.java`)
Calculates the rent-to-income percentage ($\frac{\text{Rent}}{\text{Monthly Gross Income}} \times 100$) and categorizes financial health:
- **COMFORTABLE ($\le 30\%$)**: Leaves 70%+ for living expenses, utilities, and savings.
- **STRETCHED ($31\% - 40\%$)**: Moderate financial friction; requires tight utility budgeting.
- **HIGH RISK ($> 40\%$)**: Severe rent burden; platform recommends options under $0.30 \times \text{Income}$.

### 2. Landlord Listing Quality Diagnostic Engine (`ListingQualityService.java`)
Evaluates listing attractiveness (0–100%) across 6 criteria:
- **Photo Gallery Depth (25 pts)**: 4+ photos = 25 pts; 2-3 photos = 18 pts; 1 photo = 10 pts.
- **Description Richness (20 pts)**: 120+ characters detailing transport, vibe, security = 20 pts.
- **Infrastructure & Amenities (20 pts)**: 5+ infrastructure tags = 20 pts.
- **Floor Area Dimensions (15 pts)**: Explicit square meters specified = 15 pts.
- **Security Deposit Transparency (10 pts)**: Explicit deposit terms stated = 10 pts.
- **Precise Physical Address (10 pts)**: Sector, street, and cell designated = 10 pts.

---

## 🗄️ Database Design & Relational Schema

Designed with strict normalization, referential integrity, foreign key cascades, and performance indexing in PostgreSQL:

```sql
-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'TENANT', 'LANDLORD', 'ADMIN'
    phone VARCHAR(30),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Properties Table
CREATE TABLE properties (
    id VARCHAR(50) PRIMARY KEY,
    landlord_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    location_sector VARCHAR(80) NOT NULL,
    address VARCHAR(200) NOT NULL,
    monthly_rent NUMERIC(12, 2) NOT NULL,
    security_deposit NUMERIC(12, 2),
    property_type VARCHAR(40) NOT NULL,
    bedrooms INT NOT NULL DEFAULT 1,
    bathrooms INT NOT NULL DEFAULT 1,
    size_sqm NUMERIC(8, 2),
    is_furnished BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    amenities TEXT,
    images TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tenant Preferences Table
CREATE TABLE tenant_preferences (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_budget NUMERIC(12, 2) NOT NULL,
    preferred_locations TEXT,
    preferred_property_types TEXT,
    min_bedrooms INT DEFAULT 1,
    furnished_required BOOLEAN DEFAULT FALSE,
    preferred_amenities TEXT,
    monthly_income NUMERIC(12, 2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Viewing Requests Table
CREATE TABLE viewing_requests (
    id VARCHAR(50) PRIMARY KEY,
    property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewing_date DATE NOT NULL,
    time_slot VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Inquiries Table
CREATE TABLE inquiries (
    id VARCHAR(50) PRIMARY KEY,
    property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(150),
    message TEXT NOT NULL,
    response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Favorites Table
CREATE TABLE favorites (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, property_id)
);

-- 7. Property Reports Table (Moderation)
CREATE TABLE property_reports (
    id VARCHAR(50) PRIMARY KEY,
    property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reporter_id VARCHAR(50) NOT NULL REFERENCES users(id),
    reason VARCHAR(200) NOT NULL,
    details TEXT,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'RESOLVED', 'DISMISSED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX idx_prop_sector ON properties(location_sector);
CREATE INDEX idx_prop_rent ON properties(monthly_rent);
CREATE INDEX idx_prop_available ON properties(is_available);
CREATE INDEX idx_viewing_landlord ON viewing_requests(landlord_id);
```

---

## 🔒 Security & Authentication Architecture

1. **Stateless JWT Tokens**: Tokens signed using HMAC-SHA256 with 24-hour expiration (`io.jsonwebtoken:jjwt`).
2. **BCrypt Password Hashing**: Passwords stored exclusively as one-way salted hashes (`BCryptPasswordEncoder` with strength 12).
3. **Role-Based Access Control (RBAC)**: Endpoint-level security enforcement using Spring Security `@PreAuthorize`:
   - `ROLE_TENANT`: View recommendations, manage own preferences, book viewings, send inquiries.
   - `ROLE_LANDLORD`: Create/edit own listings, approve/reject viewing tours, manage inquiry replies.
   - `ROLE_ADMIN`: Platform analytics, user activation/deactivation, listing moderation.
4. **Centralized Exception Handling**: `GlobalExceptionHandler` intercepts validation errors, resource not found exceptions, and unauthorized access attempts returning structured RFC 7807 error responses.

---

## 📡 REST API Specification

### Authentication Endpoints
- `POST /api/auth/register` — Register a new tenant or landlord user.
- `POST /api/auth/login` — Authenticate credentials and receive a stateless JWT Bearer token.
- `GET /api/auth/me` — Retrieve current authenticated user profile.

### Property & Search Endpoints
- `GET /api/properties` — Discover available listings with sector, rent, bed, and amenity filters.
- `GET /api/properties/{id}` — Get single property details (automatically increments view counter).
- `POST /api/properties` — Create a new listing (`ROLE_LANDLORD`).
- `PUT /api/properties/{id}` — Update existing listing (`ROLE_LANDLORD`).
- `DELETE /api/properties/{id}` — Archive/remove property listing (`ROLE_LANDLORD` / `ROLE_ADMIN`).

### Smart Recommendation & Scoring Endpoints
- `GET /api/recommendations` — Returns properties ranked by 0–100 match score with transparent reasons.
- `POST /api/recommendations/evaluate/{propertyId}` — Evaluates custom tenant preference against a target property.
- `GET /api/affordability?income=1000000&rent=300000` — Computes 30% gross income evaluation and financial status.
- `GET /api/landlord/properties/{id}/quality` — Returns 0–100% listing quality diagnostic and tips.

### Viewing Tours & Inquiries
- `POST /api/viewings` — Submit tour inspection request (`ROLE_TENANT`).
- `GET /api/viewings/my-requests` — Get tenant's viewing schedule (`ROLE_TENANT`).
- `GET /api/viewings/landlord-requests` — Get incoming viewing requests (`ROLE_LANDLORD`).
- `PUT /api/viewings/{id}/status` — Approve or reject appointment (`ROLE_LANDLORD`).
- `POST /api/inquiries` — Submit direct inquiry message (`ROLE_TENANT`).
- `GET /api/inquiries` — List inquiries with responses.

### Administrative Governance
- `GET /api/admin/dashboard` — Platform key performance metrics and statistics.
- `GET /api/admin/users` — List registered accounts.
- `PUT /api/admin/users/{id}/toggle-status` — Activate or suspend account.
- `GET /api/admin/reports` — Review flagged fraudulent properties.

---

## 📂 Project Directory Structure

```
smart-rental/
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/smartrental/
│       │   │   ├── SmartRentalApplication.java
│       │   │   ├── config/ (SecurityConfig, JwtUtils, CorsConfig)
│       │   │   ├── controller/ (PropertyController, SmartMatchingController, etc.)
│       │   │   ├── dto/ (MatchExplanationDto, ListingQualityDto, etc.)
│       │   │   ├── entity/ (Property, User, TenantPreference, etc.)
│       │   │   ├── repository/ (PropertyRepository, UserRepository, etc.)
│       │   │   └── service/ (SmartMatchingService, AffordabilityService, ListingQualityService)
│       │   └── resources/
│       │       └── application.yml
│       └── test/
│           └── java/com/smartrental/service/
│               ├── SmartMatchingServiceTest.java
│               ├── AffordabilityServiceTest.java
│               ├── ListingQualityServiceTest.java
│               └── PropertyServiceTest.java
├── src/ (React / Next.js / TypeScript Frontend)
│   ├── components/ (Navbar, DemoBar, PropertyCard, Modals, MapVisualizer)
│   ├── context/ (AppContext with reactive state engine)
│   ├── types.ts (TypeScript interfaces and enums)
│   └── views/ (BrowseView, RecommendationsView, Dashboards, Inquiries)
├── docker-compose.yml
├── .env.example
├── RUNNING.md
└── README.md
```

---

## 🛠️ Prerequisites & Getting Started

### Prerequisites
- **Node.js**: v18.0+
- **JDK**: Java 21+ (Eclipse Temurin, OpenJDK)
- **Maven**: 3.9+
- **PostgreSQL**: 15+ (or Docker)

### Option 1: Running the Complete Client Application
```bash
# 1. Install frontend dependencies
npm install

# 2. Run development server (binds to port 3000)
npm run dev
```

### Option 2: Running the Spring Boot Java Backend
```bash
# Navigate to backend directory
cd backend

# Execute unit tests
mvn test

# Start the Spring Boot REST server
mvn spring-boot:run
```

---

## 🐳 Running with Docker Compose

One-command setup for PostgreSQL and the Java Spring Boot service:
```bash
# Start all containers in background mode
docker-compose up --build -d

# Verify health status
docker-compose ps

# View backend application logs
docker-compose logs -f backend
```

---

## 🔑 Default Demo Accounts

| Role | User Name | Email | Password | Primary Showcase Workflows |
| :--- | :--- | :--- | :--- | :--- |
| **TENANT** | Claire Mukamana | `claire.tenant@habify.rw` | `password123` | Smart recommendations, trade-off analysis, affordability gauge, viewing booking |
| **LANDLORD** | Jean-Paul Nzeyimana | `jeanpaul.landlord@habify.rw` | `password123` | Listing quality score (0-100%), add/edit properties, approve/reject viewing tours |
| **ADMIN** | Eric Habimana | `admin@habify.rw` | `admin123` | System metrics, user governance, fraudulent listing moderation |

---

## 🧪 Automated Testing

The Java backend contains automated unit tests covering key business logic:

```bash
cd backend
mvn test
```

### Test Coverage Highlights
1. **`SmartMatchingServiceTest`**: Tests 100/100 perfect match, linear budget penalty calculations (10%, 25%, >25%), sector mismatch handling, furnishing requirement penalties, and Jaccard amenities overlap ratios.
2. **`AffordabilityServiceTest`**: Tests COMFORTABLE ($\le 30\%$), STRETCHED ($31\%-40\%$), and HIGH RISK ($>40\%$) classifications and disposable income math.
3. **`ListingQualityServiceTest`**: Tests 100% EXCELLENT rating generation for complete listings and actionable recommendations for sparse listings.
4. **`PropertyServiceTest`**: Tests CRUD operations, automated ID/timestamp generation, and view count increments.

---

## 📦 Production Build & Packaging

```bash
# Package Java Spring Boot into executable JAR
cd backend
mvn clean package -DskipTests
# Result: backend/target/smart-rental-backend-1.0.0.jar

# Build production frontend static assets
npm run build
```

---

## 🔧 Troubleshooting Guide

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| `Connection refused: localhost:5432` | PostgreSQL is not running | Run `docker-compose up -d postgres` or verify local Postgres service status. |
| `401 Unauthorized` on API endpoints | Missing or expired JWT token | Pass `Authorization: Bearer <token>` in the HTTP request headers. |
| `Port 8080 already in use` | Another service is using port 8080 | Change `server.port` in `application.yml` or stop conflicting process. |

---

## 🎤 Interview Presentation Guide & 15 Deep-Dive Q&As

### ⏱️ 30-Second Elevator Pitch
> *"Smart Rental (Habify) is a full-stack real estate and property matching platform built in Java 21, Spring Boot 3, and React. Instead of relying on rigid keyword search, it features an intelligent multi-factor heuristic scoring engine that evaluates budget limits, geographic sectors, bedroom counts, and critical infrastructure like water storage tanks and backup generators. The system produces transparent 0–100 compatibility scores with human-readable reasons and trade-offs, alongside built-in 30% gross income affordability calculations and automated landlord listing quality diagnostics."*

### ⏱️ 2-Minute Architecture Deep-Dive
> *"The system is designed with a modern decoupled architecture. On the frontend, React and TypeScript deliver an interactive experience with responsive filtering, map exploration, side-by-side comparison, and 1-click persona switching for Tenants, Landlords, and Admins.*
>
> *On the backend, a Java 21 Spring Boot application exposes clean RESTful endpoints organized into Controller-Service-Repository layers. Authentication is stateless using JWT tokens and BCrypt password encryption with role-based method security. Business logic is encapsulated into specialized services:*
> 1. *SmartMatchingService calculates weighted scores and builds positive match highlights and trade-off lists.*
> 2. *AffordabilityService calculates rent-to-income ratios and gives budgeting guidance.*
> 3. *ListingQualityService scores landlord listings from 0 to 100% and generates actionable tips.*
>
> *Persistence is handled through Spring Data JPA and PostgreSQL with normalized tables, foreign key constraints, and sector/rent indexes. The codebase is tested with JUnit 5 and Mockito."*

---

### 💬 15 Likely Interviewer Questions & Technical Answers

#### 1. Why did you choose a weighted heuristic scoring algorithm rather than a machine learning model?
**Answer:** A weighted heuristic scoring model provides **100% explainability, zero cold-start latency, and instant deterministic scoring**. In rental discovery, users must understand *why* a property scored 92% (e.g. *"RWF 50k under budget, matches 2-bed requirement, but missing backup generator"*). ML models often operate as black boxes and require thousands of historical booking interactions before making meaningful recommendations.

#### 2. How does the budget scoring factor handle properties slightly over budget?
**Answer:** Rather than abruptly dropping the score to zero, `SmartMatchingService` implements a **tiered linear penalty**:
- `rent <= maxBudget`: Full 30 points.
- Excess $\le 10\%$: 20 points (minor stretch).
- Excess $10\% - 25\%$: 10 points (moderate stretch).
- Excess $> 25\%$: 0 points.
This accommodates real-world renters who are willing to stretch 5–10% for an ideal property.

#### 3. How do you prevent SQL injection and ensure data safety?
**Answer:** We use **Spring Data JPA and Hibernate with parameterized queries and PreparedStatement binding** behind the scenes. User inputs are never concatenated directly into raw SQL strings. Input parameters are validated at the controller boundary using Jakarta Bean Validation (`@Valid`, `@NotNull`, `@Min`, `@Size`).

#### 4. How does the stateless JWT authentication workflow operate?
**Answer:** When a user logs in via `POST /api/auth/login`, Spring Security verifies credentials using `BCryptPasswordEncoder`. Upon success, `JwtUtils` generates a cryptographically signed HMAC-SHA256 token containing the user's ID, email, and role authorities. Subsequent requests include the token in the `Authorization: Bearer <token>` header, parsed by `JwtAuthenticationFilter` before reaching the controller.

#### 5. How are database relationships modeled between Properties, Users, and Viewing Requests?
**Answer:** We maintain a normalized relational model:
- `users` is the master entity with roles (`TENANT`, `LANDLORD`, `ADMIN`).
- `properties` has a `ManyToOne` foreign key referencing `users(id)` as `landlord_id`.
- `viewing_requests` acts as a junction entity maintaining foreign keys to both `properties(id)` and `users(id)` (`tenant_id` and `landlord_id`) with date, time slot, and status enums.
- Indexes are placed on `location_sector`, `monthly_rent`, and `is_available` for sub-millisecond query filtering.

#### 6. How does the 30% gross income affordability check work?
**Answer:** It implements the standard financial guideline where housing costs should not exceed 30% of gross income. The service computes $\frac{\text{Rent}}{\text{Monthly Income}} \times 100$. If $\le 30\%$, it returns `COMFORTABLE`. If between $31\% - 40\%$, it returns `STRETCHED`. Above $40\%$, it flags `HIGH_RISK` and provides advice on maximum recommended rent.

#### 7. How does the Landlord Listing Quality score benefit the platform?
**Answer:** Incomplete listings suffer from poor conversion rates. `ListingQualityService` evaluates 6 factors (photos, 120+ char description, 5+ amenities, square meters, security deposit, physical address) and awards a 0–100% score. It generates specific recommendations such as *"Add at least 4 photos"* or *"Specify floor area in m²"*, helping landlords improve their listings.

#### 8. How did you structure testing in Spring Boot?
**Answer:** We use **JUnit 5** and **Mockito**. Unit tests in `SmartMatchingServiceTest` verify edge cases like exact budget matches, budget penalties, location mismatches, and amenities overlap. `PropertyServiceTest` uses Mockito mocks (`@Mock`, `@InjectMocks`) to test CRUD logic, view counter increments, and automatic ID generation without needing an active database connection.

#### 9. Why did you use Spring Security with method-level `@PreAuthorize` annotations?
**Answer:** Method-level security enforces fine-grained authorization directly on service and controller methods based on user roles (e.g. `@PreAuthorize("hasRole('LANDLORD')")` on property creation and viewing approval). This prevents unauthorized role escalation even if an API route is accessed directly.

#### 10. How do you handle exceptions across REST controllers?
**Answer:** We use a `@RestControllerAdvice` class (`GlobalExceptionHandler`) with `@ExceptionHandler` methods for `ResourceNotFoundException`, `MethodArgumentNotValidException`, and general `Exception`. It transforms runtime errors into clean, structured JSON responses containing timestamps, HTTP status codes, error messages, and validation field details.

#### 11. How are amenities stored and evaluated in the database?
**Answer:** Amenities are stored as comma-delimited strings in `Property.amenities` and parsed into normalized sets during matching. The matching engine compares tenant-requested amenities against property amenities using case-insensitive set intersection to calculate the match percentage.

#### 12. How does the platform scale if property listings reach hundreds of thousands?
**Answer:** 
1. Database indexing on `location_sector`, `monthly_rent`, and `property_type` allows fast pre-filtering before scoring.
2. Pagination (`Pageable` in Spring Data JPA) limits the result set.
3. Matching calculations can be cached using Redis for frequently requested tenant preference hashes.

#### 13. What is the difference between DTOs and Entities in your architecture?
**Answer:** Entities (`Property`, `User`, `TenantPreference`) represent the persistent relational database tables mapped via JPA. DTOs (`PropertyRecommendationDto`, `MatchExplanationDto`, `ListingQualityDto`, `AffordabilityCalculationDto`) decouple internal database structure from the public API, prevent accidental field exposure (e.g. password hashes), and structure computed response payloads.

#### 14. What were the most challenging engineering decisions in this project?
**Answer:** Designing a scoring algorithm that feels intuitive and balanced. Early iterations penalized over-budget properties too harshly (0 score for 1 RWF over). We introduced the tiered penalty curve so near-matches remain visible with a clear trade-off explanation. Another challenge was crafting human-readable reason strings dynamically based on individual factor outcomes.

#### 15. If you had another sprint, what would you add next?
**Answer:** 
1. Integration with Rwanda MTN Mobile Money / Airtel Money APIs for automated security deposit escrow payments.
2. WebSocket-based real-time chat between tenants and landlords.
3. Automated lease agreement generation in PDF format with digital signatures.
