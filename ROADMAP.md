# 🚀 Project Roadmap & Improvement Plan

This document outlines the strategic plan for evolving **Atmosphera** from a prototype to a production-grade application, based on modern best practices and architectural reviews.

## 📋 Summary of Priorities

| Area | Priority | Status |
|------|----------|--------|
| **User Onboarding & Clarity** | 🔴 1 (Critical) | *In Progress* |
| **Consistent Error/Loading States** | 🔴 1 (Critical) | ✅ *Completed* |
| **Responsive Layout Polish** | 🔴 1 (Critical) | *Ongoing* |
| **API Resilience & Fallbacks** | 🔴 1 (Critical) | ✅ *Completed* |
| **Test Coverage (Unit/E2E)** | 🔴 1 (Critical) | *Pending* |
| **CI/CD Pipeline** | 🟡 2 (Important) | ✅ *Completed* |
| **Architectural Refactor** | 🟡 2 (Important) | *Planned* |
| **Accessibility Audit** | 🟡 2 (Important) | *Planned* |

---

## 🛠️ Implementation Plan

### 1. User Experience & Onboarding (Priority 1)
*   [ ] **Context Explanation:** Add micro-copy or tooltips to the Atmosphere Widget explaining *why* weather/time data improves recommendations.
*   [ ] **Onboarding Tour:** Implement a simple "first-time" overlay explaining the navigation (Pulse, Library, Lab).
*   [x] **Tooltips:** (Completed) Added tooltips to "Visual Search" and "Neural Lab" floating buttons.

### 2. UI/UX Consistency (Priority 1)
*   [x] **Feedback Systems:** (Completed) Implemented `LoadingOverlay` and `ErrorToast` for unified communication.
*   [ ] **Mobile Nav:** Verify that the bottom "Floating Action" buttons do not overlap with book content on small screens.
*   [ ] **Touch Targets:** Ensure all buttons meet the 44x44px accessibility standard.

### 3. Architecture & Code Quality (Priority 2)
*   **Feature-Centric Folders:** Move away from flat `components/` structure to:
    ```
    src/
      features/
        recommendations/ (UI + Logic)
        library/ (UI + Logic)
        identity/ (Auth)
    ```
*   **Centralized API Client:** Refactor `gemini.ts` to use a unified Axios/Fetch instance with automatic retry and interceptors for logging.

### 4. Quality Assurance (Priority 1)
*   [ ] **Unit Tests:** Add Jest/Vitest for `services/gemini.ts` to verify parsing logic.
*   [ ] **E2E Tests:** Add Cypress/Playwright tests for the "Happy Path" (Landing -> Questionnaire -> Results).
*   [ ] **Linting:** Enforce strict TypeScript rules to prevent `any` types.

---

## 🔮 Future Horizons (V2)
*   **Offline Mode:** Cache standard "Classics" locally for offline browsing.
*   **Social Threads:** Allow sharing "Atmospheric Snapshots" (current mood + book recommendation) to social media.
*   **Physical Library Integration:** Map recommendations to physical book availability in local libraries.
