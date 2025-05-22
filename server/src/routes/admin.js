module.exports = {
  type: 'admin',
  routes: [
    {
      method: 'POST',
      path: '/content-type-generator',
      handler: 'controller.contentTypeGenerator',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/hugo-file-generator',
      handler: 'controller.hugoFileGenerator',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/sync-to-github',
      handler: 'controller.syncToGithub',
      config: { policies: [] },
    },
  ],
};