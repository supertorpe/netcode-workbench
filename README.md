# netcode-workbench (beta)

[Netcode Workbench](https://supertorpe.github.io/netcode-workbench/) is a graphical console for debugging netcode algorithms.

## Features
- Network abstraction with latency simulation
- Configurable tick duration
- Parametrizable interpolation
- Realtime and downloadable logs and game state history
- Easily extensible inheriting from the BaseNetCode class
- Simple game simulation with planck-js physics engine

### TO DO
- Add more netcode algorithms
- Packet drop simulation

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
* [mini.css](https://minicss.org): minimal, responsive, style-agnostic
CSS framework
* [Vite](https://vitejs.dev): build tool that aims to provide a faster and leaner development experience for modern web projects
* [planck-js](https://piqnt.com/planck.js): 2D JavaScript physics engine for cross-platform HTML5 game development
* [StreamSaver.js](https://github.com/jimmywarting/StreamSaver.js): StreamSaver writes stream to the filesystem directly asynchronous
* [fontawesome-free](https://fontawesome.com): icons

## License

[MIT](LICENSE).
