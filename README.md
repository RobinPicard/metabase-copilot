# Metabase Copilot

## Introduction

Metabase Copilot is a Google Chrome extension allowing users to benefit from generative AI within Metabase.

## Features

Metabase Copilot has 3 main features:
- query prompt: allows the user to enter a prompt for a SQL query creation/edition
- database error explanation: asks chatGPT to give the most likely explanation for the error considering the query that was run and the error returned
- database error fix: asks chatGPT to modify the user's query to fix the error

## Installation and Use

Download the extension in the Chrome webstore: https://chrome.google.com/webstore/detail/metabase-chatgpt/kkkpnhdoamjghmnjpailmpndjlegkmnh

Click on the extension's icon on top of your browser's window (on the right of the url bar). Then it will open the extension's popup in which you'll be presented with the settings. There, you will be asked to choose an LLM provider and a model, and to enter an API key for the provider you selected.

After you've provided an API key, the database schema extraction will be automatically run when you first open the native query editor of Metabase. Once this is done, you'll be able to use the extension.

## Development

After having cloned the repository, you'll need to package it before being able to load it as an unpacked extension in Chrome. This step is necessary as the extension relies on webpack and the manifest.json points toward files located in the dist/ folder (ignored by git).

Start by installing the dependencies by running `npm install`
Then, you create the distribution with `npm run build`

This latest step will create the dist/ folder with the files that will be executed in Chrome. When uploading the extension to Chrome in development mode, just select the whole repo.

The organization of the files is the following:
- `background.ts` runs continuously and is in charge of injecting content.js when a page whose url follows the pattern of a Metabase question page
- `content.ts` is the main file that interacts with Metabase's pages
- `popup.html` is the settings popup of the extension in which the user can enter their api key
- `options.html` is the options page of the extension (only applies for the logged-in mode)

## Contribution

Contributions are very much welcome! To contribute:
1. Fork the repository
2. Create a new branch with a descriptive name
3. Make your changes and commit them with a meaningful commit message
4. Submit a pull request and provide a clear description of your changes
