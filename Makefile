.PHONY: recover recovery-check recovery-closeout

RECOVERY_DIR := _recovery

recover:
	@echo "== HL Intel Recovery Snapshot =="
	@echo "Workspace: $(CURDIR)"
	@echo
	@echo "== Git =="
	@git status --short --branch
	@echo
	@echo "== Recent Commits =="
	@git log --oneline --decorate -5
	@echo
	@echo "== Read First =="
	@for file in CURRENT_STATE.md NEXT_STEPS.md SESSION_LOG.md DECISIONS.md OPEN_QUESTIONS.md; do \
		if [ -f "$(RECOVERY_DIR)/$$file" ]; then \
			echo "- $(RECOVERY_DIR)/$$file"; \
		else \
			echo "- MISSING: $(RECOVERY_DIR)/$$file"; \
		fi; \
	done
	@echo
	@echo "== Current State =="
	@sed -n '1,180p' "$(RECOVERY_DIR)/CURRENT_STATE.md"
	@echo
	@echo "== Next Steps =="
	@sed -n '1,140p' "$(RECOVERY_DIR)/NEXT_STEPS.md"

recovery-check:
	@test -f "$(RECOVERY_DIR)/CURRENT_STATE.md"
	@test -f "$(RECOVERY_DIR)/NEXT_STEPS.md"
	@test -f "$(RECOVERY_DIR)/SESSION_LOG.md"
	@test -f "$(RECOVERY_DIR)/DECISIONS.md"
	@test -f "$(RECOVERY_DIR)/OPEN_QUESTIONS.md"
	@test -f "$(RECOVERY_DIR)/BOOTSTRAP_PROMPT.md"
	@echo "Recovery files are present."

recovery-closeout:
	@echo "Before ending a session, update:"
	@echo "- $(RECOVERY_DIR)/CURRENT_STATE.md"
	@echo "- $(RECOVERY_DIR)/NEXT_STEPS.md"
	@echo "- $(RECOVERY_DIR)/SESSION_LOG.md"
	@echo "- $(RECOVERY_DIR)/DECISIONS.md, if a decision changed"
	@echo "- $(RECOVERY_DIR)/OPEN_QUESTIONS.md, if uncertainty changed"
	@echo
	@echo "Use $(RECOVERY_DIR)/SESSION_CLOSEOUT_TEMPLATE.md as the checklist."
