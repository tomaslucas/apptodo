#!/bin/bash
# Script para agregar dependencias entre beads

cd /Users/tlucas/code/apptodo

# FASE 1: SETUP → DB-INIT → AUTH-REG → AUTH-LOGIN → AUTH-REFRESH → AUTH-LOGOUT → AUTH-ME → TASKS-CREATE → TASKS-GET → TASKS-LIST → TASKS-UPDATE → TASKS-DELETE
bd dep add test-beads-et8 --depends-on test-beads-rbf  # AUTH-REG depends on DB-INIT
bd dep add test-beads-30o --depends-on test-beads-et8  # AUTH-LOGIN depends on AUTH-REG
bd dep add test-beads-bwv --depends-on test-beads-30o  # AUTH-REFRESH depends on AUTH-LOGIN
bd dep add test-beads-8lr --depends-on test-beads-bwv  # AUTH-LOGOUT depends on AUTH-REFRESH
bd dep add test-beads-9bq --depends-on test-beads-8lr  # AUTH-ME depends on AUTH-LOGOUT
bd dep add test-beads-cce --depends-on test-beads-9bq  # TASKS-CREATE depends on AUTH-ME
bd dep add test-beads-kca --depends-on test-beads-cce  # TASKS-GET depends on TASKS-CREATE
bd dep add test-beads-ax7 --depends-on test-beads-kca  # TASKS-LIST depends on TASKS-GET
bd dep add test-beads-660 --depends-on test-beads-ax7  # TASKS-UPDATE depends on TASKS-LIST
bd dep add test-beads-3ao --depends-on test-beads-660  # TASKS-DELETE depends on TASKS-UPDATE

# FASE 1 TESTING
bd dep add test-beads-6m3 --depends-on test-beads-9bq  # TEST-AUTH depends on AUTH-ME
bd dep add test-beads-8rc --depends-on test-beads-3ao  # TEST-TASKS depends on TASKS-DELETE
bd dep add test-beads-tg9 --depends-on test-beads-8rc  # TEST-IDEMPOTENCY depends on TEST-TASKS
bd dep add test-beads-vzz --depends-on test-beads-tg9  # TEST-SECURITY depends on TEST-IDEMPOTENCY

# FASE 2
bd dep add test-beads-z1v --depends-on test-beads-vzz  # DB-CATEGORIES depends on TEST-SECURITY
bd dep add test-beads-6vh --depends-on test-beads-z1v  # CATEGORIES-CRUD depends on DB-CATEGORIES
bd dep add test-beads-dxp --depends-on test-beads-6vh  # TASKS-CATEGORIES depends on CATEGORIES-CRUD
bd dep add test-beads-mfl --depends-on test-beads-dxp  # TASKS-FILTERS-DB depends on TASKS-CATEGORIES
bd dep add test-beads-cj3 --depends-on test-beads-mfl  # TASKS-BATCH depends on TASKS-FILTERS-DB
bd dep add test-beads-5mq --depends-on test-beads-cj3  # TASKS-RESTORE depends on TASKS-BATCH
bd dep add test-beads-l34 --depends-on test-beads-5mq  # TASK-EVENTS depends on TASKS-RESTORE

# FASE 3
bd dep add test-beads-f8n --depends-on test-beads-l34  # P3-SETUP depends on P2-TASK-EVENTS
bd dep add test-beads-my5 --depends-on test-beads-f8n  # P3-ROUTER depends on P3-SETUP
bd dep add test-beads-6oy --depends-on test-beads-my5  # P3-AUTH-STORE depends on P3-ROUTER
bd dep add test-beads-1a1 --depends-on test-beads-6oy  # P3-API-INTERCEPTOR depends on P3-AUTH-STORE
bd dep add test-beads-1i6 --depends-on test-beads-1a1  # P3-LOGIN-VIEW depends on P3-API-INTERCEPTOR
bd dep add test-beads-k6u --depends-on test-beads-1i6  # P3-DASHBOARD-STRUCTURE depends on P3-LOGIN-VIEW

# FASE 4
bd dep add test-beads-vaf --depends-on test-beads-k6u  # P4-TASK-STORE depends on P3-DASHBOARD-STRUCTURE
bd dep add test-beads-144 --depends-on test-beads-vaf  # P4-UI-STORE depends on P4-TASK-STORE
bd dep add test-beads-7gn --depends-on test-beads-144  # P4-TASK-ITEM depends on P4-UI-STORE
bd dep add test-beads-571 --depends-on test-beads-7gn  # P4-TASK-FORM depends on P4-TASK-ITEM
bd dep add test-beads-i6l --depends-on test-beads-571  # P4-FILTER-BAR depends on P4-TASK-FORM
bd dep add test-beads-cf5 --depends-on test-beads-i6l  # P4-TASK-LIST depends on P4-FILTER-BAR
bd dep add test-beads-ax3 --depends-on test-beads-cf5  # P4-API-INTEGRATION depends on P4-TASK-LIST
bd dep add test-beads-35n --depends-on test-beads-ax3  # P4-DELETE-CONFIRM depends on P4-API-INTEGRATION

# FASE 5
bd dep add test-beads-uy7 --depends-on test-beads-35n  # P5-SHORTCUTS-MANAGER depends on P4-DELETE-CONFIRM
bd dep add test-beads-57w --depends-on test-beads-uy7  # P5-SHORTCUTS-IMPL depends on P5-SHORTCUTS-MANAGER
bd dep add test-beads-93h --depends-on test-beads-57w  # P5-SHORTCUTS-HELP depends on P5-SHORTCUTS-IMPL

# FASE 6
bd dep add test-beads-p7m --depends-on test-beads-93h  # P6-STYLING depends on P5-SHORTCUTS-HELP
bd dep add test-beads-7dt --depends-on test-beads-p7m  # P6-ANIMATIONS depends on P6-STYLING
bd dep add test-beads-grv --depends-on test-beads-7dt  # P6-FORM-VALIDATIONS depends on P6-ANIMATIONS
bd dep add test-beads-wof --depends-on test-beads-grv  # P6-LOADING-STATES depends on P6-FORM-VALIDATIONS
bd dep add test-beads-vpk --depends-on test-beads-wof  # P6-ACCESSIBILITY depends on P6-LOADING-STATES
bd dep add test-beads-8id --depends-on test-beads-vpk  # P6-PERFORMANCE depends on P6-ACCESSIBILITY
bd dep add test-beads-la3 --depends-on test-beads-8id  # P6-FRONTEND-TESTS depends on P6-PERFORMANCE
bd dep add test-beads-l0j --depends-on test-beads-la3  # P6-E2E-TESTS depends on P6-FRONTEND-TESTS
bd dep add test-beads-d60 --depends-on test-beads-l0j  # P6-DOCUMENTATION depends on P6-E2E-TESTS
bd dep add test-beads-kpl --depends-on test-beads-d60  # P6-PRODUCTION-BUILD depends on P6-DOCUMENTATION
bd dep add test-beads-9jj --depends-on test-beads-kpl  # CLEANUP depends on P6-PRODUCTION-BUILD

echo "✅ All dependencies added!"
