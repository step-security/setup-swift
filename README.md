[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)

# Setup Swift

[![Supports macOS, Linux & Windows](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?label=platform)](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/virtual-environments-for-github-hosted-runners#supported-runners-and-hardware-resources)
[![CI/CD](https://github.com/step-security/setup-swift/actions/workflows/main.yml/badge.svg)](https://github.com/step-security/setup-swift/actions/workflows/main.yml)


[GitHub Action](https://github.com/features/actions) that will setup [Swift](https://swift.org) environment with specified version.
This action supports the following functionalities:

- Works on Linux, macOS and Windows across all architectures.
- Supports [installing latest major/minor/patch](#specifying-version).
- Supports installing official Swift SDKs from cross platform developments.
- Provides snapshots as soon as published in `swift.org`.
- Verifies toolchain snapshots before installation (`gpg` for Linux and Windows, `pkgutil` for macOS) .
- Allows development snapshots by enabling `development` flag and optional version.
- Prefers existing Xcode installations.
- Caches installed setup in tool cache and actions cache(Swift 5.10 and after does not support caching on Windows).
- Allows fetching snapshot metadata without installation (can be used to setup docker images).

## Latest supported toolchains

| Release Type | Latest Available |
|--------------|------------------|
| Stable | [![Latest Release](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%step-security.github.io%2Fsetup-swift%2Fmetadata.json&query=%24.release.name&logo=swift&logoColor=white&label=Swift&color=orange)](https://www.swift.org/download/#releases)<br/>[![Latest Release Tag](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%step-security.github.io%2Fsetup-swift%2Fmetadata.json&query=%24.release.tag&logo=swift&logoColor=white&label=tag&color=orange)](https://www.swift.org/download/#releases) |
| Development | [![Latest Development Snapshot](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fswiftylab.github.io%2Fsetup-swift%2Fmetadata.json&query=%24.dev.name&logo=swift&logoColor=white&label=Swift&color=orange)](https://www.swift.org/download/#snapshots)<br/>[![Latest Development Snapshot Tag](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%step-security.github.io%2Fsetup-swift%2Fmetadata.json&query=%24.dev.tag&logo=swift&logoColor=white&label=tag&color=orange)](https://www.swift.org/download/#snapshots)<br/>[![Latest Development Snapshot Date](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%step-security.github.io%2Fsetup-swift%2Fmetadata.json&query=%24.dev.date&logo=swift&logoColor=white&label=date)](https://www.swift.org/download/#snapshots) |
| Trunk Development | [![Latest Trunk Development Snapshot Tag](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%step-security.github.io%2Fsetup-swift%2Fmetadata.json&query=%24.snapshot.tag&logo=swift&logoColor=white&label=tag&color=orange)](https://www.swift.org/download/#snapshots)<br/>[![Latest Trunk Development Snapshot Date](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%step-security.github.io%2Fsetup-swift%2Fmetadata.json&query=%24.snapshot.date&logo=swift&logoColor=white&label=date)](https://www.swift.org/download/#snapshots) |

## Usage

To run the action with the latest stable release swift version available, simply add the action as a step in your workflow:

```yml
- uses: step-security/setup-swift@v1
```

Or use the latest development snapshots by enabling the `development` flag:

```yml
- uses: step-security/setup-swift@v1
  with:
    development: true
```

Install additional SDKs as part of toolchain setup, i.e. install static Linux SDK:

```yml
- uses: step-security/setup-swift@v1
  with:
    sdks: static-linux;wasm
```

After the environment is configured you can run swift and xcode commands using the standard [`run`](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/workflow-syntax-for-github-actions#jobsjob_idstepsrun) step:

```yml
- uses: step-security/setup-swift@v1
- name: Get swift version
  run: swift --version
- name: Get swift version in macOS
  if: runner.os == 'macOS'
  run: xcrun --toolchain ${{ env.TOOLCHAINS }} swift --version
```

A specific Swift version can be set using the `swift-version` input, [see the format](#specifying-version):

```yml
- uses: step-security/setup-swift@v1
  with:
    swift-version: "5.1.0"
- name: Get swift version
  run: swift --version # Swift 5.1.0
- name: Get swift version in macOS
  if: runner.os == 'macOS'
  run: xcrun --toolchain ${{ env.TOOLCHAINS }} swift --version # Swift 5.1.0
```

Works perfect together with job matrixes:

```yml
name: Swift ${{ matrix.swift }} on ${{ matrix.os }}
runs-on: ${{ matrix.os }}
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
    swift: ["5.4.3", "5.2.4"]
steps:
- uses: step-security/setup-swift@v1
  with:
    swift-version: ${{ matrix.swift }}
- name: Get swift version
  run: swift --version
```

**See [action.yml](action.yml) for complete list of inputs and outputs, see [wiki](https://github.com/step-security/setup-swift/wiki) for inner workings of this action.**

## Specifying version

This project uses strict semantic versioning to determine what version of Swift to configure. This differs slightly from the official convention used by Swift.

For example, Swift is available as version `5.1` but using this as value for `swift-version` will be interpreted as a version _range_ of `5.1.X` where `X` is the latest patch version available for that major and minor version.

In other words specifying...

- `"5.1"` will resolve to latest patch version (aka `5.1.5`)
- `"5.1.0"` will resolve to version `5.1`
- `"4"` will resolve to latest minor and patch version (aka `4.2.4`)
- `"4.0.0"` will resolve to version `4.0`

<details>
  <summary>Additionally, to use custom toolchains, download URL can be provided. The download URL must point to a `tar` archive for `Linux`, `pkg` file for `macOS` and `exe` file for `Windows`.</summary>

  i.e. for `macOS`: https://github.com/swiftwasm/swift/releases/download/swift-wasm-5.10-SNAPSHOT-2024-03-30-a/swift-wasm-5.10-SNAPSHOT-2024-03-30-a-macos_x86_64.pkg
  for `Linux`: https://github.com/swiftwasm/swift/releases/download/swift-wasm-5.10-SNAPSHOT-2024-03-30-a/swift-wasm-5.10-SNAPSHOT-2024-03-30-a-ubuntu22.04_x86_64.tar.gz

  > [!IMPORTANT]
  > When using custom toolchains, please ensure that the toolchain can be installed and used on the GitHub runner, this action won't be able to validate this for custom toolchains.
</details>

### Caveats

YAML interprets eg. `4.0` as a float, this action will then interpret that as `4` which will result in eg. Swift `4.2.4` being resolved. Quote your inputs! Thus surround version input with quotations:

```yml
- uses: step-security/setup-swift@v1
  with:
    swift-version: '5.0'
```

Not:

```yml
- uses: step-security/setup-swift@v1
  with:
    swift-version: 5.0
```

## License

`setup-swift` is released under the MIT license. [See LICENSE](LICENSE) for details.
The Swift logo is a trademark of Apple Inc.
