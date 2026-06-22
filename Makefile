# Ezra Todo — build & deploy entry point.
# `make help` lists targets. The publish-* targets produce a deployable folder;
# the docker-* targets produce deployable container images.

BACKEND_DIR   := backend
FRONTEND_DIR  := frontend
BACKEND_PROJ  := $(BACKEND_DIR)/TodoApi/TodoApi.csproj
PUBLISH_DIR   := publish
COMPOSE       := docker compose

.DEFAULT_GOAL := help
.PHONY: help install build build-backend build-frontend \
        publish publish-backend publish-frontend \
        test test-backend test-frontend \
        docker docker-up docker-down clean

help: ## List available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## Restore backend + frontend dependencies
	dotnet restore $(BACKEND_PROJ)
	cd $(FRONTEND_DIR) && npm ci

# --- Build (compile, no packaging) -----------------------------------------
build: build-backend build-frontend ## Build both backend and frontend

build-backend: ## Build the .NET API (Release)
	dotnet build $(BACKEND_PROJ) -c Release

build-frontend: ## Type-check and bundle the React app
	cd $(FRONTEND_DIR) && npm run build

# --- Publish (deployable folder) -------------------------------------------
publish: publish-backend publish-frontend ## Produce deployable artifacts in ./publish

publish-backend: ## dotnet publish the API to ./publish/backend
	dotnet publish $(BACKEND_PROJ) -c Release -o $(PUBLISH_DIR)/backend

publish-frontend: build-frontend ## Copy the built SPA to ./publish/frontend
	mkdir -p $(PUBLISH_DIR)/frontend
	cp -r $(FRONTEND_DIR)/dist/. $(PUBLISH_DIR)/frontend/

# --- Test ------------------------------------------------------------------
test: test-backend test-frontend ## Run both test suites

test-backend: ## Run backend xUnit tests
	dotnet test $(BACKEND_DIR)/TodoApp.slnx

test-frontend: ## Run frontend Vitest suite
	cd $(FRONTEND_DIR) && npm run test -- --run

# --- Docker (deployable images) --------------------------------------------
docker: ## Build both container images via docker compose
	$(COMPOSE) build

docker-up: ## Build and start the full stack (frontend on :3000)
	$(COMPOSE) up --build

docker-down: ## Stop the stack
	$(COMPOSE) down

# --- Housekeeping ----------------------------------------------------------
clean: ## Remove build output and the publish folder
	rm -rf $(PUBLISH_DIR)
	dotnet clean $(BACKEND_PROJ) -c Release || true
	rm -rf $(FRONTEND_DIR)/dist
