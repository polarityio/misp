module.exports = {
  name: 'MISP',
  acronym: 'MISP',
  logging: { level: 'info' },
  description: 'Malware Information and Sharing Platform (MISP) threat intelligence platform',
  entityTypes: ['domain', 'IPv4', 'IPv6', 'MD5', 'SHA1', 'SHA256', 'email', 'url'],
  styles: ['./styles/misp.less'],
  defaultColor: 'dark-purple',
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
    proxy: ''
  },
  options: [
    {
      key: 'uri',
      name: 'MISP URL',
      description: 'URL of your MISP instance to include the schema (i.e., https://) and port if applicable',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'apiKey',
      name: 'Authentication Key',
      description: 'Your MISP API key',
      default: '',
      type: 'password',
      userCanEdit: false,
      adminOnly: true
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
    },
    {
      key: 'blocklist',
      name: 'Ignored Entities',
      description: 'List of domains and IPs that you never want to send to misp',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'domainBlocklistRegex',
      name: 'Ignored Domain Regex',
      description: 'Domains that match the given regex will not be looked up.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'ipBlocklistRegex',
      name: 'Ignored IP Regex',
      description: 'IPs that match the given regex will not be looked up.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    }
  ]
};
