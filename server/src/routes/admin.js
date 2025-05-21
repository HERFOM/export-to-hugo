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
      path: '/update-website-files',
      handler: 'controller.updateWebsiteFiles',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/sync-to-server',
      handler: 'controller.syncToServer',
      config: { policies: [] },
    },
  ],
};