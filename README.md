# Builder.io Eva Commerce Plugin

Easily connect your Eva commerce data to your Builder.io content!

## Installation

Go to [builder.io/account/organization](https://builder.io/account/organization) and add the plugin from the plugin settings (`@builder.io/plugin-eva`)

## Configuration

The plugin requires the following configuration:

1. **API Key**: Your Eva API key for authentication
2. **Organization Unit Set ID**: Your Eva Organization Unit Set ID
3. **Environment** (optional): Choose between 'development', 'staging', or 'production' (defaults to 'production')

## Features

This plugin provides the following field types for use in Builder.io:

- `Eva Product`: Search and select products from your Eva catalog
- Custom targeting by product ID or handle

### Custom Targeting

To target content by Eva products, you'll need to set the target attributes on the host site by setting the `userAttributes`:

```ts
builder.setUserAttributes({
  product: currentProduct.id,
});
```

Or by passing it as a query param to the [content API](https://www.builder.io/c/docs/query-api#:~:text=userAttributes) call.

## Development

### Install

```bash
git clone https://github.com/BuilderIO/builder.git
cd plugins/eva
npm install
```

### Run

```bash
npm start
```

### Add the plugin in Builder.io

Go to [builder.io/account/organization](https://builder.io/account/organization) and add the localhost URL to the plugin from the plugin settings (`http://localhost:1268/plugin.system.js?pluginId=@builder.io/plugin-eva`)

**NOTE:** Loading http:// content on an https:// website will give you a warning. Be sure to click the shield in the top right of your browser and choose "load unsafe scripts" to allow the http content on Builder's https site when developing locally.

### Frameworks

Builder.io uses [React](https://github.com/facebook/react) and [Material UI](https://github.com/mui-org/material-ui) for the UI, and [Emotion](https://github.com/emotion-js/emotion) for styling. 