
class Main {
    memoryManager = new MemoryManager()
    cpu = new CPU(this.memoryManager);

    constructor() {
        var c = 255;
        while(this.cpu.programCounter < 256)
           this.cpu.Tick();
        
    }
};

var m = new Main();



