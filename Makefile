.PHONY: dev build deploy test clean setup refresh-db remote-migrate compile-css

setup:
	direnv allow
	pnpm install

dev: refresh-db
	pnpm --filter "*" run dev

dev-dashboard:
	cd apps/dashboard && pnpm run dev

dev-dashboard-ui:
	cd apps/dashboard-ui && pnpm run dev

dev-customer-menu:
	cd apps/customer-menu && pnpm run dev

tmux-dev: 
	tmux split-window -v "make dev-dashboard-ui"
	tmux split-window -h "make dev-customer-menu"
	tmux select-pane -t 0
	make dev-dashboard

compile-css:
	node scripts/compile-css.js

build: compile-css
	pnpm --filter "*" run build

deploy: build remote-migrate
	@echo "Deploying applications to production..."
	@echo "Deploying dashboard API..."
	(cd apps/dashboard && npx wrangler deploy)
	@echo "Deploying customer menu worker..."
	(cd apps/customer-menu && npx wrangler deploy)
	@echo "Deploying dashboard UI..."
	(cd apps/dashboard-ui && npx wrangler pages deploy dist --project-name qr-menu-dashboard-ui --branch master)

test:
	pnpm --filter "*" run test

clean:
	rm -rf node_modules
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name ".wrangler" -type d -prune -exec rm -rf '{}' +

refresh-db:
	@echo "Wiping local D1 database state..."
	rm -rf apps/dashboard/.wrangler/state/v3/d1
	@echo "Applying migrations in order..."
	@for file in packages/db/migrations/*.sql; do \
		echo "Executing $$file..."; \
		(cd apps/dashboard && npx wrangler d1 execute DB --local --file=../../$$file) || exit 1; \
	done
	@echo "Database refresh complete!"

remote-migrate:
	@echo "Applying migrations to remote D1 database..."
	bash -c ". ~/.nvm/nvm.sh && nvm use && cd apps/dashboard && npx wrangler d1 migrations apply DB --remote"
