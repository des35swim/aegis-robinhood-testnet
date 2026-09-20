.PHONY: test probe

test:
	python3 -m unittest discover -s spikes/connectivity_probe/tests -v

probe:
	python3 spikes/connectivity_probe/probe.py --config spikes/connectivity_probe/config.example.json
