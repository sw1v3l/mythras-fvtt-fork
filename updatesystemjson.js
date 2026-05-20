const yargs = require('yargs')
const fs = require('fs')

const argv = yargs
  .version(false)
  .option('systemVersion', {
    type: 'string',
    description: 'specifies the version tag'
  })
  .option('repository', {
    type: 'string',
    description: 'The GitHub repository (e.g., owner/repo)'
  })
  .demandOption(['repository', 'systemVersion']).argv

const systemRaw = fs.readFileSync('system.json')
let system = JSON.parse(systemRaw)

system.version = argv.systemVersion
system.url = `https://github.com/${argv.repository}`
system.manifest = `https://github.com/${argv.repository}/releases/latest/download/system.json`
system.download = `https://github.com/${argv.repository}/releases/download/${argv.systemVersion}/mythras.zip`

fs.writeFileSync('system.json', JSON.stringify(system, null, 2))

console.log(system.manifest)
