import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'
import {exec} from '@actions/exec'
import {MODULE_DIR, SWIFTORG_ORIGIN, SWIFTORG_METADATA} from './const'

export const SWIFTORG = 'swiftorg'

export class Swiftorg {
  constructor(readonly checkLatest: boolean | string) {
    if (typeof checkLatest === 'string') {
      try {
        const checkLatestBool = JSON.parse(checkLatest)
        if (typeof checkLatestBool === 'boolean') {
          this.checkLatest = checkLatestBool
          return
        }
      } catch (error) {
        core.debug(`Parsing 'check-latest' failed with error: "${error}"`)
      }
    }
    if (checkLatest) {
      this.checkLatest = checkLatest
    } else {
      this.checkLatest = false
    }
  }

  private async swiftorgMetadata(): Promise<{commit?: string}> {
    if (process.env.SETUPSWIFT_SWIFTORG_METADATA) {
      const metadata = JSON.parse(process.env.SETUPSWIFT_SWIFTORG_METADATA)
      if (metadata.commit) {
        return metadata
      }
    }
    const rawData = fs.readFileSync(SWIFTORG_METADATA, 'utf8')
    const parsedData = JSON.parse(rawData)
    core.debug(`Read swift.org metadata: "${rawData}"`)
    return parsedData
  }

  async update() {
    let ref: string
    if (typeof this.checkLatest === 'boolean' && this.checkLatest) {
      ref = 'HEAD'
    } else if (typeof this.checkLatest === 'string') {
      ref = this.checkLatest
    } else {
      const swiftorgMetadata = await this.swiftorgMetadata()
      ref = swiftorgMetadata.commit ?? 'HEAD'
    }

    const swiftorg = path.join(MODULE_DIR, SWIFTORG)
    const origin = SWIFTORG_ORIGIN
    core.debug(`Adding submodule at "${swiftorg}" directory`)
    const cwd = {cwd: swiftorg}
    await exec('git', ['init', swiftorg])
    await exec('git', ['fetch', origin, ref, '--depth=1', '--no-tags'], cwd)
    await exec('git', ['checkout', 'FETCH_HEAD', '--detach'], cwd)
  }
}
