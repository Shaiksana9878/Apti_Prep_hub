---
name: Anthropic credit fallback
description: Provider credentials can be present while Anthropic rejects requests for account-credit reasons.
---

Treat Anthropic account-credit failures as a normal unavailable-AI state: keep the app usable with local fallback content, show a friendly offline message, and do not surface upstream response details or secrets to users.

**Why:** A configured API key does not guarantee the provider account has credits, and the provider reports this as a normal upstream request error.

**How to apply:** Preserve local plan, practice, lesson, and chat fallbacks whenever adding Anthropic-powered flows.