import * as path from 'path'
import * as fs from 'fs'
import * as exec from '@actions/exec'
import {Swiftorg, SWIFTORG} from '../src/swiftorg'
import {MODULE_DIR, SWIFTORG_ORIGIN, SWIFTORG_METADATA} from '../src/const'

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn()
}))

const readFileSyncMock = fs.readFileSync as jest.Mock

describe('swiftorg sync validation', () => {
  const env = process.env
  const execSpy = jest.spyOn(exec, 'exec')

  beforeEach(() => {
    process.env = {...env}
    readFileSyncMock.mockReset()
  })

  afterEach(() => {
    process.env = env
  })

  it('tests latest sync', async () => {
    execSpy.mockResolvedValue(0)
    const swiftorg = new Swiftorg(true)
    await swiftorg.update()
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, 'HEAD', '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests latest sync with string value', async () => {
    execSpy.mockResolvedValue(0)
    const swiftorg = new Swiftorg('true')
    await swiftorg.update()
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, 'HEAD', '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests latest commit sync', async () => {
    execSpy.mockResolvedValue(0)
    const commit = '74caef941bc8ed6a01b9572ab6149e1d1f8a2d69'
    const swiftorg = new Swiftorg(commit)
    await swiftorg.update()
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, commit, '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests without latest sync', async () => {
    execSpy.mockResolvedValue(0)
    const commit = '74caef941bc8ed6a01b9572ab6149e1d1f8a2d69'
    process.env.SETUPSWIFT_SWIFTORG_METADATA = `{"commit": "${commit}"}`
    const swiftorg = new Swiftorg(false)
    await swiftorg.update()
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, commit, '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests without latest sync with string value', async () => {
    execSpy.mockResolvedValue(0)
    const commit = '74caef941bc8ed6a01b9572ab6149e1d1f8a2d69'
    process.env.SETUPSWIFT_SWIFTORG_METADATA = `{"commit": "${commit}"}`
    const swiftorg = new Swiftorg('false')
    await swiftorg.update()
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, commit, '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests without latest sync with empty string value', async () => {
    execSpy.mockResolvedValue(0)
    const commit = '74caef941bc8ed6a01b9572ab6149e1d1f8a2d69'
    process.env.SETUPSWIFT_SWIFTORG_METADATA = `{"commit": "${commit}"}`
    const swiftorg = new Swiftorg('')
    await swiftorg.update()
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, commit, '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests without latest sync success with metadata file read', async () => {
    execSpy.mockResolvedValue(0)
    process.env.SETUPSWIFT_SWIFTORG_METADATA = undefined
    const commit = '74caef941bc8ed6a01b9572ab6149e1d1f8a2d69'
    readFileSyncMock.mockReturnValue(JSON.stringify({commit}))
    const swiftorg = new Swiftorg(false)
    await swiftorg.update()
    expect(readFileSyncMock).toHaveBeenCalledWith(SWIFTORG_METADATA, 'utf8')
    expect(execSpy).toHaveBeenCalledTimes(3)
    expect(execSpy.mock.calls[1]).toStrictEqual([
      'git',
      ['fetch', SWIFTORG_ORIGIN, commit, '--depth=1', '--no-tags'],
      {cwd: path.join(MODULE_DIR, SWIFTORG)}
    ])
  })

  it('tests without latest sync failure with metadata file read failure', async () => {
    execSpy.mockResolvedValue(0)
    process.env.SETUPSWIFT_SWIFTORG_METADATA = undefined
    readFileSyncMock.mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory')
    })
    const swiftorg = new Swiftorg(false)
    await expect(swiftorg.update()).rejects.toMatchObject(
      new Error('ENOENT: no such file or directory')
    )
    expect(execSpy).toHaveBeenCalledTimes(0)
  })

  it('tests without latest sync failure with invalid metadata content', async () => {
    execSpy.mockResolvedValue(0)
    process.env.SETUPSWIFT_SWIFTORG_METADATA = undefined
    readFileSyncMock.mockReturnValue('invalid json')
    const swiftorg = new Swiftorg(false)
    await expect(swiftorg.update()).rejects.toBeInstanceOf(SyntaxError)
    expect(execSpy).toHaveBeenCalledTimes(0)
  })
})
