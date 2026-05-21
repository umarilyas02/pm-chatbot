import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import pg from 'pg'

const { Client } = pg
const client = new Client({ connectionString: process.env.DATABASE_URL })

async function run() {
  await client.connect()
  console.log('Connected to database')

  // Server version
  const { rows: [{ version }] } = await client.query('SELECT version()')
  console.log('Version:', version)

  // List user tables
  const { rows: tables } = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `)
  console.log('\nTables in public schema:')
  if (tables.length === 0) {
    console.log('  (none)')
  } else {
    tables.forEach(t => console.log(' ', t.table_name))
  }

  // Quick read test on each table
  for (const { table_name } of tables) {
    const { rows, rowCount } = await client.query(
      `SELECT * FROM "${table_name}" LIMIT 3`
    )
    console.log(`\n${table_name} (${rowCount} row(s) sampled):`, rows)
  }

  await client.end()
  console.log('\nDone.')
}

run().catch(err => {
  console.error('DB test failed:', err.message)
  process.exit(1)
})