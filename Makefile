# Midaz TypeScript SDK Makefile

# Color definitions - empty to disable colors
YELLOW := 
GREEN := 
CYAN := 
RED := 
NC := 
BOLD := 

# Component-specific variables
SERVICE_NAME := Midaz TypeScript SDK
BIN_DIR := ./dist
ARTIFACTS_DIR := ./artifacts
DOCS_DIR := ./docs/generated
VERSION := 1.0.0
NODE_MODULES := ./node_modules

# Ensure directories exist
$(shell mkdir -p $(ARTIFACTS_DIR))
$(shell mkdir -p $(DOCS_DIR))

# Define a simple function for section headers
define print_header
	@echo ""
	@echo "==== $(1) ===="
	@echo ""
endef

# Node/NPM commands
NPM := npm
NODE := node
NPX := npx
TSC := $(NPX) tsc
JEST := $(NPX) jest
ESLINT := $(NPX) eslint
PRETTIER := $(NPX) prettier

# Project variables
PROJECT_ROOT := $(shell pwd)
PROJECT_NAME := midaz-typescript-sdk

# Environment variables
ENV_FILE := $(PROJECT_ROOT)/.env
ENV_EXAMPLE_FILE := $(PROJECT_ROOT)/.env.example

# Load environment variables if .env exists
ifneq (,$(wildcard .env))
    include .env
endif

#-------------------------------------------------------
# Core Commands
#-------------------------------------------------------

.PHONY: help
help:
	@echo ""
	@echo "$(SERVICE_NAME) Commands"
	@echo ""
	@echo "Core Commands:"
	@echo "  make help                        - Display this help message"
	@echo "  make set-env                     - Create .env file from .env.example if it doesn't exist"
	@echo "  make test                        - Run all tests"
	@echo "  make test-fast                   - Run tests with -short flag"
	@echo "  make clean                       - Clean build artifacts"
	@echo "  make coverage                    - Generate test coverage report"
	@echo ""
	@echo "Code Quality Commands:"
	@echo "  make lint                        - Run linting tools"
	@echo "  make fmt                         - Format code"
	@echo "  make tidy                        - Clean dependencies"
	@echo "  make verify-sdk                  - Run SDK quality checks"
	@echo "  make hooks                       - Install git hooks"
	@echo "  make gosec                       - Run security checks with gosec"
	@echo ""
	@echo "Example Commands:"
	@echo "  make example                     - Run complete workflow example"
	@echo ""
	@echo "Documentation Commands:"
	@echo "  make godoc                       - Start a godoc server for interactive documentation"
	@echo "  make godoc-static                - Generate static documentation files"
	@echo "  make docs                        - Generate comprehensive documentation (includes godoc-static)"
	@echo ""

#-------------------------------------------------------
# Environment Setup
#-------------------------------------------------------

.PHONY: set-env

set-env:
	$(call print_header,"Setting up environment")
	@if [ ! -f "$(ENV_FILE)" ] && [ -f "$(ENV_EXAMPLE_FILE)" ]; then \
		echo "$(YELLOW)No .env file found. Creating from .env.example...$(NC)"; \
		cp $(ENV_EXAMPLE_FILE) $(ENV_FILE); \
		echo "$(GREEN)[ok]$(NC) Created .env file from .env.example$(GREEN) ✔️$(NC)"; \
	elif [ ! -f "$(ENV_FILE)" ] && [ ! -f "$(ENV_EXAMPLE_FILE)" ]; then \
		echo "$(RED)[error]$(NC) Neither .env nor .env.example files found$(RED) ❌$(NC)"; \
		exit 1; \
	elif [ -f "$(ENV_FILE)" ]; then \
		read -t 10 -p "$(YELLOW).env file already exists. Overwrite with .env.example? [Y/n] (auto-yes in 10s)$(NC) " answer || answer="Y"; \
		answer=$${answer:-Y}; \
		if [[ $$answer =~ ^[Yy] ]]; then \
			cp $(ENV_EXAMPLE_FILE) $(ENV_FILE); \
			echo "$(GREEN)[ok]$(NC) Overwrote .env file with .env.example$(GREEN) ✔️$(NC)"; \
		else \
			echo "$(YELLOW)[skipped]$(NC) Kept existing .env file$(YELLOW) ⚠️$(NC)"; \
		fi; \
	fi

#-------------------------------------------------------
# Test Commands
#-------------------------------------------------------

.PHONY: test test-fast coverage

test:
	$(call print_header,"Running tests")
	@echo "$(CYAN)Running all tests...$(NC)"
	@$(NPM) run test
	@echo "$(GREEN)[ok]$(NC) Tests completed successfully$(GREEN) ✔️$(NC)"

test-fast:
	$(call print_header,"Running fast tests")
	@echo "$(CYAN)Running tests with fast mode...$(NC)"
	@$(NPM) run test:ci
	@echo "$(GREEN)[ok]$(NC) Fast tests completed successfully$(GREEN) ✔️$(NC)"

coverage:
	$(call print_header,"Generating test coverage")
	@echo "$(CYAN)Generating coverage report...$(NC)"
	@$(NPM) run test:coverage
	@echo "$(GREEN)[ok]$(NC) Coverage report generated$(GREEN) ✔️$(NC)"
	@echo "Coverage report available at: coverage/lcov-report/index.html"

#-------------------------------------------------------
# Code Quality Commands
#-------------------------------------------------------

.PHONY: lint fmt tidy verify-sdk hooks gosec

lint:
	$(call print_header,"Running linting tools")
	@echo "$(CYAN)Running ESLint...$(NC)"
	@if [ -f "$(NODE_MODULES)/.bin/eslint" ]; then \
		$(NPM) run lint; \
		echo "$(GREEN)[ok]$(NC) Linting completed successfully$(GREEN) ✔️$(NC)"; \
	else \
		echo "$(YELLOW)ESLint not found. Installing dependencies...$(NC)"; \
		$(NPM) install; \
		$(NPM) run lint; \
		echo "$(GREEN)[ok]$(NC) Linting completed successfully$(GREEN) ✔️$(NC)"; \
	fi

fmt:
	$(call print_header,"Formatting code")
	@echo "$(CYAN)Running Prettier...$(NC)"
	@if [ -f "$(NODE_MODULES)/.bin/prettier" ]; then \
		$(NPM) run format; \
		echo "$(GREEN)[ok]$(NC) Code formatted successfully$(GREEN) ✔️$(NC)"; \
	else \
		echo "$(YELLOW)Prettier not found. Installing dependencies...$(NC)"; \
		$(NPM) install; \
		$(NPM) run format; \
		echo "$(GREEN)[ok]$(NC) Code formatted successfully$(GREEN) ✔️$(NC)"; \
	fi

tidy:
	$(call print_header,"Cleaning dependencies")
	@echo "$(CYAN)Cleaning and updating dependencies...$(NC)"
	@$(NPM) prune
	@$(NPM) update
	@echo "$(GREEN)[ok]$(NC) Dependencies cleaned successfully$(GREEN) ✔️$(NC)"

verify-sdk: lint fmt test
	$(call print_header,"Running SDK quality checks")
	@echo "$(CYAN)Running TypeScript type checker...$(NC)"
	@if [ -f "$(NODE_MODULES)/.bin/tsc" ]; then \
		$(NPM) run typecheck; \
		echo "$(GREEN)[ok]$(NC) Type checking completed$(GREEN) ✔️$(NC)"; \
	else \
		echo "$(YELLOW)TypeScript not found. Installing dependencies...$(NC)"; \
		$(NPM) install; \
		$(NPM) run typecheck; \
		echo "$(GREEN)[ok]$(NC) Type checking completed$(GREEN) ✔️$(NC)"; \
	fi
	@echo "$(GREEN)✅ All SDK quality checks passed!$(NC)"

hooks:
	$(call print_header,"Installing Git Hooks")
	@echo "$(CYAN)Installing git hooks...$(NC)"
	@if [ -f "$(NODE_MODULES)/.bin/husky" ]; then \
		$(NPX) husky install; \
		echo "$(GREEN)[ok]$(NC) Git hooks installed$(GREEN) ✔️$(NC)"; \
	else \
		echo "$(YELLOW)Husky not found. Installing...$(NC)"; \
		$(NPM) install --save-dev husky; \
		$(NPX) husky install; \
		echo "$(GREEN)[ok]$(NC) Git hooks installed$(GREEN) ✔️$(NC)"; \
	fi

gosec:
	$(call print_header,"Running security checks")
	@echo "$(CYAN)Running npm audit for security checks...$(NC)"
	@$(NPM) audit --audit-level=moderate || echo "$(YELLOW)Some security issues found. Please review.$(NC)"
	@echo "$(GREEN)[ok]$(NC) Security checks completed$(GREEN) ✔️$(NC)"

#-------------------------------------------------------
# Clean Commands
#-------------------------------------------------------

.PHONY: clean

clean:
	$(call print_header,"Cleaning build artifacts")
	@echo "$(CYAN)Cleaning build artifacts...$(NC)"
	@$(NPM) run clean
	@rm -rf $(ARTIFACTS_DIR)/coverage/ $(ARTIFACTS_DIR)/*.lcov
	@rm -rf .nyc_output/ coverage/
	@echo "$(GREEN)[ok]$(NC) Artifacts cleaned successfully$(GREEN) ✔️$(NC)"

#-------------------------------------------------------
# Example Commands
#-------------------------------------------------------

.PHONY: example

example:
	$(call print_header,"Running Complete Workflow Example")
	$(call print_header,"Make sure the Midaz Stack is running --default is localhost")
	@echo "$(CYAN)Running new features example...$(NC)"
	@if [ -f ".env" ]; then \
		echo "$(GREEN)Found .env file, copying to examples directory...$(NC)"; \
		cp .env examples/.env; \
	fi
	@if [ -f "examples/new-features-example.ts" ]; then \
		cd examples && $(NPX) ts-node --project ../tsconfig.examples.json new-features-example.ts; \
		echo "$(GREEN)[ok]$(NC) Complete workflow example completed$(GREEN) ✔️$(NC)"; \
	else \
		echo "$(RED)[error]$(NC) New features example not found$(RED) ❌$(NC)"; \
		exit 1; \
	fi

#-------------------------------------------------------
# Documentation Commands
#-------------------------------------------------------

.PHONY: godoc godoc-static docs

godoc:
	$(call print_header,"Starting TypeDoc documentation server")
	@echo "$(CYAN)Starting TypeDoc server for interactive documentation...$(NC)"
	@if [ -f "$(NODE_MODULES)/.bin/typedoc" ]; then \
		$(NPM) run docs:serve; \
	else \
		echo "$(YELLOW)TypeDoc not found. Installing...$(NC)"; \
		$(NPM) install --save-dev typedoc; \
		$(NPM) run docs:serve; \
	fi

godoc-static:
	$(call print_header,"Generating static documentation")
	@echo "$(CYAN)Generating static TypeDoc documentation...$(NC)"
	@mkdir -p $(DOCS_DIR)
	@if [ -f "$(NODE_MODULES)/.bin/typedoc" ]; then \
		$(NPM) run docs; \
		echo "$(GREEN)[ok]$(NC) Static documentation generated successfully in docs/$(GREEN) ✔️$(NC)"; \
	else \
		echo "$(YELLOW)TypeDoc not found. Installing...$(NC)"; \
		$(NPM) install --save-dev typedoc; \
		$(NPM) run docs; \
		echo "$(GREEN)[ok]$(NC) Static documentation generated successfully in docs/$(GREEN) ✔️$(NC)"; \
	fi

docs: godoc-static
	$(call print_header,"Documentation generation complete")
	@echo "$(GREEN)[ok]$(NC) Documentation generated successfully$(GREEN) ✔️$(NC)"