# Makefile do fed-catalogo-tarefas
#
# Alvo único: oferecer comandos curtos e iguais entre Windows, Linux e
# macOS. No Windows, instale o GNU Make (via Chocolatey: `choco install
# make`, ou via WSL). O conteúdo é portável — usa apenas `cd`, `npm` e
# `firebase`, sem flags específicas de plataforma.

APP_DIR := fed-catalogo-tarefas-app
FUNCTIONS_DIR := functions

.PHONY: help install serve test lint build rules-deploy

help:
	@echo "Targets disponíveis:"
	@echo "  make install       Instala dependências do app e das Cloud Functions"
	@echo "  make serve         Sobe o dev server Angular (ng serve)"
	@echo "  make test          Roda testes unitários (Karma) e E2E (Playwright)"
	@echo "  make lint          Roda ng lint"
	@echo "  make build         Build de produção"
	@echo "  make rules-deploy  Publica firestore.rules + firestore.indexes.json"

install:
	cd $(APP_DIR) && npm ci
	@if [ -f $(FUNCTIONS_DIR)/package-lock.json ]; then \
		cd $(FUNCTIONS_DIR) && npm ci ; \
	else \
		echo "[skip] $(FUNCTIONS_DIR) ainda sem package-lock.json — Release 3 instalará" ; \
	fi

serve:
	cd $(APP_DIR) && npm start

test:
	cd $(APP_DIR) && npm run test -- --watch=false --browsers=ChromeHeadless
	cd $(APP_DIR) && npm run e2e

lint:
	cd $(APP_DIR) && npx ng lint

build:
	cd $(APP_DIR) && npm run build -- --configuration=production

rules-deploy:
	firebase deploy --only firestore:rules,firestore:indexes
