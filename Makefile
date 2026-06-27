.PHONY: build-image build-windows build-windows-installer shell linux-dev clean

build-image:
	docker compose build

build-windows:
	docker compose run --rm wails

build-windows-installer:
	docker compose run --rm wails bash -c "bash scripts/build-wails.sh -platform windows/amd64 -clean -nsis -o home-shopping-scheduler.exe && chmod -R a+rwX build frontend/dist frontend/package-lock.json frontend/package.json.md5 go.mod go.sum"

shell:
	docker compose --profile tools run --rm shell

linux-dev:
	docker compose --profile gui run --rm linux-dev

clean:
	rm -rf build/bin frontend/dist
