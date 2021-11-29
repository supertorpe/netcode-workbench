import 'mini.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'jspanel4/dist/jspanel.min.css';
import '../css/style.css';

import { jsPanel } from 'jspanel4';
import * as angular from 'angular';
import { createWriteStream } from 'streamsaver';
import { config } from '../config';
import { ClientDevice } from './client-device';
import { ServerDevice } from './server-device';

class Gui {

    private deviceServer: ServerDevice;
    private devicePlayer1: ClientDevice;
    private devicePlayer2: ClientDevice;

    private p2pmode = true;

    private panelControl: any;
    private panelCanvas1: any;
    private panelGamestates1: any;
    private panelLog1: any;
    private panelCanvas2: any;
    private panelGamestates2: any;
    private panelLog2: any;
    private panelCanvasS: any;
    private panelGamestatesS: any;
    private panelLogS: any;

    constructor() {
        this.deviceServer = new ServerDevice(
            0,
            document.getElementById('serverGameArea') as HTMLCanvasElement);
        this.devicePlayer1 = new ClientDevice(
            config.players[0].id,
            config.players[0].keyUp,
            config.players[0].keyDown,
            config.players[0].keyLeft,
            config.players[0].keyRight,
            document.getElementById('player1GameArea') as HTMLCanvasElement);
        this.devicePlayer2 = new ClientDevice(
            config.players[1].id,
            config.players[1].keyUp,
            config.players[1].keyDown,
            config.players[1].keyLeft,
            config.players[1].keyRight,
            document.getElementById('player2GameArea') as HTMLCanvasElement);
    }

    public build() {
        this.createWindows();
        this.bootstrapAngular();
    }

    private createWindows() {
        ///////////////
        /// WINDOWS ///
        ///////////////

        // CONTROL PANEL //
        this.panelControl = jsPanel.create({
            headerTitle: 'Control Panel',
            theme: 'dimgrey',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: '18em', height: '100%' },
            position: { my: 'left-top', at: 'left-top', offsetX: '0', offsetY: '0' },
            content: document.getElementById('controlPanel')
        });

        // PLAYER 1 //
        // GameStates
        this.panelGamestates1 = jsPanel.create({
            headerTitle: 'Player 1 Game States',
            theme: 'DarkSlateBlue',
            contentOverflow: 'auto',
            headerControls: { close: 'remove', size: 'xs' },
            resizeit: { handles: 'n,s' },
            panelSize: { width: '22em', height: '50%' },
            position: { my: 'left-top', at: 'left-top', offsetX: 'calc(100vw - 22em)', offsetY: '0' },
            content: document.getElementById('player1GameStates')
        });
        // Canvas
        this.panelCanvas1 = jsPanel.create({
            headerTitle: 'Player 1 Canvas',
            theme: 'DarkSlateBlue',
            contentOverflow: 'hide',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: '310px', height: 'calc(250px + 4.5em)' },
            position: { my: 'left-top', at: 'left-top', offsetX: 'calc(18em + (100vw - 40em - 620px) / 3)', offsetY: '0' },
            content: document.getElementById('player1Canvas')
        });
        // Logs
        this.panelLog1 = jsPanel.create({
            headerTitle: 'Player 1 Logs',
            theme: 'DarkSlateBlue',
            contentOverflow: 'auto',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: 'calc(100vw - 40em)', height: 'calc((100vh - 250px - 4.5em) / 2)' },
            position: { my: 'left-top', at: 'left-top', offsetX: '18em', offsetY: 'calc(250px + 4.5em)' },
            content: document.getElementById('player1Logs')
        });

        // PLAYER 2 //
        // GameStates
        this.panelGamestates2 = jsPanel.create({
            headerTitle: 'Player 2 Game States',
            theme: 'OliveDrab',
            contentOverflow: 'auto',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: '350px', height: '50%' },
            position: { my: 'left-top', at: 'left-top', offsetX: 'calc(100vw - 22em)', offsetY: '50%' },
            content: document.getElementById('player2GameStates')
        });
        // Canvas
        this.panelCanvas2 = jsPanel.create({
            headerTitle: 'Player 2 Canvas',
            theme: 'OliveDrab',
            contentOverflow: 'hide',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: '310px', height: 'calc(250px + 4.5em)' },
            position: { my: 'left-top', at: 'left-top', offsetX: 'calc(100vw - 22em - 310px - (100vw - 40em - 620px) / 3)', offsetY: '0' },
            content: document.getElementById('player2Canvas')
        });
        // Logs
        this.panelLog2 = jsPanel.create({
            headerTitle: 'Player 2 Logs',
            theme: 'OliveDrab',
            contentOverflow: 'auto',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: 'calc(100vw - 40em)', height: 'calc((100vh - 250px - 4.5em) / 2)' },
            position: { my: 'left-top', at: 'left-top', offsetX: '18em', offsetY: 'calc(250px + 4.5em + (100vh - 250px - 4.5em) / 2)' },
            content: document.getElementById('player2Logs')
        });

        // SERVER //
        // GameStates
        this.panelGamestatesS = jsPanel.create({
            headerTitle: 'Server Game States',
            theme: 'black',
            contentOverflow: 'auto',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: '350px', height: '50%' },
            position: { my: 'left-top', at: 'left-top', offsetX: 'calc(100vw - 350px)', offsetY: '50%' },
            content: document.getElementById('serverGameStates')
        });
        // Canvas
        this.panelCanvasS = jsPanel.create({
            headerTitle: 'Server "Canvas"',
            theme: 'black',
            contentOverflow: 'hide',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: '310px', height: 'calc(250px + 4.5em)' },
            position: { my: 'left-top', at: 'left-top', offsetX: 'calc(50vw + 350px)', offsetY: '0' },
            content: document.getElementById('serverCanvas')
        });
        // Logs
        this.panelLogS = jsPanel.create({
            headerTitle: 'Server Logs',
            theme: 'black',
            contentOverflow: 'auto',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: 'calc(100vw - 40em)', height: 'calc((100vh - 250px - 4.5em) / 2)' },
            position: { my: 'left-top', at: 'left-top', offsetX: '350px', offsetY: '75%' },
            content: document.getElementById('serverLogs')
        });
    }

    private resetLayout() {
        this.panelControl.reposition({ my: 'left-top', at: 'left-top', offsetX: '0', offsetY: '0' });
        this.panelControl.resize({ width: '18em', height: '100%' });
        if (this.p2pmode) {
            // reposition players windows
            this.panelGamestates1.reposition({ my: 'left-top', at: 'left-top', offsetX: 'calc(100vw - 22em)', offsetY: '0' });
            this.panelGamestates1.resize({ width: '22em', height: '50%' });
            this.panelCanvas1.reposition({ my: 'left-top', at: 'left-top', offsetX: 'calc(18em + (100vw - 40em - 620px) / 3)', offsetY: '0' });
            this.panelCanvas1.resize({ width: '310px', height: 'calc(250px + 4.5em)' });
            this.panelLog1.reposition({ my: 'left-top', at: 'left-top', offsetX: '18em', offsetY: 'calc(250px + 4.5em)' });
            this.panelLog1.resize({ width: 'calc(100vw - 40em)', height: 'calc((100vh - 250px - 4.5em) / 2)' });
            this.panelGamestates2.reposition({ my: 'left-top', at: 'left-top', offsetX: 'calc(100vw - 22em)', offsetY: '50%' });
            this.panelGamestates2.resize({ width: '22em', height: '50%' });
            this.panelCanvas2.reposition({ my: 'left-top', at: 'left-top', offsetX: 'calc(100vw - 22em - 310px - (100vw - 40em - 620px) / 3)', offsetY: '0' });
            this.panelCanvas2.resize({ width: '310px', height: 'calc(250px + 4.5em)' });
            this.panelLog2.reposition({ my: 'left-top', at: 'left-top', offsetX: '18em', offsetY: 'calc(250px + 4.5em + (100vh - 250px - 4.5em) / 2)' });
            this.panelLog2.resize({ width: 'calc(100vw - 40em)', height: 'calc((100vh - 250px - 4.5em) / 2)' });
            // hide server windows
            //*
            this.panelGamestatesS.reposition({ my: 'left-top', at: 'left-top', offsetX: '1000vw', offsetY: '1000vh' });
            this.panelCanvasS.reposition({ my: 'left-top', at: 'left-top', offsetX: '1000vw', offsetY: '1000vh' });
            this.panelLogS.reposition({ my: 'left-top', at: 'left-top', offsetX: '1000vw', offsetY: '1000vh' });
            //*/
        } else {
            // reposition players windows
            this.panelGamestates1.reposition({ my: 'left-top', at: 'left-top', offsetX: 'calc(100vw - 22em)', offsetY: '0' });
            this.panelGamestates1.resize({ width: '22em', height: '33%' });
            this.panelCanvas1.reposition({ my: 'left-top', at: 'left-top', offsetX: '18em', offsetY: '0' });
            this.panelCanvas1.resize({ width: '310px', height: 'calc(250px + 4.5em)' });
            this.panelLog1.reposition({ my: 'left-top', at: 'left-top', offsetX: '18em', offsetY: 'calc(250px + 4.5em)' });
            this.panelLog1.resize({ width: 'calc(100vw - 40em - 4em)', height: 'calc(100vh - 250px - 4.5em - 4em)' });
            this.panelGamestates2.reposition({ my: 'left-top', at: 'left-top', offsetX: 'calc(100vw - 22em)', offsetY: '33%' });
            this.panelGamestates2.resize({ width: '22em', height: '33%' });
            this.panelCanvas2.reposition({ my: 'left-top', at: 'left-top', offsetX: 'calc(18em + 310px)', offsetY: '0' });
            this.panelCanvas2.resize({ width: '310px', height: 'calc(250px + 4.5em)' });
            this.panelLog2.reposition({ my: 'left-top', at: 'left-top', offsetX: '20em', offsetY: 'calc(250px + 4.5em + 2em)' });
            this.panelLog2.resize({ width: 'calc(100vw - 40em - 4em)', height: 'calc(100vh - 250px - 4.5em - 4em)' });
            // restore server windows
            this.panelGamestatesS.reposition({ my: 'left-top', at: 'left-top', offsetX: 'calc(100vw - 22em)', offsetY: '66%' });
            this.panelGamestatesS.resize({ width: '22em', height: '33%' });
            this.panelCanvasS.reposition({ my: 'left-top', at: 'left-top', offsetX: 'calc(18em + 620px)', offsetY: '0' });
            this.panelCanvasS.resize({ width: '310px', height: 'calc(250px + 4.5em)' });
            this.panelLogS.reposition({ my: 'left-top', at: 'left-top', offsetX: '22em', offsetY: 'calc(250px + 4.5em + 4em)' });
            this.panelLogS.resize({ width: 'calc(100vw - 40em - 4em)', height: 'calc(100vh - 250px - 4.5em - 4em)' });
        }
        // reorder z-index
        this.panelGamestates1.front();
        this.panelGamestates2.front();
        this.panelGamestatesS.front();
        this.panelLog1.front();
        this.panelLog2.front();
        this.panelLogS.front();
        this.panelCanvas1.front();
        this.panelCanvas2.front();
        this.panelCanvasS.front();
    }

    private saveFile(name: string, content: string) {
        const date = new Date();
        const fileStream = createWriteStream(`${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}-${name}.log`);
        const writer = fileStream.getWriter();
        const encoder = new TextEncoder();
        const uint8array = encoder.encode(content);
        writer.write(uint8array);
        writer.close();
    }

    private bootstrapAngular() {
        angular.module('app', [])
            .controller('mainCtrl', ['$scope', '$timeout', ($scope, $timeout) => {
                $scope.info = {
                    showSpinner: false,
                    btnStopEnabled: false,
                    btnPlayEnabled: true,
                    btnSaveEnabled: true,
                    playing: false,
                    tick: config.network.tickMs,
                    netcodes: config.netcodes,
                    algorithm: config.netcodes[0],
                    latency1: { min: config.network.minLatency1, max: config.network.maxLatency1 },
                    packetLoss1: config.network.packetLoss1,
                    latency2: { min: config.network.minLatency2, max: config.network.maxLatency2 },
                    packetLoss2: config.network.packetLoss2,
                    npcs: 0,
                    realtimeGameStates: false,
                    realtimeLogs: false,
                    interpolation: true,
                    debugBoxes: true,
                    syncScrollGs1: true,
                    syncScrollGs2: true,
                    syncScrollGsS: true,
                    syncScrollLog1: true,
                    syncScrollLog2: true,
                    syncScrollLogS: true,
                    logsPlayer1: [],
                    logsPlayer2: [],
                    logsServer: [],
                    gamestatesPlayer1: [],
                    gamestatesPlayer2: [],
                    gamestatesServer: []
                };

                const p2pmode = $scope.info.algorithm.type === 'p2p';
                this.p2pmode = p2pmode;
                this.resetLayout();

                $scope.resetLayout = () => { this.resetLayout(); }

                // sync scrolls
                const player1GameStates = document.getElementById('player1GameStates') as HTMLElement;
                const player2GameStates = document.getElementById('player2GameStates') as HTMLElement;
                const serverGameStates = document.getElementById('serverGameStates') as HTMLElement;
                angular.element(player1GameStates.parentElement as HTMLElement).bind('scroll', () => {
                    if ($scope.info.syncScrollGs1) {
                        if ($scope.info.syncScrollGs2) (player2GameStates.parentElement as HTMLElement).scrollTop = (player1GameStates.parentElement as HTMLElement).scrollTop;
                        if ($scope.info.syncScrollGsS) (serverGameStates.parentElement as HTMLElement).scrollTop = (player1GameStates.parentElement as HTMLElement).scrollTop;
                    }
                });
                angular.element(player2GameStates.parentElement as HTMLElement).bind('scroll', () => {
                    if ($scope.info.syncScrollGs2) {
                        if ($scope.info.syncScrollGs1) (player1GameStates.parentElement as HTMLElement).scrollTop = (player2GameStates.parentElement as HTMLElement).scrollTop;
                        if ($scope.info.syncScrollGsS) (serverGameStates.parentElement as HTMLElement).scrollTop = (player2GameStates.parentElement as HTMLElement).scrollTop;
                    }
                });
                angular.element(serverGameStates.parentElement as HTMLElement).bind('scroll', () => {
                    if ($scope.info.syncScrollGsS) {
                        if ($scope.info.syncScrollGs1) (player1GameStates.parentElement as HTMLElement).scrollTop = (serverGameStates.parentElement as HTMLElement).scrollTop;
                        if ($scope.info.syncScrollGs2) (player2GameStates.parentElement as HTMLElement).scrollTop = (serverGameStates.parentElement as HTMLElement).scrollTop;
                    }
                });
                const player1Logs = document.getElementById('player1Logs') as HTMLElement;
                const player2Logs = document.getElementById('player2Logs') as HTMLElement;
                const serverLogs = document.getElementById('serverLogs') as HTMLElement;
                angular.element(player1Logs.parentElement as HTMLElement).bind('scroll', () => {
                    if ($scope.info.syncScrollLog1) {
                        if ($scope.info.syncScrollLog2) (player2Logs.parentElement as HTMLElement).scrollTop = (player1Logs.parentElement as HTMLElement).scrollTop;
                        if ($scope.info.syncScrollLogS) (serverLogs.parentElement as HTMLElement).scrollTop = (player1Logs.parentElement as HTMLElement).scrollTop;
                    }  
                });
                angular.element(player2Logs.parentElement as HTMLElement).bind('scroll', () => {
                    if ($scope.info.syncScrollLog2) {
                        if ($scope.info.syncScrollLog1) (player1Logs.parentElement as HTMLElement).scrollTop = (player2Logs.parentElement as HTMLElement).scrollTop;
                        if ($scope.info.syncScrollLogS) (serverLogs.parentElement as HTMLElement).scrollTop = (player2Logs.parentElement as HTMLElement).scrollTop;
                    }  
                });
                angular.element(serverLogs.parentElement as HTMLElement).bind('scroll', () => {
                    if ($scope.info.syncScrollLogS) {
                        if ($scope.info.syncScrollLog1) (player1Logs.parentElement as HTMLElement).scrollTop = (serverLogs.parentElement as HTMLElement).scrollTop;
                        if ($scope.info.syncScrollLog2) (player2Logs.parentElement as HTMLElement).scrollTop = (serverLogs.parentElement as HTMLElement).scrollTop;
                    }  
                });

                this.deviceServer.deviceUpdatedEmitter.addEventListener(() => {
                    if ($scope.info.realtimeGameStates || $scope.info.realtimeLogs) $scope.$apply();
                });

                this.devicePlayer1.deviceUpdatedEmitter.addEventListener(() => {
                    if ($scope.info.realtimeGameStates || $scope.info.realtimeLogs) $scope.$apply();
                });

                this.devicePlayer2.deviceUpdatedEmitter.addEventListener(() => {
                    if ($scope.info.realtimeGameStates || $scope.info.realtimeLogs) $scope.$apply();
                });

                const syncButtonHtml = '<button class="jsPanel-btn jsPanel-btn-menu jsPanel-btn-md tooltip bottom" aria-label="Sync scroll"><span class="fas fa-arrows-alt-v toolbar-icon" style="vertical-align: text-top"></span><input type="checkbox" checked /></button>';
                const downloadButtonHtml = '<button class="jsPanel-btn jsPanel-btn-menu jsPanel-btn-md tooltip bottom" aria-label="Download"><span class="fas fa-download toolbar-icon"></span></button>';

                this.panelGamestates1.addControl({
                    html: syncButtonHtml,
                    name: 'sync',
                    position: 1,
                    handler: () => {
                        $scope.info.syncScrollGs1 = !$scope.info.syncScrollGs1;
                    }
                });
                this.panelGamestates1.addControl({
                    html: downloadButtonHtml,
                    name: 'download',
                    position: 2,
                    handler: () => {
                        $scope.saveGamestates1();
                    }
                });
                this.panelGamestates2.addControl({
                    html: syncButtonHtml,
                    name: 'sync',
                    position: 1,
                    handler: () => {
                        $scope.info.syncScrollGs2 = !$scope.info.syncScrollGs2;
                    }
                });
                this.panelGamestates2.addControl({
                    html: downloadButtonHtml,
                    name: 'download',
                    position: 2,
                    handler: () => {
                        $scope.saveGamestates2();
                    }
                });
                this.panelGamestatesS.addControl({
                    html: syncButtonHtml,
                    name: 'sync',
                    position: 1,
                    handler: () => {
                        $scope.info.syncScrollGsS = !$scope.info.syncScrollGsS;
                    }
                });
                this.panelGamestatesS.addControl({
                    html: downloadButtonHtml,
                    name: 'download',
                    position: 2,
                    handler: () => {
                        $scope.saveGamestatesS();
                    }
                });
                this.panelLog1.addControl({
                    html: syncButtonHtml,
                    name: 'sync',
                    position: 1,
                    handler: () => {
                        $scope.info.syncScrollLog1 = !$scope.info.syncScrollLog1;
                    }
                });
                this.panelLog1.addControl({
                    html: downloadButtonHtml,
                    name: 'download',
                    position: 2,
                    handler: () => {
                        $scope.saveLogs1();
                    }
                });
                this.panelLog2.addControl({
                    html: syncButtonHtml,
                    name: 'sync',
                    position: 1,
                    handler: () => {
                        $scope.info.syncScrollLog2 = !$scope.info.syncScrollLog2;
                    }
                });
                this.panelLog2.addControl({
                    html: downloadButtonHtml,
                    name: 'download',
                    position: 2,
                    handler: () => {
                        $scope.saveLogs2();
                    }
                });
                this.panelLogS.addControl({
                    html: syncButtonHtml,
                    name: 'sync',
                    position: 1,
                    handler: () => {
                        $scope.info.syncScrollLogS = !$scope.info.syncScrollLogS;
                    }
                });
                this.panelLogS.addControl({
                    html: downloadButtonHtml,
                    name: 'download',
                    position: 2,
                    handler: () => {
                        $scope.saveLogsS();
                    }
                });

                $scope.changeAlgorithm = () => {
                    const p2pmode = $scope.info.algorithm.type === 'p2p';
                    if (p2pmode === this.p2pmode) return;
                    this.p2pmode = p2pmode;
                    this.resetLayout();
                };

                $scope.stop = () => {
                    $scope.info.showSpinner = true;
                    $timeout(() => {  
                        this.deviceServer.stop();
                        this.devicePlayer1.stop();
                        this.devicePlayer2.stop();
                        $scope.info.btnStopEnabled = false;
                        $scope.info.btnPlayEnabled = true;
                        $scope.info.playing = false;
                        $timeout(() => {  $scope.info.showSpinner = false; });
                     });
                };
                $scope.play = () => {
                    // cleanup
                    this.deviceServer.reset();
                    this.devicePlayer1.reset();
                    this.devicePlayer2.reset();
                    if ($scope.info.algorithm.type === 'p2p') {
                        this.devicePlayer1.connect(this.devicePlayer2, $scope.info.latency1.min, $scope.info.latency1.max, $scope.info.packetLoss1, $scope.info.latency2.min, $scope.info.latency2.max, $scope.info.packetLoss2);
                        this.devicePlayer1.play($scope.info.algorithm, $scope.info.tick, $scope.info.npcs, true, $scope.info.interpolation, $scope.info.debugBoxes);
                        this.devicePlayer2.play($scope.info.algorithm, $scope.info.tick, $scope.info.npcs, true, $scope.info.interpolation, $scope.info.debugBoxes);
                    } else {
                        this.devicePlayer1.connect(this.deviceServer, $scope.info.latency1.min, $scope.info.latency1.max, $scope.info.packetLoss1, $scope.info.latency1.min, $scope.info.latency1.max, $scope.info.packetLoss1);
                        this.devicePlayer2.connect(this.deviceServer, $scope.info.latency2.min, $scope.info.latency2.max, $scope.info.packetLoss2, $scope.info.latency2.min, $scope.info.latency2.max, $scope.info.packetLoss2);
                        this.deviceServer.play($scope.info.algorithm, $scope.info.tick, $scope.info.npcs, true, false, false);
                        this.devicePlayer1.play($scope.info.algorithm, $scope.info.tick, $scope.info.npcs, false, $scope.info.interpolation, $scope.info.debugBoxes);
                        this.devicePlayer2.play($scope.info.algorithm, $scope.info.tick, $scope.info.npcs, false, $scope.info.interpolation, $scope.info.debugBoxes);
                    }
                    $scope.info.btnStopEnabled = true;
                    $scope.info.btnPlayEnabled = false;
                    $scope.info.playing = true;
                    $scope.info.gamestatesServer = this.deviceServer.gameStateHistory;
                    $scope.info.gamestatesPlayer1 = this.devicePlayer1.gameStateHistory;
                    $scope.info.gamestatesPlayer2 = this.devicePlayer2.gameStateHistory;
                    $scope.info.logsServer = this.deviceServer.log.traces;
                    $scope.info.logsPlayer1 = this.devicePlayer1.log.traces;
                    $scope.info.logsPlayer2 = this.devicePlayer2.log.traces;
                };
                $scope.changeInterpolation = () => {
                    this.devicePlayer1.interpolation = $scope.info.interpolation;
                    this.devicePlayer2.interpolation = $scope.info.interpolation;
                };
                $scope.changeDebugBoxes = () => {
                    this.devicePlayer1.debugBoxes = $scope.info.debugBoxes;
                    this.devicePlayer2.debugBoxes = $scope.info.debugBoxes;
                };
                $scope.saveAll = () => {
                    let data = `
--------------------
PLAYER 1 GAME STATES
--------------------
${this.devicePlayer1.gameStateHistoryLog()}
-------------
PLAYER 1 LOGS
-------------
${this.devicePlayer1.log}

--------------------
PLAYER 2 GAME STATES
--------------------
${this.devicePlayer2.gameStateHistoryLog()}
-------------
PLAYER 2 LOGS
-------------
${this.devicePlayer2.log}`;
                    if ($scope.info.algorithm.type !== 'p2p') {
                        data +=
`-----------------
SERVER GAME STATES
------------------
${this.deviceServer.gameStateHistoryLog()}
-----------
SERVER LOGS
-----------
${this.deviceServer.log}`;
                    }
                    this.saveFile($scope.info.algorithm.name, data);
                };

                $scope.saveGamestates1 = () => {
                    this.saveFile(`${$scope.info.algorithm.name}-p1-states`, this.devicePlayer1.gameStateHistoryLog());
                };
                $scope.saveLogs1 = () => {
                    this.saveFile(`${$scope.info.algorithm.name}-p1-logs`, this.devicePlayer1.log.toString());
                };
                $scope.saveGamestates2 = () => {
                    this.saveFile(`${$scope.info.algorithm.name}-p2-states`, this.devicePlayer2.gameStateHistoryLog());
                };
                $scope.saveLogs2 = () => {
                    this.saveFile(`${$scope.info.algorithm.name}-p2-logs`, this.devicePlayer2.log.toString());
                };
                $scope.saveGamestatesS = () => {
                    this.saveFile(`${$scope.info.algorithm.name}-srv-states`, this.deviceServer.gameStateHistoryLog());
                };
                $scope.saveLogsS = () => {
                    this.saveFile(`${$scope.info.algorithm.name}-srv-logs`, this.deviceServer.log.toString());
                };
            }]);
    }
}

export const gui = new Gui();