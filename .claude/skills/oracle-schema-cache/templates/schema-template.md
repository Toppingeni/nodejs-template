# Schema Template

Use this format when saving table schemas to `server/schema/<table>.md`.

## Format

```text
columns:
- COL_NAME DATA_TYPE(LEN|PREC,SCALE) [PK] [NN] [NULL]
```

## Abbreviations

| Abbr   | Meaning     |
| ------ | ----------- |
| `PK`   | Primary key |
| `NN`   | Not null    |
| `NULL` | Nullable    |

## Example (`server/schema/users.md`)

```text
columns:
- USER_ID NUMBER(10) PK NN
- USERNAME VARCHAR2(50) NN
- EMAIL VARCHAR2(100) NULL
- STATUS VARCHAR2(10) NN
- CREATED_AT DATE NULL
- UPDATED_BY VARCHAR2(30) NULL
```

## Rules

- One line per column
- No extra prose or comments
- Filename is lowercase table name: `<table>.md`
- Include ALL columns — don't omit any
- Data type includes length/precision: `VARCHAR2(50)`, `NUMBER(10,2)`
