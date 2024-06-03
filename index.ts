import { exec } from 'child_process'
import { CronJob } from 'cron'
import { EventEmitter } from 'events'
import { WebSocketServer } from 'ws'

const CONFIG = {
  target: "https://www.youtube.com/@fanatic1514",
  wssHost: "127.0.0.1",
  wssPort: 40001
}

const CMD_BASE = `yt-dlp --flat-playlist ${CONFIG.target}`

const store = new Set<string>()

const ee = new EventEmitter({ captureRejections: true })

function getIds() {
  const cmd = `${CMD_BASE} --print id`
  return new Promise<string[]>((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err || stderr) return reject(err || stderr)
      return resolve(stdout.split('\n').filter(Boolean))
    })
  })
}

async function tick() {
  const ids = await getIds()
  const newIds = ids.filter(id => !store.has(id))

  if (newIds.length === 0) return Promise.resolve()
  newIds.forEach((id) => store.add(id))

  ee.emit('FOUND', newIds)
}


const cronJob = new CronJob(
  '0-59 * * * *',
  tick,
  null,
  true,
)


cronJob.start()

const wss = new WebSocketServer({ host: CONFIG.wssHost, port: CONFIG.wssPort })

wss.on('connection', (ws, req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  console.debug(`Client ${ip} connected`)
  ws.on('close', (code, reason) => {
    console.log(`Client ${ip} disconnected by ${reason.toString()}(${code})`)
  })
})

// Broadcast new ids to ws clients
ee.addListener('FOUND', (newIds: string[]) => {
  wss.clients.forEach(ws => {
    ws.send(JSON.stringify({ type: 'IDs', payload: newIds }))
  })
})

console.log(`Socket starts at port ${wss.options.port}`)