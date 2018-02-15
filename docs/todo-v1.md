# To Implement from Socka v1

## Bugs

- Rapid fire --> Leak memory?
+ Player 1 is 2 in Opera (who uses Opera anyway) (not me anymore ^^) --> Did not reproduce
+ Bug with backspace in chrome --> Fixed

## Features

- In-game engine Notification (to display errors, info in a friendly way a.k.a. not in the console)
- Static site generator for the file listing
+ Configure the endpoints (at least the URL for the HTTP endpoint, maybe also password)
- Faster way to scroll in the song list in a pack (letter?, 10 by 10?)
- Revise song caching strategy? (option, cache only banner + options?)
  - use indexDB for caching? (see https://developer.mozilla.org/fr/docs/Web/API/API_IndexedDB)
+ Graphic Options: Aspect Ratio
- Rename Theme GC (Check that interface for each)
+ Restart Song

## Theme

+ Main Menu
+ Options Menus
  * Display
  * Gameplay
  * Players
  * Mapping
+ Pack Choice Menu
+ Song Choice Menu
- Loading
+ Pause
- Engine
- Result
- Credit

## Build

+ Configure possibility for production build
+ Add Source Map for debug (cheap-eval-source-map probably)

### Assets Status:

- Arrows: Socka
- Font: https://www.dafont.com/fr/clemente-pd.font (to convert to the weird format yay /o\)
- Explosion: Stepmania
- Hold: Socka
- HoldJudgment: Stepmania
- Judgmet: Stepmania
- Lifemeter Middle: Stepmania
- Lifemeter Over: Stepmania
- Lifemeter Under: Stepmania
- Mine: Stepmania
- ProgressBarMiddle: Stepmania
- ProgressBarUnder: Stepmania
- Receptor: Socka
- ReceptorFlash: Socka
- ReceptorGLow: Socka
- Roll: Socka
- Logo: Socka

## Misc

- Contact Stepmania people
- Preset for dancepad ?
   * Compare the mapping between the two kinds of pad we have
   * Add as secondary for player 1
- Readme File for the repo
- Migrate to Github (remove wrong email from commit)
- Font License

## Packaging

- Test easy installation with 3 free songs
- public demo
- Installation documentation


## Post V1

- Package client with Electron (Filesystem endpoint)
- Different difficulties for the 2 players
- Better Handling of players:
    * Store profile (map(name, player))
    * Options (set player 1, set player 2)
- Better handling of options
    * Less separation between option objects and the value stored
    * Better serialization (support for Symbols)
    * Better Handling for different default for the different players
- Dedicated Hooks for the input configuration for the views
