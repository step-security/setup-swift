import * as core from '@actions/core'
import * as fs from 'fs'
import {ToolchainVersion, SWIFT_BRANCH_REGEX} from './version'
import {Swiftorg} from './swiftorg'
import {SdkSnapshot, ToolchainSnapshot} from './snapshot'
import {Platform} from './platform'
import {
  INPUT_SWIFT_VERSION,
  INPUT_CHECK_LATEST,
  INPUT_DEVELOPMENT,
  INPUT_DRY_RUN,
  INPUT_SDKS,
  OUTPUT_SWIFT_VERSION,
  OUTPUT_TOOLCHAIN,
  OUTPUT_SDKS
} from './const'

import axios, {isAxiosError} from 'axios'

async function validateSubscription() {
  const eventPath = process.env.GITHUB_EVENT_PATH
  let repoPrivate: boolean | undefined

  if (eventPath && fs.existsSync(eventPath)) {
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'))
    repoPrivate = eventData?.repository?.private
  }

  const upstream = 'SwiftyLab/setup-swift'
  const action = process.env.GITHUB_ACTION_REPOSITORY
  const docsUrl =
    'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions'

  core.info('')
  core.info('\u001b[1;36mStepSecurity Maintained Action\u001b[0m')
  core.info(`Secure drop-in replacement for ${upstream}`)
  if (repoPrivate === false)
    core.info('\u001b[32m\u2713 Free for public repositories\u001b[0m')
  core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`)
  core.info('')

  if (repoPrivate === false) return

  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
  const body: Record<string, string> = {action: action || ''}
  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body,
      {timeout: 3000}
    )
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error(
        `\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m`
      )
      core.error(
        `\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`
      )
      process.exit(1)
    }
    core.info('Timeout or API not reachable. Continuing to next step.')
  }
}

export async function run() {
  try {
    await validateSubscription()
    const requestedVersion = core.getInput(INPUT_SWIFT_VERSION) ?? 'latest'
    const development = core.getBooleanInput(INPUT_DEVELOPMENT)
    const sdksStr = core.getInput(INPUT_SDKS)
    const sdks = sdksStr ? sdksStr.split(';') : []
    const version = ToolchainVersion.create(requestedVersion, development, sdks)

    if (version.requiresSwiftOrg) {
      core.startGroup('Syncing swift.org data')
      const checkLatest = core.getInput(INPUT_CHECK_LATEST)
      const submodule = new Swiftorg(checkLatest)
      await submodule.update()
      core.endGroup()
    }

    const dryRun = core.getBooleanInput(INPUT_DRY_RUN)
    let snapshot: ToolchainSnapshot
    let sdkSnapshots: SdkSnapshot[]
    let installedVersion: string
    if (dryRun) {
      const toolchain = await Platform.toolchain(version)
      if (toolchain) {
        snapshot = toolchain
      } else {
        throw new Error(`No Swift toolchain found for ${version}`)
      }
      const match = SWIFT_BRANCH_REGEX.exec(toolchain.branch)
      if (match && match.length > 1) {
        installedVersion = match[1]
      } else {
        installedVersion = requestedVersion
      }
      sdkSnapshots = (await version.sdkSnapshots(toolchain)).map(snapshot => {
        if (snapshot[0] == undefined) {
          throw new Error(`Unable to find SDK for ${snapshot[1]}`)
        }
        return snapshot[0]
      })
    } else {
      const {installer, sdkInstallers} = await Platform.install(version)
      snapshot = installer.data
      sdkSnapshots = sdkInstallers.map(installer => installer.data)
      installedVersion = await installer.installedSwiftVersion()
    }

    core.setOutput(OUTPUT_SWIFT_VERSION, installedVersion)
    core.setOutput(OUTPUT_TOOLCHAIN, JSON.stringify(snapshot))
    core.setOutput(OUTPUT_SDKS, JSON.stringify(sdkSnapshots))
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

if (process.env.VITEST === undefined) {
  run()
}
