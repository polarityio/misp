module.exports = {
  name: 'MISP',
  acronym: 'MISP',
  logging: { level: 'info' },
  description: 'Malware Information and Sharing Platform (MISP) threat intelligence platform',
  entityTypes: ['domain', 'IPv4', 'IPv6', 'hash'],
  styles: ['./styles/misp.less'],
  block: {
    component: {
      file: './components/misp.js'
    },
    template: {
      file: './templates/misp.hbs'
    }
  },
  request: {
    // Provide the path to your certFile. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    cert: '',
    // Provide the path to your private key. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    key: '',
    // Provide the key passphrase if required.  Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    passphrase: '',
    // Provide the Certificate Authority. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    ca: '',
    // An HTTP proxy to be used. Supports proxy Auth with Basic Auth, identical to support for
    // the url parameter (by embedding the auth info in the uri)
    proxy: '',
    /**
     * If set to false, the integration will ignore SSL errors.  This will allow the integration to connect
     * to the MISP servers without valid SSL certificates.  Please note that we do NOT recommending setting this
     * to false in a production environment.
     */
    rejectUnauthorized: true
  },
  options: [
    {
      key: 'uri',
      name: 'MISP URL',
      description: 'URL of your MISP instance to include the schema (i.e., https://) and port if applicable',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'apiKey',
      name: 'Authentication Key',
      description: 'Your MISP API key',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'enableAddingTags',
      name: 'Enable Adding Tags',
      description: 'If checked, users can add tags to an event from the Overlay Window',
      default: true,
      type: 'boolean',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'enableRemovingTags',
      name: 'Enable Removing Tags',
      description: 'If checked, users can remove tags from an event from the Overlay Window',
      default: true,
      type: 'boolean',
      userCanEdit: false,
      adminOnly: true
    }
    // {
    //   key: 'tagWhiteList',
    //   name: 'Tag White List',
    //   description:
    //     'Comma delimited list of tags to use as an `OR` search filter.  Only events with the listed tags will be included.  Leave blank for no white list.',
    //   default: '',
    //   type: 'text',
    //   userCanEdit: true,
    //   adminOnly: false
    // },
    // {
    //   key: 'tagBlackList',
    //   name: 'Tag Black List',
    //   description:
    //     'Comma delimited list of tags to not include in return results. Events with the listed tags will not be included in search results.  Leave blank for no black list.',
    //   default: '',
    //   type: 'text',
    //   userCanEdit: true,
    //   adminOnly: false
    // }
  ]
};
