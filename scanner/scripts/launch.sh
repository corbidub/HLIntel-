#!/bin/bash
# HL Intel — launchd entry point
# Mirrors TCC V4 launch pattern

cd /Users/corbinpaulson/hl-intel

/Library/Frameworks/Python.framework/Versions/3.13/bin/python3 main.py >> /Users/corbinpaulson/hl-intel/hl_intel.log 2>&1
