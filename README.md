# Polarity MISP Integration

The Polarity MISP integration allows Polarity to search your instance of MISP to return valid information about domains, IPs, and hashes.  The integration also allows you to add and remove tags from events.

![d0d670e2-ba81-4ce8-b135-bbe47f1ef31e](https://user-images.githubusercontent.com/306319/52191578-6aa1f780-2813-11e9-91ae-fa181bfe99ee.GIF)


## MISP Integration Options

### MISP URL

URL of your MISP instance to include the schema (i.e., https://) and port if applicable

```
https://my-misp-server.internal
```

### API Key

The authentication of the automation is performed via a secure key available in the MISP UI interface. Make sure you keep that key secret as it gives access to the entire database! The API key is available in the event actions menu under automation

### Enable Adding Tags

If checked, users can add tags to an event from the Overlay Window

> Note that we recommend setting this option as an admin only option so the value is consistent across all your users.

### Enable Removing Tags

If checked, users can remove tags from an event from the Overlay Window

> Note that we recommend setting this option as an admin only option so the value is consistent across all your users.


### Ignored Entities

List of domains and IPs that you never want to send to misp

### Ignored Domain Regex
Domains that match the given regex will not be looked up.

### Ignored IP Regex

IPs that match the given regex will not be looked up.


## Installation Instructions

Installation instructions for integrations are provided on the [PolarityIO GitHub Page](https://polarityio.github.io/).

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making.  For more information about the Polarity platform please see:

https://polarity.io/
