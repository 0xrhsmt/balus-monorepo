import { defineConfig } from '@wagmi/cli'
import { react, foundry } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'src/generated.ts',
  plugins: [
    foundry({
      project: '.',
      exclude: [
        'Common.sol/**',
        'Components.sol/**',
        'IMulticall3.sol/**',
        'Script.sol/**',
        'StdAssertions.sol/**',
        'StdError.sol/**',
        'StdCheats.sol/**',
        'StdInvariant.sol/**',
        'StdMath.sol/**',
        'StdJson.sol/**',
        'StdStorage.sol/**',
        'StdUtils.sol/**',
        'Vm.sol/**',
        'console.sol/**',
        'console2.sol/**',
        'test.sol/**',
        '**.s.sol/*.json',
        '**.t.sol/*.json',
      ],
      deployments: {
        LensBalus: {
          80001: '0x0bf7a14cda72376083f5820780a1bdac19b84848',
        },
        ILensHub: {
          80001: '0x60Ae865ee4C725cd04353b5AAb364553f56ceF82',
        },
      },
    }),
    react()
  ],
})
