# obsidian-todotxt-codeblocks

## Description
A codeblock alternative to mvgrimes's [obsidian-todotxt-plugin](https://github.com/mvgrimes/obsidian-todotxt-plugin) based on the [Todo.txt specs](https://github.com/todotxt/todo.txt).

Add yours tasks to a `todotxt` codeblock to get started!

## Features
- [x] **Sorting** (listed in order of priority)
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
- [x] **Collapsible project groups**
- **Extensions**:
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
<a href="https://www.buymeacoffee.com/benjamonn" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Acknowledgements
Thanks to hieuthi's [joplin-plugin-metis](https://github.com/hieuthi/joplin-plugin-metis) for the inspiration.
