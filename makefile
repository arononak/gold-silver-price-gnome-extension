EXTENSION_PACKAGE := gold-silver-price@arononak.github.io.shell-extension.zip

build:
	cd gold-silver-price@arononak.github.io &&\
	gnome-extensions pack --out-dir=../ --force

install: build
	gnome-extensions install $(EXTENSION_PACKAGE) --force
	rm -r -f $(EXTENSION_PACKAGE)

run: install
	env MUTTER_DEBUG_DUMMY_MODE_SPECS=1600x1200 \
	dbus-run-session -- gnome-shell --nested --wayland
	gnome-extensions enable $(EXTENSION_PACKAGE)

