---
name: CSV Toolkit CLI
description: Transform, filter, merge, validate CSV files. Zero dependencies. Fast ETL operations from the command line. Free data processing tool.
tags: [csv, data, transform, etl, filter, merge, cli, data-processing]
---

# CSV Toolkit CLI

Swiss army knife for CSV files. Transform, filter, merge, validate.

**Zero dependencies. Blazing fast. Just works.**

## Quick Start

```bash
npm install -g @lxgicstudios/csvkit-next
```

```bash
# View CSV with pretty formatting
csvkit view data.csv

# Filter rows
csvkit filter data.csv "age > 25"

# Select columns
csvkit select data.csv name,email,phone
```

## What It Does

### Transform
- Add/remove/rename columns
- Convert data types
- Format dates
- Calculate new columns

### Filter
- SQL-like WHERE clauses
- Regex matching
- Numeric comparisons
- Null handling

### Merge
- Join CSV files (inner, left, right, outer)
- Concatenate files
- Deduplicate rows
- Union operations

### Validate
- Schema validation
- Type checking
- Required fields
- Custom rules

## Commands

```bash
# Merge CSVs
csvkit merge file1.csv file2.csv -o combined.csv

# Join on key
csvkit join users.csv orders.csv --on user_id

# Sort
csvkit sort data.csv --by date --desc

# Stats summary
csvkit stats data.csv

# Convert to JSON
csvkit to-json data.csv -o data.json

# Deduplicate
csvkit dedup data.csv --on email
```

## Piping Support

```bash
# Chain operations
cat data.csv | csvkit filter "status = 'active'" | csvkit select name,email

# From other tools
curl https://api.example.com/data.csv | csvkit stats
```

## When to Use This

- Data cleaning and preparation
- ETL pipelines
- Log analysis
- Report generation
- Quick data exploration

---

**Built by [LXGIC Studios](https://lxgicstudios.com)**

🔗 [GitHub](https://github.com/lxgicstudios/csvkit-next) · [Twitter](https://x.com/lxgicstudios)
