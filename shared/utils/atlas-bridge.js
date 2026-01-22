"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AtlasBridge_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtlasBridge = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let AtlasBridge = AtlasBridge_1 = class AtlasBridge {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(AtlasBridge_1.name);
        const host = this.configService.get('GATEWAY_HOST', 'localhost');
        const port = this.configService.get('GATEWAY_PORT', 3000);
        this.gatewayUrl = `http://${host}:${port}`;
    }
    async get(service, version, path) {
        const url = `${this.gatewayUrl}/${service}/${this.getVersionString(version)}/${path}`.replace(/\/+/g, '/');
        this.logger.debug(`🌉 AtlasBridge: GET ${url}`);
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
        return response.data;
    }
    async post(service, version, path, data) {
        const url = `${this.gatewayUrl}/${service}/${this.getVersionString(version)}/${path}`.replace(/\/+/g, '/');
        this.logger.debug(`🌉 AtlasBridge: POST ${url}`);
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, data));
        return response.data;
    }
    async put(service, version, path, data) {
        const url = `${this.gatewayUrl}/${service}/${this.getVersionString(version)}/${path}`.replace(/\/+/g, '/');
        this.logger.debug(`🌉 AtlasBridge: PUT ${url}`);
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.put(url, data));
        return response.data;
    }
    async delete(service, version, path) {
        const url = `${this.gatewayUrl}/${service}/${this.getVersionString(version)}/${path}`.replace(/\/+/g, '/');
        this.logger.debug(`🌉 AtlasBridge: DELETE ${url}`);
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.delete(url));
        return response.data;
    }
    getVersionString(version) {
        return typeof version === 'number' ? `v${version}` : (version[0] === 'v' ? version : `v${version}`);
    }
};
exports.AtlasBridge = AtlasBridge;
exports.AtlasBridge = AtlasBridge = AtlasBridge_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], AtlasBridge);
//# sourceMappingURL=atlas-bridge.js.map