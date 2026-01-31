# csvkit-next

Advanced CSV toolkit. Transform, filter, merge, validate, and analyze CSV files. Zero dependencies.

## Installation

```bash
npm install -g @lxgicstudios/csvkit-next
```

Or use directly:

```bash
npx @lxgicstudios/csvkit-next stats data.csv
```

## Commands

### Filter rows

```bash
csvkit filter data.csv age gt 30
csvkit filter users.csv email contains @gmail
csvkit filter sales.csv status eq completed
```

**Operators:** eq, ne, gt, lt, gte, lte, contains, startswith, endswith, regex, empty, notempty

### Transform columns

```bash
csvkit transform data.csv "full_name=first+' '+last"
csvkit transform prices.csv "total=price*quantity"
csvkit transform users.csv "email_domain=email.split('@')[1]"
```

### Merge files

```bash
csvkit merge users.csv orders.csv -o combined.csv
```

### Validate

```bash
csvkit validate data.csv
csvkit validate data.csv schema.json
```

Schema format:
```json
{
  "required": ["id", "email"],
  "types": {
    "age": "number",
    "email": "email",
    "created": "date"
  }
}
```

### Statistics

```bash
csvkit stats sales.csv
```

Output:
```
Rows: 1523
Columns: id, product, price, quantity, date

Column Stats:
  price:
    Type: number
    Non-empty: 1523/1523
    Min: 9.99, Max: 499.99, Avg: 87.45
    Unique: 342
```

### Other Commands

```bash
csvkit head data.csv 20          # First 20 rows
csvkit tail data.csv 20          # Last 20 rows
csvkit columns data.csv          # List columns
csvkit sort data.csv price desc  # Sort by price descending
csvkit unique data.csv category  # Unique values in column
csvkit sample data.csv 50        # Random 50 rows
csvkit convert data.csv -t json  # Convert to JSON
```

## Programmatic Usage

```javascript
const { parseCSV, filter, transform, stats } = require('@lxgicstudios/csvkit-next');

// Parse CSV
const data = parseCSV(csvString);

// Filter
const adults = filter(data, 'age', 'gte', '18');

// Transform
const withFullName = transform(data, "name=first+' '+last");

// Get stats
const statistics = stats(data);
console.log(statistics.rows, statistics.columns);
```

## Why csvkit-next?

- **Zero dependencies** - Pure JavaScript, nothing to install
- **Fast** - Streams large files efficiently
- **Complete** - Filter, transform, merge, validate, analyze
- **Scriptable** - Works great in pipelines

---

**Built by [LXGIC Studios](https://lxgicstudios.com)**

🔗 [GitHub](https://github.com/lxgicstudios/csvkit-next) · [Twitter](https://x.com/lxgicstudios)
