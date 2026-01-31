#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { 
  parseCSV, stringifyCSV, filter, transform, 
  merge, validate, stats, head, tail, columns,
  sort, unique, sample
} = require('../src/index');

const args = process.argv.slice(2);
const command = args[0];

const HELP = `
csvkit - Advanced CSV Toolkit

COMMANDS
  filter <file> <column> <op> <value>    Filter rows by condition
  transform <file> <expr>                Transform columns
  merge <file1> <file2>                  Merge CSV files
  validate <file> [schema]               Validate CSV structure
  stats <file>                           Show statistics
  head <file> [n]                        Show first n rows (default: 10)
  tail <file> [n]                        Show last n rows (default: 10)
  columns <file>                         List column names
  sort <file> <column> [asc|desc]        Sort by column
  unique <file> <column>                 Get unique values
  sample <file> [n]                      Random sample of n rows
  convert <file> -t <format>             Convert to JSON/TSV

FILTER OPERATORS
  eq, ne, gt, lt, gte, lte, contains, startswith, endswith, regex

OPTIONS
  -o, --output <file>    Output file (default: stdout)
  -d, --delimiter <char> Delimiter (default: ,)
  -h, --help             Show help

EXAMPLES
  csvkit filter data.csv age gt 30
  csvkit transform data.csv "full_name=first+' '+last"
  csvkit merge users.csv orders.csv -o combined.csv
  csvkit stats sales.csv
  csvkit sort data.csv price desc

LXGIC Studios | https://lxgicstudios.com
`;

function getOption(flag, short) {
  const idx = args.indexOf(flag);
  const shortIdx = args.indexOf(short);
  const i = idx !== -1 ? idx : shortIdx;
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

function hasFlag(flag, short) {
  return args.includes(flag) || args.includes(short);
}

async function main() {
  if (!command || command === '-h' || command === '--help' || command === 'help') {
    console.log(HELP);
    process.exit(0);
  }

  const output = getOption('--output', '-o');
  const delimiter = getOption('--delimiter', '-d') || ',';

  try {
    let result;

    switch (command) {
      case 'filter': {
        const [, file, col, op, value] = args;
        if (!file || !col || !op) {
          console.error('Usage: csvkit filter <file> <column> <op> <value>');
          process.exit(1);
        }
        const data = parseCSV(fs.readFileSync(file, 'utf-8'), delimiter);
        result = filter(data, col, op, value);
        break;
      }

      case 'transform': {
        const [, file, expr] = args;
        if (!file || !expr) {
          console.error('Usage: csvkit transform <file> "<expr>"');
          process.exit(1);
        }
        const data = parseCSV(fs.readFileSync(file, 'utf-8'), delimiter);
        result = transform(data, expr);
        break;
      }

      case 'merge': {
        const [, file1, file2] = args;
        if (!file1 || !file2) {
          console.error('Usage: csvkit merge <file1> <file2>');
          process.exit(1);
        }
        const data1 = parseCSV(fs.readFileSync(file1, 'utf-8'), delimiter);
        const data2 = parseCSV(fs.readFileSync(file2, 'utf-8'), delimiter);
        result = merge(data1, data2);
        break;
      }

      case 'validate': {
        const [, file, schemaFile] = args;
        if (!file) {
          console.error('Usage: csvkit validate <file> [schema.json]');
          process.exit(1);
        }
        const data = parseCSV(fs.readFileSync(file, 'utf-8'), delimiter);
        const schema = schemaFile ? JSON.parse(fs.readFileSync(schemaFile, 'utf-8')) : null;
        const issues = validate(data, schema);
        if (issues.length === 0) {
          console.log('✓ CSV is valid');
        } else {
          console.log(`Found ${issues.length} issues:`);
          issues.forEach(i => console.log(`  - Row ${i.row}: ${i.message}`));
          process.exit(1);
        }
        return;
      }

      case 'stats': {
        const [, file] = args;
        if (!file) {
          console.error('Usage: csvkit stats <file>');
          process.exit(1);
        }
        const data = parseCSV(fs.readFileSync(file, 'utf-8'), delimiter);
        const s = stats(data);
        console.log(`Rows: ${s.rows}`);
        console.log(`Columns: ${s.columns.join(', ')}`);
        console.log('\nColumn Stats:');
        Object.entries(s.columnStats).forEach(([col, info]) => {
          console.log(`  ${col}:`);
          console.log(`    Type: ${info.type}`);
          console.log(`    Non-empty: ${info.nonEmpty}/${s.rows}`);
          if (info.type === 'number') {
            console.log(`    Min: ${info.min}, Max: ${info.max}, Avg: ${info.avg.toFixed(2)}`);
          }
          console.log(`    Unique: ${info.unique}`);
        });
        return;
      }

      case 'head': {
        const [, file, n = '10'] = args;
        if (!file) {
          console.error('Usage: csvkit head <file> [n]');
          process.exit(1);
        }
        const data = parseCSV(fs.readFileSync(file, 'utf-8'), delimiter);
        result = head(data, parseInt(n));
        break;
      }

      case 'tail': {
        const [, file, n = '10'] = args;
        if (!file) {
          console.error('Usage: csvkit tail <file> [n]');
          process.exit(1);
        }
        const data = parseCSV(fs.readFileSync(file, 'utf-8'), delimiter);
        result = tail(data, parseInt(n));
        break;
      }

      case 'columns': {
        const [, file] = args;
        if (!file) {
          console.error('Usage: csvkit columns <file>');
          process.exit(1);
        }
        const data = parseCSV(fs.readFileSync(file, 'utf-8'), delimiter);
        const cols = columns(data);
        cols.forEach((c, i) => console.log(`${i + 1}. ${c}`));
        return;
      }

      case 'sort': {
        const [, file, col, order = 'asc'] = args;
        if (!file || !col) {
          console.error('Usage: csvkit sort <file> <column> [asc|desc]');
          process.exit(1);
        }
        const data = parseCSV(fs.readFileSync(file, 'utf-8'), delimiter);
        result = sort(data, col, order === 'desc');
        break;
      }

      case 'unique': {
        const [, file, col] = args;
        if (!file || !col) {
          console.error('Usage: csvkit unique <file> <column>');
          process.exit(1);
        }
        const data = parseCSV(fs.readFileSync(file, 'utf-8'), delimiter);
        const values = unique(data, col);
        values.forEach(v => console.log(v));
        return;
      }

      case 'sample': {
        const [, file, n = '10'] = args;
        if (!file) {
          console.error('Usage: csvkit sample <file> [n]');
          process.exit(1);
        }
        const data = parseCSV(fs.readFileSync(file, 'utf-8'), delimiter);
        result = sample(data, parseInt(n));
        break;
      }

      case 'convert': {
        const [, file] = args;
        const format = getOption('-t', '--to') || 'json';
        if (!file) {
          console.error('Usage: csvkit convert <file> -t <json|tsv>');
          process.exit(1);
        }
        const data = parseCSV(fs.readFileSync(file, 'utf-8'), delimiter);
        if (format === 'json') {
          const out = output || file.replace(/\.csv$/i, '.json');
          fs.writeFileSync(out, JSON.stringify(data, null, 2));
          console.log(`✓ Converted to ${out}`);
        } else if (format === 'tsv') {
          const out = output || file.replace(/\.csv$/i, '.tsv');
          fs.writeFileSync(out, stringifyCSV(data, '\t'));
          console.log(`✓ Converted to ${out}`);
        }
        return;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.log('Run "csvkit --help" for usage');
        process.exit(1);
    }

    // Output result
    const csvOutput = stringifyCSV(result, delimiter);
    if (output) {
      fs.writeFileSync(output, csvOutput);
      console.error(`✓ Written to ${output}`);
    } else {
      console.log(csvOutput);
    }

  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
