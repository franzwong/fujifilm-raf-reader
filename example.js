const { walkDirectoryEntries } = require('./index')

async function main() {
  await walkDirectoryEntries('examples/sample.RAF', (directoryEntry, val) => {
    switch (directoryEntry.tag) {
      case 'APERTUREVALUE':
        // Aperture is stored as APEX value
        console.log(`${directoryEntry.tag}: ${Math.pow(Math.pow(2, val[0] / val[1]), 0.5)}`)
        break
      case 'SHUTTERSPEEDVALUE':
        // Shutterspeed is stored as APEX value
        console.log(`${directoryEntry.tag}: ${1/Math.pow(2, val[0]/val[1])}`)
        break
      case 'ISO':
      case 'MAKE':
      case 'LENSMAKE':
      case 'LENSMODEL':
        console.log(`${directoryEntry.tag}: ${val}`)
        break
    }
  })
}

main()
