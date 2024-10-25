export default defineNuxtConfig({
  modules: [
    '../../../src/module',
  ],

  imports: {
    autoImport: true,
  },

  feathers: {
    server: {
      plugins: [
        '../plugins/dummy-messages.ts',
      ],
    },
    servicesDirs: [
      '../../../services/messages',
    ],
    client: {
      plugins: './client2.ts',
    },
  },
})
