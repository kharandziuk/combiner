const stream  = require('stream');
const { promisify } = require('util')

const _finished = promisify(stream.finished)
const isString = x => (typeof x === 'string' || x instanceof String)

const from = (lst) => {
  if (isString(lst)) {
    lst = lst.split('')
  }
  return new stream.Readable({
    read() {
      if (lst.length) {
        this.push(String(lst.shift()))
      } else {
        this.push(null)
      }
    }
  })
}

const asPromise = (readable) => {
    // TODO: rewrite with _finished
    // TODO: what if it s not an array?
    const result = []
    const w = new stream.Writable({
      write(chunk, encoding, callback) {
        result.push(chunk)
        callback()
      }
    })
    readable.pipe(w)
    return new Promise((resolve, reject) => {
      _finished(w).then(resolve).catch(reject)
      readable.on('error', (err) => {
        reject(err)
      })
    }).then(() => result.join(''))
}

const sequence = (streams) => {
  const collector = new stream.PassThrough()
  let isNext = Promise.resolve()
  for(const [i, curStream] of streams.entries()) {
    isNext = isNext.then(() => {
      curStream.pipe(collector, {end: i === streams.length -1})
      return _finished(curStream)
    }).catch((err) => {
      collector.emit('error', err)
    })
  }
  return collector
}

module.exports = { sequence, from, asPromise }
