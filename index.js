const fs = require('fs')
const util = require('util')

const open = util.promisify(fs.open)
const close = util.promisify(fs.close)
const read = util.promisify(fs.read)

const BUFFER_SIZE = 4096
const DIRECTORY_ENTRY_SIZE = 12

const { getAsciiString, getHexString, readUInt32, readUInt16, readInt32 } = require('./helpers')
const { TAGS, DATA_FORMATS } = require('./definitions')

async function getImageFileDirectory(byteAlign, fd, buffer, ifdOffset) {
  const DIRECTORY_COUNT_SIZE = 2

  let ret = await read(fd, buffer, 0, DIRECTORY_COUNT_SIZE, ifdOffset)
  if (ret.bytesRead !== DIRECTORY_COUNT_SIZE) {
    throw new Error('Invalid file')
  }

  const ifd = {
    directoryEntries: []
  }

  const directoryCount = readUInt16(byteAlign)(buffer)(0)

  for (let i=0; i<directoryCount; ++i) {
    // TODO: Improve performance by reading a batch, but be careful about the buffer size
    ret = await read(fd, buffer, 0, DIRECTORY_ENTRY_SIZE, ifdOffset + DIRECTORY_COUNT_SIZE + (i * DIRECTORY_ENTRY_SIZE))
    if (ret.bytesRead !== DIRECTORY_ENTRY_SIZE) {
      throw new Error('Invalid file')
    }

    directoryEntry = {}

    let offset = 0
    directoryEntry.tagNumber = readUInt16(byteAlign)(buffer)(0)
    directoryEntry.tag = TAGS[directoryEntry.tagNumber]
    directoryEntry.dataFormatId = readUInt16(byteAlign)(buffer)(offset += 2)
    directoryEntry.componentCount = readUInt32(byteAlign)(buffer)(offset += 2)

    const dataFormat = DATA_FORMATS[directoryEntry.dataFormatId]
    if (dataFormat) {
      const totalBytes = dataFormat.size * directoryEntry.componentCount

      if (totalBytes < 4) {
        directoryEntry.dataValue = Buffer.alloc(4)
        buffer.copy(directoryEntry.dataValue, 0, offset + 4, offset + 8)
      } else {
        directoryEntry.dataValue = readUInt32(byteAlign)(buffer)(offset + 4)
      }
    }

    ifd.directoryEntries.push(directoryEntry)
  }

  return ifd
}

async function getAllDirectoryEntries(fd) {
  const buffer = Buffer.alloc(BUFFER_SIZE)

  let ifd0Start = 0
  let bytesToRead = 16 + 4 + 8 + 32 + 4 + 20 + 4
  ifd0Start += bytesToRead
  let ret = await read(fd, buffer, 0, bytesToRead, null)
  if (ret.bytesRead !== bytesToRead) {
    throw new Error('Invalid file')
  }

  const jpgImageOffset = buffer.readInt32BE(84)

  bytesToRead = jpgImageOffset - bytesToRead
  ifd0Start += bytesToRead
  ret = await read(fd, buffer, 0, bytesToRead, null)
  if (ret.bytesRead !== bytesToRead) {
    throw new Error('Invalid file')
  }

  bytesToRead = 2 + 2 + 2 + 6 + 8 + 2
  ifd0Start += 12
  ret = await read(fd, buffer, 0, bytesToRead, null)
  if (ret.bytesRead !== bytesToRead) {
    throw new Error('Invalid file')
  }

  let offset = 0
  const soiMarker = getHexString(buffer)(offset)(offset += 2)
  if (soiMarker !== 'ffd8') {
    throw new Error(`Unexpected SOI: ${soiMarker}`)
  }

  const marker = getHexString(buffer)(offset)(offset += 2)
  if (marker !== 'ffe1') { // not APP1
    throw new Error(`Unexpected marker: ${marker}`)
  }

  offset += 2

  const exifHeader = getAsciiString(buffer)(offset)(offset += 6)
  if (exifHeader !== 'Exif\0\0') {
    throw new Error(`Not Exif: "${exifHeader}"`)
  }

  const byteAlign = getAsciiString(buffer)(offset)(offset += 2)
  switch (byteAlign) {
    case 'II': {
      if (buffer[offset] !== 0x2a && buffer[offset + 1] != 0x00) {
        throw new Error(`Invalid file`)
      }
    }
    break
    case 'MM': {
      if (buffer[offset] !== 0x00 && buffer[offset + 1] != 0x2a) {
        throw new Error(`Invalid file`)
      }
    }
    break
    default:
      throw new Error(`Unexpected byte align: ${byteAlign}`)
  }
  offset += 6

  const queue = []
  const allDirectoryEntries = []

  let ifd = await getImageFileDirectory(byteAlign, fd, buffer, ifd0Start + 8)
  queue.push(ifd)
  while (queue.length > 0) {
    ifd = queue.pop()
    for (let i=0; i<ifd.directoryEntries.length; ++i) {
      const directoryEntry = ifd.directoryEntries[i]
      const tag = TAGS[directoryEntry.tagNumber]
      if (!tag) {
        continue;
      }
      allDirectoryEntries.push(directoryEntry)
      if (tag === 'EXIFOFFSET') {
        ifd = await getImageFileDirectory(byteAlign, fd, buffer, ifd0Start + directoryEntry.dataValue)
        queue.push(ifd)
      }
    }
  }

  return {
    ifd0Start,
    byteAlign,
    allDirectoryEntries,
  }
}

async function walkDirectoryEntries(path, callback) {
  try {
    const fd = await open(path, 'r')
    try {
      const { ifd0Start, byteAlign, allDirectoryEntries } = await getAllDirectoryEntries(fd)

      const buffer = Buffer.alloc(BUFFER_SIZE)

      for (let i=0; i<allDirectoryEntries.length; ++i) {
        const directoryEntry = allDirectoryEntries[i]

        const dataFormat = DATA_FORMATS[directoryEntry.dataFormatId]
        if (!dataFormat) {
          // TODO: Display warning
          continue
        }
        
        const totalBytes = dataFormat.size * directoryEntry.componentCount
        let dataBuffer
        if (totalBytes < 4) {
          dataBuffer = directoryEntry.dataValue
        } else {
          dataBuffer = buffer
          ret = await read(fd, dataBuffer, 0, totalBytes, ifd0Start + directoryEntry.dataValue)
          if (ret.bytesRead !== totalBytes) {
            // TODO: Display warning
            continue
          }
        }

        let val = null
        switch (dataFormat.name) {
          // TODO: Support other data types
          case 'ASCII_STRING': {
            val = getAsciiString(dataBuffer)(0)(totalBytes)
          }
          break;
          case 'UNSIGNED_SHORT': {
            val = readUInt16(byteAlign)(dataBuffer)(0)
          }
          break;
          case 'UNSIGNED_RATIONAL': {
            const val1 = readUInt32(byteAlign)(dataBuffer)(0)
            const val2 = readUInt32(byteAlign)(dataBuffer)(4)
            val = [val1, val2]
          }
          break;
          case 'SIGNED_RATIONAL': {
            const val1 = readInt32(byteAlign)(dataBuffer)(0)
            const val2 = readInt32(byteAlign)(dataBuffer)(4)
            val = [val1, val2]
          }
          break;
        }
        callback(directoryEntry, val)
      }
      
    } catch (err) {
      await close(fd)
      throw err
    }
  } catch (err) {
    console.error(err)
  }
}

module.exports = {
  walkDirectoryEntries
}
