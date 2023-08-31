# obsidian-todotxt-codeblocks

## Description
A codeblock alternative to mvgrimes's [obsidian-todotxt-plugin](https://github.com/mvgrimes/obsidian-todotxt-plugin) based on the [Todo.txt specs](https://github.com/todotxt/todo.txt).

Add yours tasks to a `todotxt` codeblock to get started!

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
  - default (ex. "sort:default")
    - equivalent to "sort:status sort:prio sort:completed sort:due sort:created"
- [x] Collapsible project groups
- [x] Edit, add, delete buttons in Live Preview
- [x] Autocompletion for projects and contexts
- [x] Render Markdown links
- [ ] Archive complete todos to file
- [ ] Configurable defaults

**Commands**
- [x] `Create new task in focused list`

**Extensions**
  - [x] `due:` (Due date)
  - [x] `rec:` (Recurrence frequency)

**Language line options**
  - [ ] `get:` Query for existing Todo.txt tasks and move to current codeblock
  - [ ] `link:` Link a *.todotxt file to the todotxt codeblock
  - [ ] `filter:`

## Extensions
  - date formats
    - \<YYYY-MM-DD> (ex. 1996-08-06)
    - \<MM-DD> (ex. 08-06)
    - \<n><[dateUnit]> (ex. 1w = 1 week from today)
      - calculates date n number of dateUnits away
      - dateUnits: d, w, m, y, b (business day)
      - if dateUnit is omitted, it defaults to **d**ays (ex. 0 = today)
    - \<dayOfWeek>
      - calculates date for first upcoming dayOfWeek
      - M, Tu, W, Th, F, Sa, Su
    - dateUnits and dayOfWeek can be combined (dayOfWeek can be at beginning or end)
      - 1w2d = 9 days (1 **w**eek + 2 **d**ays)
      - 1mM = first upcoming **M**onday in 1 **m**onths
      - Su5d = first upcoming **Su**nday in 5 **d**ays
    - if the `rec:` value is prefixed with a plus (ex. rec:+1w), the date is determined from the original due date rather than the completed date

## Donations
Feel free to support me if you enjoy the plugin!

<a href="https://www.buymeacoffee.com/benjamonn" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Acknowledgements
Thanks to hieuthi's [joplin-plugin-metis](https://github.com/hieuthi/joplin-plugin-metis) for the inspiration.
