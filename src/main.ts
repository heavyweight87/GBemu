'use strict';
import {MemoryManager} from "./MemoryManager";
import {CPU} from "./CPU";

export class Main {
    memoryManager = new MemoryManager("hello")
    cpu = new CPU(this.memoryManager);

    constructor() {
        var c = 255;
        while(this.cpu.programCounter < 256)
           this.cpu.Tick();
        
    }
};

//module.exports = Main;



