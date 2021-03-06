# netcode-workbench (beta)

[Netcode Workbench](https://supertorpe.github.io/netcode-workbench/) is a graphical console for debugging netcode algorithms.

## Features
- Two players with up to ten NPCs
- Network abstraction with latency and packet loss simulation
- Several serialization mechanisms: JSON, CBOR, MessagePack
- Configurable tick duration
- Parametrizable smoothing (none, interpolation/extrapolation, progressive)
- Optionally draw debug boxes to see smoothing effect
- Realtime and downloadable logs and game state history
- Network Traffic Chart
- Easily extensible inheriting from the BaseNetCode class
- Externalizable netcodes
- Simple game simulation with planck-js physics engine

### TO DO
- Add more netcode algorithms

### Available NetCodes
#### P2P
- p2p-naive: it only keeps one Game State in memory. 'Naive' sends and receives commands on every tick. If there are remote commands pending (due to lag), it waits before generating next Game State: latency affects it a lot. This doesn't allow real interpolation: the position of each body can be calculated from the time elapsed since the tick and the position and velocity of the body. When latency or tick period is high, this calculation gives wrong results (as it ignores collisions)
- p2p-delayed: similar to 'naive' but it keeps the last two Game States in memory, so interpolation works better by delaying the render frame
- p2p-rollback: each node maintains a history of game states. When a command that belongs to an old state arrives, the history is recalculated from that state on. Each node sends commands only when it changes value, not on every tick.
#### Client-Server
- cs-lockstep: The server advances the tick when the time comes but only if it has received the commands from all the clients. The server calculates the physics and sends the game state to the clients
#### Custom
You can host your own netcode. For example:
https://gist.github.com/supertorpe/7a7837fb135d6dfaef77667f2da37468
```javascript
export const type = 'cs';
export const name = 'customLockstepClientServer';
export class ClientNetCode extends BaseNetCode {
  //...
}
export class ServerNetCode extends BaseNetCode {
  //...
}
```
...and load it selecting "Custom" algorithm and writing the URL of the file.
## Screenshot
<img src="https://supertorpe.github.io/netcode-workbench/assets/screenshot.png" />

## Development

Clone this repository and install its dependencies:

```bash
git clone https://github.com/supertorpe/netcode-workbench.git
cd netcode-workbench
npm install
```

`npm run dev` launches a server with hot reloading. Navigate to [localhost:3000](http://localhost:3000).

`npm run build` builds the application to `dist`, generating two bundles for differential serving.

`npm run serve` launches a server over the previous build.

## Resources

Following software and resources has been used:

* [TypeScript](https://www.typescriptlang.org): strongly typed programming language that builds on JavaScript
* [AngularJS](https://angularjs.org): frontend web framework
* [jsPanel v4.x](https://www.jspanel.de): JavaScript library to create highly configurable floating panels, modals, tooltips...
* [uPlot](https://github.com/leeoniya/uPlot): a small, fast chart for time series, lines, areas, ohlc & bars
* [cbor-x](https://github.com/kriszyp/cbor-x): ultra-fast CBOR encoder/decoder with extensions for records and structural cloning
* [msgpackr](https://github.com/kriszyp/msgpackr): ultra-fast MessagePack implementation with extension for record and structural cloning
* [mini.css](https://minicss.org): minimal, responsive, style-agnostic
CSS framework
* [Vite](https://vitejs.dev): build tool that aims to provide a faster and leaner development experience for modern web projects
* [planck-js](https://piqnt.com/planck.js): 2D JavaScript physics engine for cross-platform HTML5 game development
* [StreamSaver.js](https://github.com/jimmywarting/StreamSaver.js): StreamSaver writes stream to the filesystem directly asynchronous
* [xorshift](https://github.com/AndreasMadsen/xorshift): random number generator using xorshift128+
* [fontawesome-free](https://fontawesome.com): icons

## License

[MIT](LICENSE).
