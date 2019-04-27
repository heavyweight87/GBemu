'use strict';
import {MemoryManager} from "./MemoryManager";
import {Z80} from "./Z80";

export class Main {
    memoryManager = new MemoryManager("hello")
    cpu = new Z80(this.memoryManager);

    constructor() {
        var c = 255;
        while(this.cpu.programCounter < 256)
           this.cpu.Tick();
        
    }
};




