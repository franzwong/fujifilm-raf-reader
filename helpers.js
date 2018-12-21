const getString = encoding => buffer => offset => length => buffer.toString(encoding, offset, length)
const getAsciiString = getString('ascii')
const getHexString = getString('hex')

const readUInt32 = byteAlign => buffer => offset => byteAlign == 'II'
  ? buffer.readUInt32LE(offset)
  : buffer.readUInt32BE(offset)

const readUInt16 = byteAlign => buffer => offset => byteAlign == 'II'
  ? buffer.readUInt16LE(offset)
  : buffer.readUInt16BE(offset)

  const readInt32 = byteAlign => buffer => offset => byteAlign == 'II'
  ? buffer.readInt32LE(offset)
  : buffer.readInt32BE(offset)

  module.exports = {
    getString,
    getAsciiString,
    getHexString,
    readUInt32,
    readUInt16,
    readInt32,
  }
