const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const { once } = require('node:events')
const path = require('node:path')
const { test } = require('node:test')

test('the example server responds to GET /', { timeout: 10000 }, async (t) => {
  const server = spawn(process.execPath, ['index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe']
  })
  let stderr = ''
  server.stderr.on('data', (chunk) => { stderr += chunk })

  t.after(async () => {
    if (server.exitCode === null && server.signalCode === null) {
      const exited = once(server, 'exit')
      server.kill()
      await exited
    }
  })

  const [output] = await Promise.race([
    once(server.stdout, 'data'),
    once(server, 'exit').then(([code]) => {
      throw new Error(`Server exited before listening (${code}): ${stderr}`)
    })
  ])
  assert.match(output.toString(), /Example app listening on port 3200/)

  const response = await fetch('http://127.0.0.1:3200/')
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /text\/html/)
  assert.equal(await response.text(), 'Hello World!')
})
