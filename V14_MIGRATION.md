# Foundry VTT v14 Migration Research and Plan - Mythras System

## Research Findings

I have audited the Mythras system codebase against the major changes introduced in Foundry VTT v14.

### 1. Measured Templates and Regions
Foundry v14 introduces a new **Region** system, and **Measured Templates** are now partially integrated into this via `TemplateRegion`.
- **Status:** The Mythras system does not currently use `MeasuredTemplate` in its core TypeScript source code. Standard templates used in scenes will continue to function via the core software's compatibility layer.
- **Action:** No immediate code changes required for existing functionality.

### 2. Active Effects V2
Active Effects have seen schema changes, notably the preference for the `seconds` property in durations.
- **Status:** The system has a placeholder `ActiveEffectMythras` class but it is currently disabled and not registered in `CONFIG`.
- **Action:** No immediate impact. Future implementation of Active Effects should follow the V2 schema.

### 3. ApplicationV2
v14 introduces `ApplicationV2` as the new standard for UI.
- **Status:** The system heavily uses `Application` and `DocumentSheet` (v1).
- **Action:** v1 Applications remain supported for compatibility. Migration is recommended but not required for v14 stability.

### 4. Scene Levels and Token Elevations
v14 adds native support for multiple levels within a single Scene.
- **Status:** Tokens now have a `level` property.
- **Action:** The system's token and vision logic should be tested against multi-level scenes to ensure `level` is handled correctly alongside `elevation`.

### 5. DataModel and Validation
- **Status:** The system uses `template.json` for data structures.
- **Action:** `template.json` remains supported. Migration to `DataModel` is a long-term goal for better validation and type safety.

---

## Implementation Plan

The following roadmap outlines the steps to fully leverage Foundry v14 features:

### Phase 1: Stability (Completed)
- [x] Update `system.json` to set `verified: 14`.
- [x] Audit codebase for immediate breaking changes (None found).
- [x] Verify build process with updated environment.

### Phase 2: Feature Adoption (Short-term)
- [ ] **Scene Levels:** Update Token and Actor logic to support the new `level` property. Ensure vision and light interactions work across levels.
- [ ] **Region System:** Explore replacing manual trigger logic (if any) with the new `Region` behaviors for trap triggers, area effects, etc.

### Phase 3: Modernization (Long-term)
- [ ] **ApplicationV2:** Migrate the `EncounterGenerator` and `MythrasCombatTracker` to `ApplicationV2`.
- [ ] **DataModel:** Convert `template.json` definitions into `DataModel` classes for robust data validation.
- [ ] **Active Effects:** Complete the implementation of `ActiveEffectMythras` using the V2 API.
