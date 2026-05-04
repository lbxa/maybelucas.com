---
name: public-test-artifacts
description: Use when creating, publishing, seeding, or editing any externally visible test artifact, marketplace listing, product, ad, account profile, webhook fixture that may be shown to users, or live dummy item. Ensures public-facing titles, descriptions, images, usernames, prices, and metadata do not reveal internal company names, project names, code names, architecture, automation workflows, proprietary technology, business strategy, credentials, endpoints, database fields, pollers, APIs, or implementation details.
---


# Public Test Artifacts

## Rule

Public test artifacts must look like ordinary low-value consumer items. Do not reveal why the artifact exists, what system is testing it, who built it, or what internal workflow it exercises.

## Public Content

Use generic item content:

- Title: `Test T-Shirt`, `Plain Black T-Shirt`, `Basic Watch`, `Sample Mug`
- Description: `Plain test item.`
- Images: simple product-style images without internal text or logos
- Price: lowest accepted price for the marketplace

Avoid public strings such as:

- Internal company, repo, app, product, or project names
- `API`, `poller`, `webhook`, `automation`, `bot`, `script`, `reserved`, `internal`, `delete me`
- Database identifiers, handles, table/column names, tokens, account ids, URLs, endpoints, branch names
- Business logic, arbitrage strategy, marketplace sync details, source merchants, sell-side workflows

## Private Traceability

Store test purpose and internal linkage only in private systems:

- Database `raw_payload` or private notes may say the item is for a poller or integration test.
- Public marketplace fields must stay generic.
- Console logs may include private ids only when they are not being posted publicly.

Before publishing or updating a live artifact, inspect the exact public payload fields and remove internal strings.
