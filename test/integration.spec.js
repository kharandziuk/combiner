const { expect }  = require('chai')
const combiner = require('../index')
const stream  = require('stream');

it('combine streams', async () => {
  var streams = [
    combiner.from('1'),
    combiner.from('2'),
    combiner.from('3')
  ]

  const actual = await combiner.asPromise(combiner.sequence(streams))
  expect(actual).eql('123')
})

it('combine streams (classic)', async () => {
  var streams = [
    new stream.PassThrough(),
    new stream.PassThrough(),
    new stream.PassThrough(),
  ]

  streams[0].end('1')
  streams[1].end('2')
  streams[2].end('3')

  const actual = await combiner.asPromise(combiner.sequence(streams))
  expect(actual).eql('123')
})

it('throw immediate error', async () => {
  var streams = [
    new stream.Readable({
      read(size) {
        const err = new Error('immediate error!')
        process.nextTick(() => this.emit('error', err));
      }
    }),
    combiner.from('2'),
  ]

  try {
    await combiner.asPromise(combiner.sequence(streams))
    expect.fail()
  } catch (err) {
    expect(() => { throw err }).to.throw('immediate error!')
  }
})

it('stream from generator', async () => {
  var streams = [
    stream.Readable.from(async function * () {
      yield '1'
      throw new Error('immediate error!')
    }())
  ]

  try {
    await combiner.asPromise(combiner.sequence(streams))
    expect.fail()
  } catch (err) {
    expect(() => { throw err }).to.throw('immediate error!')
  }
})
