.PHONY: build-image build-windows build-windows-installer create-local-cert sign-windows shell linux-dev clean

HOST_UID := $(shell id -u)
HOST_GID := $(shell id -g)

build-image:
	docker compose build

build-windows:
	docker compose run --rm wails

build-windows-installer:
	docker compose run --rm wails bash -c "bash scripts/build-wails.sh -platform windows/amd64 -clean -nsis -o home-shopping-scheduler.exe && chmod -R a+rwX build frontend/dist frontend/package-lock.json frontend/package.json.md5 go.mod go.sum"

create-local-cert:
	docker compose run --rm -e HOST_UID=$(HOST_UID) -e HOST_GID=$(HOST_GID) wails bash scripts/create-self-signed-code-signing-cert.sh

sign-windows:
	docker compose run --rm wails bash scripts/sign-windows-exe.sh

shell:
	docker compose --profile tools run --rm shell

linux-dev:
	docker compose --profile gui run --rm linux-dev

clean:
	rm -rf build/bin frontend/dist
