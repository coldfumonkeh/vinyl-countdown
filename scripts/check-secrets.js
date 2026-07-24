#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const IGNORED_DIRS = new Set(['node_modules', 'dist', '.git', '.firebase'])
const SUSPICIOUS_PATTERNS = [
  /token=[A-Za-z0-9]{10,}/,
  /AIzaSy[A-Za-z0-9_-]{10,}/,
  /"private_key"\s*:\s*"/,
  /-----BEGIN (RSA |EC )?PRIVATE KEY-----/
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue
    }

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walk(fullPath, files)
      continue
    }

    files.push(fullPath)
  }

  return files
}

const offenders = []

for (const file of walk(ROOT)) {
  const relativePath = path.relative(ROOT, file)

  if (relativePath === '.env' || relativePath.startsWith('.env.')) {
    continue
  }

  const content = fs.readFileSync(file, 'utf8')

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      offenders.push(relativePath)
      break
    }
  }
}

if (offenders.length > 0) {
  console.error('Potential secrets found in tracked files:')
  offenders.forEach(file => console.error(` - ${file}`))
  process.exit(1)
}

console.log('No committed secrets detected')
