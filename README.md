# heist-game-01

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/emmanuel-agbede/heist-game-01/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/emmanuel-agbede/heist-game-01/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Gilded Vault** — a top-down heist game about robbing the Meridian Museum in one night. Cross three floors — the Gallery, the Vault Hall, the Strongroom — past guards with sweeping vision cones and cameras that sweep the halls, lift each floor's jewel (the Aurora Opal, the Duchess Emerald, the Sun Diamond), and slip out the green exit. Every floor offers several routes: open floor is fast and exposed, the cover route winds behind glass cases, and a narrow service lane stays out of every cone. Tools cost: toss a coin to pull a guard away, drop smoke to blind every eye, fire an EMP to freeze the cameras, and hold E to pick the strongroom's lock. The alarm meter climbs whenever any eye sees you and drains when you break line of sight — at the peak, guards give chase and the doors lock down, so the caught moment is a chase you can see coming. All sound is synthesized live with WebAudio; no build step, no libraries, no network: plain static files and a canvas.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 in a desktop browser
# Move: WASD or arrow keys · Sneak: hold Shift · Click: throw a coin · Q: smoke · F: EMP · E (hold): pick the lock · R: retry floor · M: mute

# Hand the entry in (writes game/, screenshots/ and dossier.json to the output):
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=eg1d3bmd&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
