# Installation and local launch

1. Clone this repo
2. Launch the [mongo database](https://www.mongodb.com/) locally
3. Create `.env` with the environment variables listed below
4. Create `credentials.json` with your app credentials in google.
5. Run `yarn install` in the root folder
6. Run `yarn develop`

And you should be good to go! Feel free to fork and submit pull requests. Thanks!

# Environment variables

-   `TOKEN` — Telegram bot token.
-   `MONGO` — URL of the mongo database.
-   `GOOGLE` — URL of your google app oauth.

Also, please, consider looking at `.env.sample`.

# TODO

-   [Add](https://telegra.ph/So-your-bot-is-rate-limited-01-26) rate limits and queues to fix `429 Telegram error`
-   Switch to grammy-i18n
-   Make code execute concurrently with `cluster`s
-   Refactor all code

# License

MIT — use for any purpose. Would be great if you could leave a note about the original developers. Thanks!
