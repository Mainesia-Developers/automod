# automod
Automoderation bot for Mainesia's Discord server.

## How to install on your machine
0. Install [Node.js](https://nodejs.org) and `pnpm`.

```sh
# installs pnpm
npm i -g pnpm
```

1. Clone the repository and switch into it.
2. Run the following command to build the bot.

```sh
pnpm run build
```

3. Now, run this command to set up the prefix, token, etc.:

```sh
pnpm run setup
```

4. To run the bot at any time, run:

```sh
# either use Node directly...
node index.js

# ...or the PNPM script!
pnpm run bot
```

If any of the scripts ran here return errors, report them in the [Issues tab](https://github.com/Mainesia-Developers/automod/issues).
