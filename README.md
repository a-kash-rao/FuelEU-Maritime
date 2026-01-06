# FuelEU Maritime Compliance Engine

## Overview

This repository hosts the full-stack application for the **FuelEU Maritime Regulation (EU) 2023/1805** Compliance Engine. The system is designed to assist shipping companies and verifiers in calculating the Greenhouse Gas (GHG) intensity of energy used on board ships, monitoring compliance balances, and managing penalty risks.

The application implements the complex "Well-to-Wake" (WtW) calculation methodologies defined in **Article 10** and **Annex I** of the regulation, verifying compliance against the EU's decarbonization trajectory targets (2025-2050).

### Key Capabilities

* **GHG Intensity Calculator:** Precision calculation of GHG intensity (gCO2eq/MJ) based on fuel consumption, Lower Calorific Value (LCV), and specific emission factors ( and ).
* **Compliance Balance Monitoring:** Real-time visualization of surplus or deficit compliance units based on the reporting period.
* **Penalty Estimation:** Financial risk assessment engine implementing the specific penalty formulas defined in Article 21, including dynamic penalty factors.
* **Banking & Borrowing:** Validation logic for flexible compliance mechanisms (Article 20), ensuring borrowing does not exceed the regulatory cap of 2%.
* **BDN Parsing:** Integrated text processing service to extract fuel grades and quantities from unstructured Bunker Delivery Notes.

## Architecture

The application is built as a unified Monolith using **Node.js** and **TypeScript**, structured to enforce a clean separation of concerns.

* **Core Domain:** The calculation logic resides in a dependency-free domain layer. It uses `decimal.js` for all financial and emission calculations to prevent floating-point errors inherent in standard JavaScript numbers.
* **API Layer:** An Express.js REST API handles request validation and routing.
* **Frontend:** A React-based dashboard that consumes the API to visualize vessel performance.

**Tech Stack:**

* **Runtime:** Node.js (v18+ LTS)
* **Language:** TypeScript
* **Math Library:** `decimal.js` (Crucial for regulatory precision)
* **Test Runner:** Jest

## Prerequisites

Ensure you have the following installed on your local machine:

* **Node.js:** Version 18.16.0 or higher.
* **NPM:** Version 9.0.0 or higher.

## Setup & Installation

The application is configured for a zero-configuration start. Follow these steps to initialize the environment and launch the system.

### 1. Initialization

Initialize the project structure and verify environment compatibility.

```bash
npm init -y

```

*(Note: If cloning from the repo, this step is skipped as `package.json` already exists.)*

### 2. Install Dependencies

Install all required production and development dependencies defined in `package.json`.

```bash
npm install

```

### 3. Start the Application

This command builds the TypeScript source and starts the server in production mode.

```bash
npm start

```

The server will initialize and listen on **port 3000** by default.

* API Endpoint: `http://localhost:3000/api/v1`
* Health Check: `http://localhost:3000/health`

### Development Mode

For hot-reloading during development:

```bash
npm run dev

```

## Project Structure

```text
src/
├── core/                       # THE INNER HEXAGON (Pure TS, no React)
│   ├── domain/                 # Entities & Types
│   │   ├── Route.ts
│   │   ├── Compliance.ts
│   │   └── Pool.ts
│   ├── ports/                  # Interfaces (API contracts)
│   │   ├── IRouteRepository.ts
│   │   ├── IBankingService.ts
│   │   └── IPoolingService.ts
│   └── application/            # Business Logic / Use Cases
│       ├── ComplianceLogic.ts  # Rules for banking/pooling
│       └── Formatters.ts
├── adapters/                   # THE OUTER HEXAGON
│   ├── infrastructure/         # Implementation of Ports (API/Mock)
│   │   ├── MockRouteApi.ts
│   │   └── MockComplianceApi.ts
│   └── ui/                     # React Components
│       └── hooks/              # Hooks connecting UI to Core
│           └── useFuelEU.ts
├── App.tsx
├── README.md
├── REFLECTION.md
└── AGENT_WORKFLOW.md

```

## License

Proprietary. Unauthorized copying of this file, via any medium, is strictly prohibited.