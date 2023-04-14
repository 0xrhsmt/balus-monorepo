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

    }),
    react()
  ],
})
