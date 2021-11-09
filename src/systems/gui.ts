import 'mini.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'jspanel4/dist/jspanel.min.css';
import '../css/style.css';

import { jsPanel } from 'jspanel4';
import * as angular from 'angular';
import { createWriteStream } from 'streamsaver';
import { config } from '../config';
import { Device } from './device';

class Gui {

    private devicePlayer1: Device;
    private devicePlayer2: Device;

    private panelGamestates1: any;
    private panelLog1: any;
    private panelGamestates2: any;
    private panelLog2: any;

    constructor() {
        this.devicePlayer1 = new Device(
            config.players[0].id,
            config.players[0].keyUp,
            config.players[0].keyDown,
            config.players[0].keyLeft,
            config.players[0].keyRight,
            document.getElementById('player1GameArea') as HTMLCanvasElement);
        this.devicePlayer2 = new Device(
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
        jsPanel.create({
            headerTitle: 'Control Panel',
            theme: 'dimgrey',
            dragit: false,
            headerControls: { close: 'remove', maximize: 'remove', normalize: 'remove', minimize: 'remove', smallify: 'remove' },
            panelSize: { width: '100%', height: '150px' },
            position: { my: 'left-top', at: 'left-top', offsetX: '0', offsetY: 'calc(100vh - 150px)' },
            content: document.getElementById('controlPanel')
        });

        // PLAYER 1 //
        // GameStates
        this.panelGamestates1 = jsPanel.create({
            headerTitle: 'Player 1 Game States',
            theme: 'navy',
            contentOverflow: 'auto',
            headerControls: { close: 'remove', size: 'xs' },
            resizeit: { handles: 'n,s' },
            panelSize: { width: '350px', height: 'calc(100vh - 150px)' },
            position: { my: 'left-top', at: 'left-top', offsetX: '0', offsetY: '0' },
            content: document.getElementById('player1GameStates')
        });
        // Canvas
        jsPanel.create({
            headerTitle: 'Player 1 Canvas',
            theme: 'DarkSlateBlue',
            contentOverflow: 'hide',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: 'calc(50vw - 350px)', height: 'calc(100vh - 350px)' },
            position: { my: 'left-top', at: 'left-top', offsetX: '350px', offsetY: '0' },
            content: document.getElementById('player1Canvas')
        });
        // Logs
        this.panelLog1 = jsPanel.create({
            headerTitle: 'Player 1 Logs',
            theme: 'RoyalBlue',
            contentOverflow: 'auto',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: 'calc(50vw - 350px)', height: '200px' },
            position: { my: 'left-top', at: 'left-top', offsetX: '350px', offsetY: 'calc(100vh - 350px)' },
            content: document.getElementById('player1Logs')
        });

        // PLAYER 2 //
        // GameStates
        this.panelGamestates2 = jsPanel.create({
            headerTitle: 'Player 2 Game States',
            theme: 'olive',
            contentOverflow: 'auto',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: '350px', height: 'calc(100vh - 150px)' },
            position: { my: 'left-top', at: 'left-top', offsetX: 'calc(100vw - 350px)', offsetY: '0' },
            content: document.getElementById('player2GameStates')
        });
        // Canvas
        jsPanel.create({
            headerTitle: 'Player 2 Canvas',
            theme: 'OliveDrab',
            contentOverflow: 'hide',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: 'calc(50vw - 350px)', height: 'calc(100vh - 350px)' },
            position: { my: 'left-top', at: 'left-top', offsetX: '50vw', offsetY: '0' },
            content: document.getElementById('player2Canvas')
        });
        // Logs
        this.panelLog2 = jsPanel.create({
            headerTitle: 'Player 2 Logs',
            theme: 'LightGreen',
            contentOverflow: 'auto',
            headerControls: { close: 'remove', size: 'xs' },
            panelSize: { width: 'calc(50vw - 350px)', height: '200px' },
            position: { my: 'left-top', at: 'left-top', offsetX: '50vw', offsetY: 'calc(100vh - 350px)' },
            content: document.getElementById('player2Logs')
        });
    }

    private bootstrapAngular() {
        angular.module('app', [])
            .controller('mainCtrl', ['$scope', ($scope) => {
                $scope.info = {
                    btnStopEnabled: false,
                    btnPlayEnabled: true,
                    btnSaveEnabled: true,
                    tick: config.network.tickMs,
                    algorithm: 'naive',
                    latency: { min: config.network.minLatency, max: config.network.maxLatency },
                    realtimeGameStates: false,
                    realtimeLogs: false,
                    interpolation: true,
                    debugBoxes: true,
                    logsPlayer1: [],
                    logsPlayer2: [],
                    gamestatesPlayer1: [],
                    gamestatesPlayer2: []
                };

                this.devicePlayer1.deviceUpdatedEmitter.addEventListener(() => {
                    $scope.$apply();
                });

                this.devicePlayer2.deviceUpdatedEmitter.addEventListener(() => {
                    $scope.$apply();
                });

                this.panelGamestates1.addControl({
                    html: '<span class="fas fa-download"></span>',
                    name: 'download',
                    position: 1,
                    handler: () => {
                        $scope.saveGamestates1();
                    }
                });

                this.panelLog1.addControl({
                    html: '<span class="fas fa-download"></span>',
                    name: 'download',
                    position: 1,
                    handler: () => {
                        $scope.saveLogs1();
                    }
                });

                this.panelGamestates2.addControl({
                    html: '<span class="fas fa-download"></span>',
                    name: 'download',
                    position: 1,
                    handler: () => {
                        $scope.saveGamestates2();
                    }
                });

                this.panelLog2.addControl({
                    html: '<span class="fas fa-download"></span>',
                    name: 'download',
                    position: 1,
                    handler: () => {
                        $scope.saveLogs2();
                    }
                });

                $scope.stop = () => {
                    this.devicePlayer1.pause();
                    this.devicePlayer2.pause();
                    $scope.info.btnStopEnabled = false;
                    $scope.info.btnPlayEnabled = true;
                    if (!$scope.info.realtimeGameStates) {
                        $scope.info.gamestatesPlayer1 = this.devicePlayer1.gameStateHistory;
                        $scope.info.gamestatesPlayer2 = this.devicePlayer2.gameStateHistory;
                    }
                    if (!$scope.info.realtimeLogs) {
                        $scope.info.logsPlayer1 = this.devicePlayer1.log.traces;
                        $scope.info.logsPlayer2 = this.devicePlayer2.log.traces;
                    }
                };
                $scope.play = () => {
                    // cleanup
                    this.devicePlayer1.reset();
                    this.devicePlayer2.reset();
                    this.devicePlayer1.connect(this.devicePlayer2);
                    this.devicePlayer2.connect(this.devicePlayer1);
                    this.devicePlayer1.play($scope.info.algorithm, $scope.info.tick, $scope.info.latency.min, $scope.info.latency.max, $scope.info.interpolation, $scope.info.debugBoxes);
                    this.devicePlayer2.play($scope.info.algorithm, $scope.info.tick, $scope.info.latency.min, $scope.info.latency.max, $scope.info.interpolation, $scope.info.debugBoxes);
                    $scope.info.btnStopEnabled = true;
                    $scope.info.btnPlayEnabled = false;
                    $scope.checkRealtimeInfo();
                };
                $scope.checkRealtimeInfo = () => {
                    if ($scope.info.realtimeGameStates) {
                        $scope.info.gamestatesPlayer1 = this.devicePlayer1.gameStateHistory;
                        $scope.info.gamestatesPlayer2 = this.devicePlayer2.gameStateHistory;
                    } else {
                        $scope.info.gamestatesPlayer1 = [];
                        $scope.info.gamestatesPlayer2 = [];
                    }
                    if ($scope.info.realtimeLogs) {
                        $scope.info.logsPlayer1 = this.devicePlayer1.log.traces;
                        $scope.info.logsPlayer2 = this.devicePlayer2.log.traces;
                    } else {
                        $scope.info.logsPlayer1 = [];
                        $scope.info.logsPlayer2 = [];
                    }
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
                    const date = new Date();

                    const fileStream = createWriteStream(`${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}-${$scope.info.algorithm}.log`);
                    const writer = fileStream.getWriter();
                    const encoder = new TextEncoder();
                    const data = `--------------------
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
                    const uint8array = encoder.encode(data);
                    writer.write(uint8array);
                    writer.close();
                };

                $scope.saveGamestates1 = () => {
                    const date = new Date();
                    const fileStream = createWriteStream(`${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}-${$scope.info.algorithm}-p1states.log`);
                    const writer = fileStream.getWriter();
                    const encoder = new TextEncoder();
                    const uint8array = encoder.encode(this.devicePlayer1.gameStateHistoryLog());
                    writer.write(uint8array);
                    writer.close();
                };
                $scope.saveLogs1 = () => {
                    const date = new Date();
                    const fileStream = createWriteStream(`${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}-${$scope.info.algorithm}-p1logs.log`);
                    const writer = fileStream.getWriter();
                    const encoder = new TextEncoder();
                    const uint8array = encoder.encode(this.devicePlayer1.log.toString());
                    writer.write(uint8array);
                    writer.close();
                };
                $scope.saveGamestates2 = () => {
                    const date = new Date();
                    const fileStream = createWriteStream(`${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}-${$scope.info.algorithm}-p2states.log`);
                    const writer = fileStream.getWriter();
                    const encoder = new TextEncoder();
                    const uint8array = encoder.encode(this.devicePlayer2.gameStateHistoryLog());
                    writer.write(uint8array);
                    writer.close();
                };
                $scope.saveLogs2 = () => {
                    const date = new Date();
                    const fileStream = createWriteStream(`${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}-${$scope.info.algorithm}-p2logs.log`);
                    const writer = fileStream.getWriter();
                    const encoder = new TextEncoder();
                    const uint8array = encoder.encode(this.devicePlayer2.log.toString());
                    writer.write(uint8array);
                    writer.close();
                };

            }]);
    }
}

export const gui = new Gui();