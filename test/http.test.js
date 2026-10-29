const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const { once } = require('node:events')
const path = require('node:path')
const { test } = require('node:test')

test('the application serves its greeting and rejects unknown routes', { timeout: 10000 }, async (t) => {
  const server = spawn(process.execPath, ['index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe']
  })
  const exited = once(server, 'exit')
  t.after(async () => {
    if (server.exitCode === null && server.signalCode === null) server.kill()
    await exited
  })
  let output = ''
  let errors = ''
  server.stderr.on('data', (chunk) => { errors += chunk })
  await new Promise((resolve, reject) => {
    server.on('error', reject)
    server.on('exit', (code, signal) => reject(new Error(`Server exited (${code || signal}): ${errors}`)))
    server.stdout.on('data', (chunk) => {
      output += chunk
      if (output.includes('Example app listening on port 3200')) resolve()
    })
  })
  const response = await fetch('http://127.0.0.1:3200/')
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /^text\/html/)
  assert.equal(await response.text(), 'Hello World!')
  const missing = await fetch('http://127.0.0.1:3200/does-not-exist')
  assert.equal(missing.status, 404)
})
