# Qimen Error Contract Design

## Goal

Make invalid Qimen inputs and internal calculation failures explicit so callers cannot mistake a partial `{ error: true }` object for a valid chart.

## Scope

- Add a typed `QimenValidationError` with stable `code`, `field`, and HTTP status metadata.
- Validate the calculation date, `method`, and `timePrecisionMode` at the start of `qimen.calculate()`.
- Re-throw all calculation failures instead of returning an error-shaped chart.
- Map validation errors to HTTP 400 in HTML and JSON Qimen entry points; keep unexpected errors as HTTP 500.
- Preserve successful response shapes and calculation results.
- Add core regression tests and verify the deployed API with valid and invalid requests.

Time parsing consolidation, request-local i18n, app factory extraction, and removal of duplicated distribution functions remain separate changes.

## Error Contract

Validation failures use:

```js
new QimenValidationError(message, { code, field })
```

The error exposes `name = 'QimenValidationError'`, `statusCode = 400`, a stable machine-readable `code`, and the invalid `field`. Unexpected library or calculation failures retain their original error type and are returned as HTTP 500 by route handlers.

## Accepted Inputs

- `date`: a valid JavaScript `Date`.
- `method`: `時家`, `日家`, `月家`, or `年家`.
- `timePrecisionMode`: `traditional` or `advanced`.

## Verification

- Tests first demonstrate that invalid date, method, and precision mode currently do not throw the required validation error.
- After implementation, those inputs throw `QimenValidationError` with the expected field and code.
- Existing six successful calculation tests remain unchanged and pass.
- Production `/api/qimen` returns 400 for invalid method or precision and 200 for a valid fixed chart.
