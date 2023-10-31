![Page Screenshot](./screenshot.png)
![Page Screenshot (dark mode)](./screenshot-dark.png)

# Start page

* Swaps to dark mode based on time of day, but overridden by media preference
* Fetches a random Russian word every 24 hours from OpenAI
* Fetches weather information
* `LocalStorage` based link-pinning

## Open API Key

The random word widget only works with an Open AI key!

1. Create `./assets/open-api-key.json`
2. Copy the following into it: `{"key":"YOURKEY"}`
3. Replace `YOURKEY` with your actual Open AI key
