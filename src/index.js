/**
 * CSV Parser - handles quoted fields, newlines in fields, etc.
 */
function parseCSV(text, delimiter = ',') {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        current.push(field);
        field = '';
      } else if (char === '\n' || (char === '\r' && next === '\n')) {
        if (char === '\r') i++;
        current.push(field);
        if (current.length > 0 && current.some(c => c !== '')) {
          rows.push(current);
        }
        current = [];
        field = '';
      } else if (char !== '\r') {
        field += char;
      }
    }
  }

  // Handle last field/row
  current.push(field);
  if (current.length > 0 && current.some(c => c !== '')) {
    rows.push(current);
  }

  // Convert to objects using first row as headers
  if (rows.length === 0) return [];
  
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || '';
    });
    return obj;
  });
}

/**
 * Convert array of objects back to CSV string
 */
function stringifyCSV(data, delimiter = ',') {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const escapeField = (val) => {
    const str = String(val ?? '');
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.map(escapeField).join(delimiter)];
  for (const row of data) {
    lines.push(headers.map(h => escapeField(row[h])).join(delimiter));
  }
  return lines.join('\n');
}

/**
 * Filter rows by condition
 */
function filter(data, column, operator, value) {
  const ops = {
    eq: (a, b) => a === b,
    ne: (a, b) => a !== b,
    gt: (a, b) => parseFloat(a) > parseFloat(b),
    lt: (a, b) => parseFloat(a) < parseFloat(b),
    gte: (a, b) => parseFloat(a) >= parseFloat(b),
    lte: (a, b) => parseFloat(a) <= parseFloat(b),
    contains: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
    startswith: (a, b) => String(a).toLowerCase().startsWith(String(b).toLowerCase()),
    endswith: (a, b) => String(a).toLowerCase().endsWith(String(b).toLowerCase()),
    regex: (a, b) => new RegExp(b, 'i').test(String(a)),
    empty: (a) => !a || a === '',
    notempty: (a) => a && a !== ''
  };

  const op = ops[operator.toLowerCase()];
  if (!op) throw new Error(`Unknown operator: ${operator}`);

  return data.filter(row => op(row[column], value));
}

/**
 * Transform columns using expression
 * Supports: new_col=col1+col2, new_col=col1.toUpperCase(), etc.
 */
function transform(data, expression) {
  // Parse expression: new_col=expression
  const match = expression.match(/^(\w+)\s*=\s*(.+)$/);
  if (!match) throw new Error('Invalid expression. Use: column=expression');

  const [, newCol, expr] = match;

  return data.map(row => {
    const newRow = { ...row };
    
    // Replace column references with values
    let evalExpr = expr;
    Object.keys(row).forEach(col => {
      const val = row[col];
      const numVal = parseFloat(val);
      const replacement = isNaN(numVal) ? `"${val}"` : numVal;
      evalExpr = evalExpr.replace(new RegExp(`\\b${col}\\b`, 'g'), replacement);
    });

    try {
      newRow[newCol] = eval(evalExpr);
    } catch (e) {
      newRow[newCol] = '';
    }
    return newRow;
  });
}

/**
 * Merge two CSV datasets (vertical append)
 */
function merge(data1, data2) {
  const headers1 = Object.keys(data1[0] || {});
  const headers2 = Object.keys(data2[0] || {});
  const allHeaders = [...new Set([...headers1, ...headers2])];

  const normalize = (row) => {
    const newRow = {};
    allHeaders.forEach(h => {
      newRow[h] = row[h] || '';
    });
    return newRow;
  };

  return [...data1.map(normalize), ...data2.map(normalize)];
}

/**
 * Validate CSV data against optional schema
 */
function validate(data, schema = null) {
  const issues = [];

  if (data.length === 0) {
    issues.push({ row: 0, message: 'Empty dataset' });
    return issues;
  }

  const headers = Object.keys(data[0]);

  // Check for empty headers
  headers.forEach((h, i) => {
    if (!h || h.trim() === '') {
      issues.push({ row: 0, message: `Empty header at column ${i + 1}` });
    }
  });

  // Basic consistency check
  data.forEach((row, i) => {
    const rowKeys = Object.keys(row);
    if (rowKeys.length !== headers.length) {
      issues.push({ row: i + 2, message: `Column count mismatch: expected ${headers.length}, got ${rowKeys.length}` });
    }
  });

  // Schema validation if provided
  if (schema) {
    const { required = [], types = {} } = schema;

    required.forEach(col => {
      if (!headers.includes(col)) {
        issues.push({ row: 0, message: `Missing required column: ${col}` });
      }
    });

    data.forEach((row, i) => {
      Object.entries(types).forEach(([col, type]) => {
        const val = row[col];
        if (val === undefined || val === '') return;

        if (type === 'number' && isNaN(parseFloat(val))) {
          issues.push({ row: i + 2, message: `${col}: expected number, got "${val}"` });
        }
        if (type === 'email' && !val.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          issues.push({ row: i + 2, message: `${col}: invalid email "${val}"` });
        }
        if (type === 'date' && isNaN(Date.parse(val))) {
          issues.push({ row: i + 2, message: `${col}: invalid date "${val}"` });
        }
      });
    });
  }

  return issues;
}

/**
 * Get statistics about the data
 */
function stats(data) {
  if (data.length === 0) return { rows: 0, columns: [], columnStats: {} };

  const headers = Object.keys(data[0]);
  const columnStats = {};

  headers.forEach(col => {
    const values = data.map(r => r[col]);
    const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
    const unique = new Set(nonEmpty);
    
    // Detect type
    const numbers = nonEmpty.map(v => parseFloat(v)).filter(n => !isNaN(n));
    const isNumeric = numbers.length > nonEmpty.length * 0.8;

    columnStats[col] = {
      type: isNumeric ? 'number' : 'string',
      nonEmpty: nonEmpty.length,
      unique: unique.size
    };

    if (isNumeric && numbers.length > 0) {
      columnStats[col].min = Math.min(...numbers);
      columnStats[col].max = Math.max(...numbers);
      columnStats[col].avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }
  });

  return {
    rows: data.length,
    columns: headers,
    columnStats
  };
}

/**
 * Get first n rows
 */
function head(data, n = 10) {
  return data.slice(0, n);
}

/**
 * Get last n rows
 */
function tail(data, n = 10) {
  return data.slice(-n);
}

/**
 * Get column names
 */
function columns(data) {
  return data.length > 0 ? Object.keys(data[0]) : [];
}

/**
 * Sort by column
 */
function sort(data, column, descending = false) {
  return [...data].sort((a, b) => {
    const valA = a[column];
    const valB = b[column];
    
    const numA = parseFloat(valA);
    const numB = parseFloat(valB);
    
    let cmp;
    if (!isNaN(numA) && !isNaN(numB)) {
      cmp = numA - numB;
    } else {
      cmp = String(valA).localeCompare(String(valB));
    }
    
    return descending ? -cmp : cmp;
  });
}

/**
 * Get unique values from column
 */
function unique(data, column) {
  const values = new Set(data.map(r => r[column]));
  return [...values].filter(v => v !== '');
}

/**
 * Random sample of rows
 */
function sample(data, n = 10) {
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, data.length));
}

module.exports = {
  parseCSV,
  stringifyCSV,
  filter,
  transform,
  merge,
  validate,
  stats,
  head,
  tail,
  columns,
  sort,
  unique,
  sample
};
