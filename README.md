## First time developing plugins?

Quick starting guide for new plugin devs:

- Check if [someone already developed a plugin for what you want](https://obsidian.md/plugins)! There might be an existing plugin similar enough that you can partner up with.
- Make a copy of this repo as a template with the "Use this template" button (login to GitHub if you don't see it).
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/your-plugin-name` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.
- Enable plugin in settings window.
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check https://github.com/obsidianmd/obsidian-releases/blob/master/plugin-review.md
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

# obsidian-todotxt-codeblocks

## Description
A codeblock alternative to mvgrimes's [obsidian-todotxt-plugin](https://github.com/mvgrimes/obsidian-todotxt-plugin) based on the [Todo.txt specs](https://github.com/todotxt/todo.txt).

Add yours tasks to a `todotxt` codeblock to get started!

## Features
- [x] sorting (listed in order of priority)
  - string[]
    - `proj` (project)
      - ex. "sort:proj:a,b,c"
    - `ctx` (context)
      - "n/c" = no context
      - ex. "sort:ctx:bug,feature,n/c,nice-to-have"
  - desc/asc (defaults to asc)
    - `status`
    - `prio` (priority)
    - `completed` (completed date)
    - `due` (due date extension)
    - `created` (created date)
  - default (ex. "sort:default")
    - equivalent to "sort:status sort:prio sort:completed sort:due sort:created"
- [x] Collapsible project groups
- Reserved extensions:
  - items cannot have duplicate key/value pairs for a reserved extension
  - [x] `due:` (Due date) / `rec:` (Recurrence frequency)
    - \<YYYY-MM-DD> (ex. 1996-08-06)
    - \<MM-DD> (ex. 08-06)
    - \<number><[dateUnit]> (ex. 1d)
      - dateUnits: d, w, m, y
      - if only number is provided, unit is days (ex. 0 = today)
    - \<dayOfWeek>
      - M, Tu, W, Th, F, Sa, Su
    - dateUnits and dayOfWeek can be combined (dayOfWeek can be at beginning or end)
      - 1w2d = 9 days (1 week + 2 days)
      - 2mM = first upcoming Monday in 2 months
      - M2m = first upcoming Monday in 2 months
- [x] Edit, add, delete in Live Preview
- [ ] "get:" Query for existing Todo.txt tasks and move to current codeblock
- [ ] Archive complete todos to file
- [ ] Daily note rollover integration

## Donations
Feel free to support me if you enjoy the plugin!
https://www.buymeacoffee.com/benjamonn

## 