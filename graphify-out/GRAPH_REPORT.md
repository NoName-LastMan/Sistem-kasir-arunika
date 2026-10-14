# Graph Report - POS  (2026-10-14)

## Corpus Check
- 198 files · ~76,929 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: (none) 18, .css 3, .log 2)

## Summary
- 968 nodes · 2012 edges · 72 communities (26 shown, 46 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `17c3896e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- OrderPricingServiceTest
- DatabaseSeeder.php
- ref_react
- SettingController
- composer.json
- IngredientSeeder.php
- pos-frontend/package.json
- Illuminate\Http\JsonResponse
- User
- InventoryController
- 👔 5. Admin Backoffice Suite (`/api/admin/*`)
- StockMutation
- Product
- cafe-frontend/src/router.jsx
- cafe-frontend/src/api/client.js
- OrderController.php
- api.php
- DOKUMEN SERAH TERIMA PROYEK (PROJECT HANDOVER)
- ProductController
- ReconciliationService
- IngredientController
- IngredientInventoryTest
- AdminTableController
- Illuminate\Database\Eloquent\Model
- Illuminate\Http\Request
- DatabaseSeeder
- bootstrap/app.php
- ShiftController
- Illuminate\Database\Schema\Blueprint
- cafe-frontend/package.json
- 📋 Rencana Pengembangan: Sistem Prediksi Stok (Forecasting), Asisten AI (LLM), & Morning Digest Email
- pos-backend/package.json
- Closure
- Illuminate\Database\Migrations\Migration
- Illuminate\Support\Facades\Schema
- pos-backend/README.md
- InventoryServiceTest
- AppServiceProvider
- 0001_01_01_000001_create_cache_table.php
- 2026_09_04_000004_update_stock_mutations_table.php
- 2026_09_15_000001_add_void_fields_to_orders_table.php
- SendOwnerMorningDigestCommand.php
- ExampleTest
- Laravel Application
- Laravel Application
- 2026_08_29_063202_create_personal_access_tokens_table.php
- 2026_08_29_093514_create_products_table.php
- 2026_08_29_093527_create_modifier_items_table.php
- 2026_08_29_093532_create_shifts_table.php
- 2026_08_29_093537_create_orders_table.php
- 2026_08_29_093542_create_order_items_table.php
- 2026_08_29_093547_create_order_item_modifiers_table.php
- 2026_08_29_093856_create_product_modifier_group_table.php
- 2026_09_02_000000_create_held_orders_table.php
- 2026_09_02_100000_create_settings_table.php
- 2026_09_02_110000_create_stock_mutations_table.php
- 2026_09_04_000001_create_ingredients_table.php
- 2026_09_04_000002_create_product_ingredients_table.php
- 2026_09_04_000003_create_waste_records_table.php
- Controller

## God Nodes (most connected - your core abstractions)
1. `Controller` - 41 edges
2. `Product` - 32 edges
3. `useCartStore` - 24 edges
4. `Ingredient` - 24 edges
5. `StockMutation` - 24 edges
6. `Button()` - 23 edges
7. `Order` - 23 edges
8. `api` - 23 edges
9. `User` - 21 edges
10. `InventoryServiceTest` - 20 edges

## Surprising Connections (you probably didn't know these)
- `C. `ReconciliationService`` --references--> `ReconciliationService`  [INFERRED]
  docs/DOMAIN.md → pos-backend/app/Services/ReconciliationService.php
- `D. `ReportService`` --references--> `ReportService`  [INFERRED]
  docs/DOMAIN.md → pos-backend/app/Services/ReportService.php
- `B. `OrderPricingService`` --references--> `OrderPricingService`  [INFERRED]
  docs/DOMAIN.md → pos-backend/app/Services/OrderPricingService.php
- `A. `InventoryService`` --references--> `StockMutation`  [INFERRED]
  docs/DOMAIN.md → pos-backend/app/Models/StockMutation.php
- `A. `InventoryService`` --references--> `InventoryService`  [INFERRED]
  docs/DOMAIN.md → pos-backend/app/Services/InventoryService.php

## Import Cycles
- None detected.

## Communities (72 total, 46 thin omitted)

### Community 0 - "OrderPricingServiceTest"
Cohesion: 0.06
Nodes (19): 1. Peta Direktori Utama, 2. Titik Masuk Perubahan Berdasarkan Fitur (*Feature-to-File Index*), 🧭 Codemap & Panduan Pengembangan, 1. Domain Entities & Database Model, 2. Service Layer Pattern (Backend Architecture), 📌 Arsitektur & Model Domain POS Suite, B. `OrderPricingService`, C. `ReconciliationService` (+11 more)

### Community 1 - "DatabaseSeeder.php"
Cohesion: 0.15
Nodes (3): AdminModifierController, ModifierGroup, ModifierItem

### Community 2 - "ref_react"
Cohesion: 0.08
Nodes (39): AppRouter(), api, unwrapList(), App(), ProtectedRoute(), GuestOrdersModal(), HeldOrdersModal(), PaymentModal() (+31 more)

### Community 4 - "composer.json"
Cohesion: 0.04
Nodes (48): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+40 more)

### Community 6 - "pos-frontend/package.json"
Cohesion: 0.07
Nodes (28): dependencies, lucide-react, react, react-dom, react-router-dom, zustand, devDependencies, tailwindcss (+20 more)

### Community 8 - "User"
Cohesion: 0.12
Nodes (3): AdminUserController, User, UserFactory

### Community 11 - "👔 5. Admin Backoffice Suite (`/api/admin/*`)"
Cohesion: 0.10
Nodes (20): 🔐 1. Authentication, 🛒 2. Operasional Kasir & Transaksi POS, ⏱️ 3. Manajemen Shift Kasir, 📊 4. Laporan Penjualan & Analytics, 👔 5. Admin Backoffice Suite (`/api/admin/*`), 👑 6. Superadmin / Owner Only (`/api/superadmin/*`), 📖 API Documentation Reference, Bahan Baku (Raw Ingredients) (+12 more)

### Community 12 - "StockMutation"
Cohesion: 0.15
Nodes (4): A. `InventoryService`, StockMutation, {closure#1}(), InventoryService

### Community 13 - "Product"
Cohesion: 0.11
Nodes (3): RecipeController, Ingredient, Product

### Community 17 - "cafe-frontend/src/router.jsx"
Cohesion: 0.05
Nodes (67): api, formatCurrency(), mapModifierGroup(), mapModifierItem(), mapOrder(), mapOrderStatus(), mapProduct(), AmbientPlayer() (+59 more)

### Community 18 - "cafe-frontend/src/api/client.js"
Cohesion: 0.20
Nodes (14): ApiError, request(), mapCategory(), mapSettings(), mapTable(), mockCategories, mockModifierGroups, mockProducts (+6 more)

### Community 24 - "DOKUMEN SERAH TERIMA PROYEK (PROJECT HANDOVER)"
Cohesion: 0.09
Nodes (21): 1.1 Tentang Sistem, 1. Ringkasan Eksekutif Proyek, 2.1 Backend (`pos-backend`), 2.2 Frontend (Standarisasi React), 2.3 Dokumentasi & Knowledge Base (`docs/`), 2. Arsitektur & Teknologi (Tech Stack), 3. Struktur Hak Akses (Role-Based Access Control), 4. Akun Default & Kredensial Pengujian (Demo) (+13 more)

### Community 29 - "IngredientInventoryTest"
Cohesion: 0.10
Nodes (4): Category, ExampleTest, TestCase, IngredientInventoryTest

### Community 31 - "AdminTableController"
Cohesion: 0.15
Nodes (3): AdminCategoryController, AdminTableController, Table

### Community 33 - "Illuminate\Database\Eloquent\Model"
Cohesion: 0.11
Nodes (6): HeldOrder, Order, OrderItem, OrderItemModifier, Shift, WasteRecord

### Community 42 - "Illuminate\Http\Request"
Cohesion: 0.13
Nodes (3): AuthController, OrderController, ReportController

### Community 46 - "bootstrap/app.php"
Cohesion: 0.32
Nodes (3): {closure#1}(), {closure#2}(), {closure#3}()

### Community 52 - "Illuminate\Database\Schema\Blueprint"
Cohesion: 0.23
Nodes (6): {closure#1}(), {closure#2}(), {closure#3}(), {closure#1}(), {closure#2}(), {closure#3}()

### Community 55 - "cafe-frontend/package.json"
Cohesion: 0.07
Nodes (28): dependencies, lucide-react, react, react-dom, react-router-dom, zustand, devDependencies, tailwindcss (+20 more)

### Community 62 - "📋 Rencana Pengembangan: Sistem Prediksi Stok (Forecasting), Asisten AI (LLM), & Morning Digest Email"
Cohesion: 0.40
Nodes (4): 1. Ringkasan Eksekutif & Tujuan, 2. Matriks Hak Akses: Admin vs Owner, 3. Arsitektur Teknis Sistem, 📋 Rencana Pengembangan: Sistem Prediksi Stok (Forecasting), Asisten AI (LLM), & Morning Digest Email

### Community 67 - "pos-backend/package.json"
Cohesion: 0.08
Nodes (20): devDependencies, concurrently, laravel-vite-plugin, tailwindcss, @tailwindcss/vite, vite, tailwindcss, @tailwindcss/vite (+12 more)

### Community 100 - "pos-backend/README.md"
Cohesion: 0.25
Nodes (7): About Laravel, Agentic Development, Code of Conduct, Contributing, Learning Laravel, License, Security Vulnerabilities

### Community 147 - "SendOwnerMorningDigestCommand.php"
Cohesion: 0.06
Nodes (7): SendOwnerMorningDigestCommand, ForecastingController, OwnerMorningDigestMail, AiInsightService, ReportService, {closure#2}(), StockForecastingService

### Community 149 - "Laravel Application"
Cohesion: 0.50
Nodes (3): Agent Setup, Laravel Application, Prerequisites

### Community 150 - "Laravel Application"
Cohesion: 0.50
Nodes (3): Agent Setup, Laravel Application, Prerequisites

### Community 206 - "Controller"
Cohesion: 0.22
Nodes (3): WasteController, HeldOrderController, Controller

## Knowledge Gaps
- **23 isolated node(s):** `lucide-react`, `react`, `react-dom`, `react-router-dom`, `zustand` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 330 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Product` connect `Product` to `OrderPricingServiceTest`, `Illuminate\Database\Eloquent\Model`, `DatabaseSeeder.php`, `IngredientSeeder.php`, `Illuminate\Http\Request`, `InventoryServiceTest`, `StockMutation`, `api.php`, `ProductController`, `IngredientInventoryTest`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `lucide-react`, `react`, `react-dom` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `OrderPricingServiceTest` be split into smaller, more focused modules?**
  _Cohesion score 0.059233449477351915 - nodes in this community are weakly interconnected._
- **Why does `2. Service Layer Pattern (Backend Architecture)` connect `OrderPricingServiceTest` to `StockMutation`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `ref_react` be split into smaller, more focused modules?**
  _Cohesion score 0.08491107286288009 - nodes in this community are weakly interconnected._
- **Should `composer.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._
- **Should `pos-frontend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._