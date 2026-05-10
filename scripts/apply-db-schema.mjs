import fs from 'node:fs'
import { Client } from 'pg'

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return

  for (const line of fs.readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/)
    if (match) {
      process.env[match[1]] = match[2]
    }
  }
}

loadEnvFile('.env.local')

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error('POSTGRES_URL_NON_POOLING or POSTGRES_URL is required')
}

const url = new URL(connectionString)
url.searchParams.delete('sslmode')

const client = new Client({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
})

await client.connect()

try {
  const sql = fs.readFileSync(new URL('./000_setup_database.sql', import.meta.url), 'utf8')
  await client.query(sql)
  console.log('Database schema applied successfully.')
} finally {
  await client.end()
}
