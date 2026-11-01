# Graph Report - POS  (2026-11-01)

## Corpus Check
- 225 files · ~99,485 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 37 file(s) not represented in the graph (top: (none) 25, .example 3, .css 3)

## Summary
- 1219 nodes · 2529 edges · 98 communities (35 shown, 63 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e4c872c7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ref_react
- composer.json
- main.py
- useCartStore
- TestCase
- Illuminate\Database\Eloquent\Model
- Illuminate\Http\Request
- cafe-frontend/package.json
- pos-backend/package.json
- Product
- pos-frontend/package.json
- cafe-frontend/src/api/client.js
- ErrorBoundary
- Ingredient
- ☕ Sistem Kasir & ERP Mini F&B — Arunika POS Suite
- Controller
- 👔 5. Admin Backoffice Suite (`/api/admin/*`)
- User
- Order
- OrderPricingServiceTest
- WebAudioEngine
- Illuminate\Database\Schema\Blueprint
- Button
- api.php
- cafe-frontend/src/router.jsx
- InventoryServiceTest
- OrderWorkflowAndIntegrityTest
- OrderController.php
- HistoryPage.jsx
- Shift
- MasterReportExcelService
- MenuPage.jsx
- StockForecastingService.php
- Table
- 2. Service Layer Pattern (Backend Architecture)
- Illuminate\Support\Facades\Schema
- AdminModifierController
- HomePage.jsx
- StockForecastingService
- OwnerMorningDigestMail
- AiInsightService
- ReconciliationService
- IngredientInventoryTest
- menuStore.js
- .handle
- manifest.json
- Illuminate\Database\Migrations\Migration
- ProductController
- DatabaseSeeder
- ForecastingServiceTest
- Closure
- 📋 Rencana Pengembangan: Smart Inventory Forecasting (Hybrid Event-Driven Engine) & AI Executive Briefing
- bootstrap/app.php
- DigestController.php
- pos-backend/README.md
- UserFactory.php
- 2026_10_23_000002_add_procurement_fields_to_ingredients_and_snapshots.php
- AppServiceProvider
- 0001_01_01_000000_create_users_table.php
- 0001_01_01_000002_create_jobs_table.php
- AdminCategoryController
- SettingController
- 0001_01_01_000001_create_cache_table.php
- 2026_09_04_000004_update_stock_mutations_table.php
- 2026_09_15_000001_add_void_fields_to_orders_table.php
- 2026_10_23_000001_create_forecast_snapshots_and_briefing_logs_table.php
- 2026_10_30_000001_add_customer_name_and_notes_to_orders_table.php
- 🧭 Codemap & Panduan Pengembangan
- ExampleTest
- 2026_08_29_063202_create_personal_access_tokens_table.php
- 2026_08_29_093504_create_tables_table.php
- 2026_08_29_093514_create_products_table.php
- 2026_08_29_093521_create_modifier_groups_table.php
- 2026_08_29_093527_create_modifier_items_table.php
- 2026_08_29_093532_create_shifts_table.php
- 2026_08_29_093537_create_orders_table.php
- 2026_08_29_093856_create_product_modifier_group_table.php
- 2026_09_02_000000_create_held_orders_table.php
- 2026_09_02_110000_create_stock_mutations_table.php
- 2026_09_04_000001_create_ingredients_table.php
- 2026_09_04_000002_create_product_ingredients_table.php
- 2026_09_04_000003_create_waste_records_table.php

## God Nodes (most connected - your core abstractions)
1. `Controller` - 41 edges
2. `Product` - 38 edges
3. `User` - 34 edges
4. `Ingredient` - 32 edges
5. `StockMutation` - 29 edges
6. `Order` - 28 edges
7. `Button()` - 27 edges
8. `api` - 25 edges
9. `useCartStore` - 24 edges
10. `TestCase` - 24 edges

## Surprising Connections (you probably didn't know these)
- `B. `OrderPricingService`` --references--> `OrderPricingService`  [INFERRED]
  docs/DOMAIN.md → pos-backend/app/Services/OrderPricingService.php
- `C. `ReconciliationService`` --references--> `ReconciliationService`  [INFERRED]
  docs/DOMAIN.md → pos-backend/app/Services/ReconciliationService.php
- `D. `ReportService`` --references--> `ReportService`  [INFERRED]
  docs/DOMAIN.md → pos-backend/app/Services/ReportService.php
- `8. Rencana Implementasi Bertahap (Implementation Roadmap)` --references--> `ForecastingController`  [INFERRED]
  docs/FORECASTING_AI_PLAN.md → pos-backend/app/Http/Controllers/Api/Admin/ForecastingController.php
- `8. Rencana Implementasi Bertahap (Implementation Roadmap)` --references--> `ForecastSnapshot`  [INFERRED]
  docs/FORECASTING_AI_PLAN.md → pos-backend/app/Models/ForecastSnapshot.php

## Import Cycles
- None detected.

## Communities (98 total, 63 thin omitted)

### Community 0 - "ref_react"
Cohesion: 0.07
Nodes (55): api, unwrapList(), ImageInput(), PHOTO_PRESETS, ProtectedRoute(), GuestOrdersModal(), HeldOrdersModal(), PaymentModal() (+47 more)

### Community 1 - "composer.json"
Cohesion: 0.04
Nodes (48): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+40 more)

### Community 2 - "main.py"
Cohesion: 0.07
Nodes (8): calculate_auto_ets(), calculate_croston(), calculate_wma(), ForecastRequest, ForecastResponse, generate_forecast(), health_check(), TestForecastingEngine

### Community 3 - "useCartStore"
Cohesion: 0.20
Nodes (18): formatCurrency(), CartDrawer(), CartItemRow(), FloatingCartBar(), Footer(), Layout(), Navbar(), SkipLink() (+10 more)

### Community 4 - "TestCase"
Cohesion: 0.09
Nodes (7): ForecastSnapshot, ExampleTest, ForecastingEndpointTest, HealthAndSecurityTest, MasterReportExcelTest, TestCase, ReconciliationServiceTest

### Community 5 - "Illuminate\Database\Eloquent\Model"
Cohesion: 0.10
Nodes (6): HeldOrder, ModifierItem, OrderItem, OrderItemModifier, Setting, WasteRecord

### Community 6 - "Illuminate\Http\Request"
Cohesion: 0.10
Nodes (5): AdminUserController, IngredientController, WasteController, AuthController, ReportController

### Community 7 - "cafe-frontend/package.json"
Cohesion: 0.07
Nodes (28): dependencies, lucide-react, react, react-dom, react-router-dom, zustand, devDependencies, tailwindcss (+20 more)

### Community 8 - "pos-backend/package.json"
Cohesion: 0.08
Nodes (20): devDependencies, concurrently, laravel-vite-plugin, tailwindcss, @tailwindcss/vite, vite, tailwindcss, @tailwindcss/vite (+12 more)

### Community 9 - "Product"
Cohesion: 0.13
Nodes (5): A. `InventoryService`, Product, StockMutation, {closure#1}(), InventoryService

### Community 10 - "pos-frontend/package.json"
Cohesion: 0.07
Nodes (28): dependencies, lucide-react, react, react-dom, react-router-dom, zustand, devDependencies, tailwindcss (+20 more)

### Community 11 - "cafe-frontend/src/api/client.js"
Cohesion: 0.14
Nodes (21): api, ApiError, request(), mapCategory(), mapModifierGroup(), mapModifierItem(), mapOrder(), mapOrderStatus() (+13 more)

### Community 12 - "ErrorBoundary"
Cohesion: 0.09
Nodes (5): ErrorBoundary, AppRouter(), App(), ErrorBoundary, AppRouter()

### Community 14 - "☕ Sistem Kasir & ERP Mini F&B — Arunika POS Suite"
Cohesion: 0.08
Nodes (24): 1. Backend REST API (`pos-backend`), 1. ⚙️ Laravel 13 (PHP 8.5) — Core Backend & Financial Engine, 1. 🐘 PHP 8.5 — Transaksional Finansial & Integritas Bisnis, 2. AI Forecasting Microservice (`forecasting-engine`), 2. 🟨 JavaScript (ECMAScript Modern) — Interaktivitas Klien & Akses Hardware Web, 2. ⚛️ React 18 & Vite — Dual Client Frontend (`pos-frontend` & `cafe-frontend`), 3. Backoffice & POS Kasir (`pos-frontend`), 3. 🚀 FastAPI & Python 3.11+ — AI & Time-Series Forecasting Microservice (+16 more)

### Community 15 - "Controller"
Cohesion: 0.11
Nodes (4): RecipeController, CategoryController, HeldOrderController, Controller

### Community 16 - "👔 5. Admin Backoffice Suite (`/api/admin/*`)"
Cohesion: 0.10
Nodes (20): 🔐 1. Authentication, 🛒 2. Operasional Kasir & Transaksi POS, ⏱️ 3. Manajemen Shift Kasir, 📊 4. Laporan Penjualan & Analytics, 👔 5. Admin Backoffice Suite (`/api/admin/*`), 👑 6. Superadmin / Owner Only (`/api/superadmin/*`), 📖 API Documentation Reference, Bahan Baku (Raw Ingredients) (+12 more)

### Community 18 - "Order"
Cohesion: 0.13
Nodes (3): Order, ReportService, ReportServiceTest

### Community 20 - "WebAudioEngine"
Cohesion: 0.23
Nodes (6): AmbientPlayer(), MusicPlayerModal(), audioEngine, TRACKS, useAudioStore, WebAudioEngine

### Community 21 - "Illuminate\Database\Schema\Blueprint"
Cohesion: 0.18
Nodes (12): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#5}(), {closure#6}(), {closure#1}(), {closure#2}() (+4 more)

### Community 22 - "Button"
Cohesion: 0.21
Nodes (11): MenuEditModal(), PHOTO_PRESETS, ProductDetailModal(), Button(), Dialog(), NotFoundPage(), ReservePage(), TableQrEntry() (+3 more)

### Community 24 - "cafe-frontend/src/router.jsx"
Cohesion: 0.17
Nodes (10): ProductCardSkeleton(), Skeleton(), CartPage, HistoryPage, HomePage, MenuPage, PageLoadingFallback(), RootLayout() (+2 more)

### Community 28 - "HistoryPage.jsx"
Cohesion: 0.25
Nodes (9): useChime(), usePolling(), HistoryPage(), TrackPage(), TrackPage, loadHistoryFromStorage(), SAMPLE_INITIAL_HISTORY, saveHistoryToStorage() (+1 more)

### Community 31 - "MenuPage.jsx"
Cohesion: 0.33
Nodes (6): CategoryFilter(), ManualBrewSection(), ProductCard(), SearchBar(), Badge(), MenuPage()

### Community 34 - "2. Service Layer Pattern (Backend Architecture)"
Cohesion: 0.17
Nodes (7): 1. Domain Entities & Database Model, 2. Service Layer Pattern (Backend Architecture), 📌 Arsitektur & Model Domain POS Suite, B. `OrderPricingService`, C. `ReconciliationService`, D. `ReportService`, Entitas Utama:

### Community 37 - "HomePage.jsx"
Cohesion: 0.35
Nodes (6): CraftStory(), HowToOrder(), MotifDivider(), SpaceHighlights(), SunriseHero(), HomePage()

### Community 43 - "menuStore.js"
Cohesion: 0.29
Nodes (6): DEFAULT_CATEGORIES, getSavedCustomProducts(), getSavedDeletedProductIds(), saveCustomProductsToStorage(), saveDeletedProductIdsToStorage(), useMenuStore

### Community 44 - ".handle"
Cohesion: 0.29
Nodes (3): GenerateDailyForecastSnapshotCommand, PruneForecastSnapshotsCommand, SendOwnerMorningDigestCommand

### Community 45 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 51 - "📋 Rencana Pengembangan: Smart Inventory Forecasting (Hybrid Event-Driven Engine) & AI Executive Briefing"
Cohesion: 0.25
Nodes (8): 1. Ringkasan Eksekutif & Tujuan, 2. Matriks Hak Akses: Admin vs Owner, 3. Evaluasi Kritis: 3 Kelemahan Utama pada Arsitektur Sinkron Awal, 4. Cetak Biru Arsitektur Baru: Decoupled Event-Driven Hybrid Engine, 5. Spesifikasi Mesin Forecasting: Multi-Tier Model Routing, 6. Desain Skema Database Baru, 7. Perbandingan Arsitektur Lama vs Arsitektur Rekomendasi, 📋 Rencana Pengembangan: Smart Inventory Forecasting (Hybrid Event-Driven Engine) & AI Executive Briefing

### Community 52 - "bootstrap/app.php"
Cohesion: 0.32
Nodes (3): {closure#1}(), {closure#2}(), {closure#3}()

### Community 55 - "pos-backend/README.md"
Cohesion: 0.25
Nodes (7): About Laravel, Agentic Development, Code of Conduct, Contributing, Learning Laravel, License, Security Vulnerabilities

### Community 57 - "2026_10_23_000002_add_procurement_fields_to_ingredients_and_snapshots.php"
Cohesion: 0.29
Nodes (4): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}()

### Community 59 - "0001_01_01_000000_create_users_table.php"
Cohesion: 0.33
Nodes (3): {closure#1}(), {closure#2}(), {closure#3}()

### Community 60 - "0001_01_01_000002_create_jobs_table.php"
Cohesion: 0.33
Nodes (3): {closure#1}(), {closure#2}(), {closure#3}()

### Community 70 - "🧭 Codemap & Panduan Pengembangan"
Cohesion: 0.50
Nodes (3): 1. Peta Direktori Utama, 2. Titik Masuk Perubahan Berdasarkan Fitur (*Feature-to-File Index*), 🧭 Codemap & Panduan Pengembangan

## Knowledge Gaps
- **23 isolated node(s):** `lucide-react`, `react`, `react-dom`, `react-router-dom`, `zustand` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 436 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `TestCase`, `Illuminate\Http\Request`, `Product`, `IngredientInventoryTest`, `Ingredient`, `ForecastingServiceTest`, `Order`, `UserFactory.php`, `InventoryServiceTest`, `OrderWorkflowAndIntegrityTest`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `lucide-react`, `react`, `react-dom` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ref_react` be split into smaller, more focused modules?**
  _Cohesion score 0.06864035087719299 - nodes in this community are weakly interconnected._
- **Why does `📋 Rencana Pengembangan: Smart Inventory Forecasting (Hybrid Event-Driven Engine) & AI Executive Briefing` connect `📋 Rencana Pengembangan: Smart Inventory Forecasting (Hybrid Event-Driven Engine) & AI Executive Briefing` to `StockForecastingService.php`, `2. Service Layer Pattern (Backend Architecture)`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `composer.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._
- **Why does `Controller` connect `Controller` to `SettingController`, `Table`, `AdminModifierController`, `Illuminate\Http\Request`, `AiInsightService`, `Product`, `ReconciliationService`, `ProductController`, `User`, `DigestController.php`, `ReportController.php`, `api.php`, `OrderController.php`, `Shift`, `AdminCategoryController`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07179487179487179 - nodes in this community are weakly interconnected._