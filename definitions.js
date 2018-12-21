const TAGS = {
  0x010f: 'MAKE',
  0x0110: 'MODEL',
  0x0112: 'ORIENTATION',
  0x011a: 'XRESOLUTION',
  0x011b: 'YRESOLUTION',
  0x0128: 'RESOLUTIONUNIT',
  0x0131: 'SOFTWARE',
  0x0132: 'MODIFYDATE',
  0x0213: 'YCBCRPOSITIONING',
  0x8298: 'COPYRIGHT',
  0x8769: 'EXIFOFFSET',
  0x8827: 'ISO',
  0x8830: 'SENSITIVITYTYPE',
  0x9201: 'SHUTTERSPEEDVALUE',
  0x9202: 'APERTUREVALUE',
  0x920a: 'FOCALLENGTH',
  0xa433: 'LENSMAKE',
  0xa434: 'LENSMODEL',
  0xc4a5: 'PRINTIM',
}

const DATA_FORMATS = {
  1: {
    name: 'UNSIGNED_BYTE',
    size: 1
  },
  2: {
    name: 'ASCII_STRING',
    size: 1
  },
  3: {
    name: 'UNSIGNED_SHORT',
    size: 2
  },
  4: {
    name: 'UNSIGNED_LONG',
    size: 4
  },
  5: {
    name: 'UNSIGNED_RATIONAL',
    size: 8
  },
  6: {
    name: 'SIGNED_BYTE',
    size: 1
  },
  7: {
    name: 'UNDEFINED',
    size: 1
  },
  8: {
    name: 'SIGNED_SHORT',
    size: 2
  },
  9: {
    name: 'SIGNED_LONG',
    size: 4
  },
  10: {
    name: 'SIGNED_RATIONAL',
    size: 8
  },
  11: {
    name: 'SINGLE_FLOAT',
    size: 4
  },
  12: {
    name: 'DOUBLE_FLOAT',
    size: 8
  }
}

module.exports = {
  TAGS,
  DATA_FORMATS,
}