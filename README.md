# obsidian-todotxt-codeblocks

## Description
A codeblock alternative to mvgrimes's [obsidian-todotxt-plugin](https://github.com/mvgrimes/obsidian-todotxt-plugin) based on the [Todo.txt specs](https://github.com/todotxt/todo.txt).

Add your tasks to a `todotxt` codeblock to get started!

Link your codeblock to an existing *.txt file to synchronize changes.

<img src="assets/demo.gif" />

## Features
- [x] **Sorting** (listed in order of priority)
  - string[]
    - `proj` (project)
      - ex. "sort:proj:Home,Work"
    - `ctx` (context)
      - "n/c" = no context
      - ex. "sort:ctx:bug,feature,n/c,nice-to-have"
  - desc/asc (defaults to asc)
    - `status`
    - `prio` (priority)
    - `completed` (completed date)
    - `due` (due date extension)
    - `created` (created date)
    - ex. "sort:status sort:created:desc"
  - `default` (ex. "sort:default")
- **Live Preview**
  - [x] Collapsible project groups
  - [x] Edit, add, delete buttons
  - [x] Render Markdown links
- [x] **Autocompletion** for projects and contexts
- [x] **Archive** completed tasks to `archive.txt` file
  - [x] **Auto-archive** setting
- [x] Configurable defaults

**Commands**
- [x] `Create new task in focused list`
- [x] `New codeblock at cursor`

**Extensions**
  - [x] `due:` (Due date)
  - [x] `rec:` (Recurrence frequency)

**Language line options** (not yet implemented)
  - [ ] `get:` Query for existing Todo.txt tasks and move to current codeblock
  - [x] `src:` Link a *.txt file to the todotxt codeblock
  - [ ] `filter:`

## Extensions
  - date formats
    - \<YYYY-MM-DD> (ex. 1996-08-06)
    - \<MM-DD> (ex. 08-06)
    - \<n><[dateUnit]> (ex. 1w = 1 week from today)
      - calculates date n number of dateUnits away
      - dateUnits: d, w, m, y, b (business day)
      - if only a number is provided, it will calculate **d**ays (ex. 0 = today, 1 = tomorrow, 7 = next week)
    - \<dayOfWeek> (ex. M = next Monday)
      - calculates date for first upcoming dayOfWeek
      - M, Tu, W, Th, F, Sa, Su
    - dayOfWeek and dateUnits (except b) can be combined (dayOfWeek must come first)
      - 1w2d = 9 days (1 **w**eek + 2 **d**ays)
      - Su5d = first upcoming **Su**nday in 5 **d**ays
    - if the `rec:` value is prefixed with a plus (ex. rec:+1w), the date is determined from the original due date rather than the completed date

## Donations
Feel free to support me if you enjoy the plugin!

<a href="https://www.buymeacoffee.com/benjamonn" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Acknowledgements
Thanks to hieuthi's [joplin-plugin-metis](https://github.com/hieuthi/joplin-plugin-metis) for the inspiration.
