import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const { Client } = pg

async function runMigration(file) {
  const sql = readFileSync(join(__dirname, file), 'utf8')
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    await client.query(sql)
    console.log(`✓ ${file}`)
  } finally {
    await client.end()
  }
}

await runMigration('migrate.sql')
await runMigration('migrate-chat.sql')
await runMigration('migrate-context.sql')
console.log('All migrations complete.')
