
class CPU {
    stackPointer : number = 0;
    programCounter : number = 0;
    regA : number = 0;
    regC : number = 0;
    regD : number = 0;
    regE : number = 0;
    regH : number = 0;
    regL : number = 0;
    regF : number = 0;
    memoryManager: MemoryManager;


    constructor(cManager : MemoryManager)
    {
        this.memoryManager = cManager;
    }

    public Tick() {
        var instruction = this.memoryManager.readByte(this.programCounter++);
        this.ExecuteInstruction(instruction);
    }

    private ExecuteInstruction(instruction : number) {
        switch(instruction) {
            case 0x0C: //inc C
                this.regC++;
                this.regC = this.regC&0xFF;
                break;
            case 0x0E: //LD C
                this.regC = this.memoryManager.readByte(this.programCounter);
                this.programCounter++;
                break;
            case 0x11: //LD DE,u16
                this.regE = this.memoryManager.readByte(this.programCounter);
                this.programCounter++;
                this.regD = this.memoryManager.readByte(this.programCounter);
                this.programCounter++;
                break;
            case 0x1A: //LD A, DE
                var address = this.regD<<8 | this.regE;
                this.regA = this.memoryManager.readByte(address);
                break;
            case 0x20: //JR, NZ 
                var val = this.memoryManager.readByte(this.programCounter);
                if(val > 127) {
                   val = -((~val+1)&255);
                }
                this.programCounter++;
                if((this.regF&0x80) == 0){
                    this.programCounter += val;
                }
                break;
            case 0x21: //LD HL
                this.regL = this.memoryManager.readByte(this.programCounter);
                this.programCounter++;
                this.regH = this.memoryManager.readByte(this.programCounter);
                this.programCounter++;
                break;
            case 0x31: //LD SP 
                this.stackPointer = this.memoryManager.readByte16(this.programCounter);
                this.programCounter+=2;
                break;
            case 0x32: //LD (HL-),A
                this.memoryManager.writeByte((this.regL) | (this.regH<<8),this.regA);
                this.regL = (this.regL-1)&0xFF;
                if(this.regL == 0xFF) { //if there is rollover
                    this.regH = (this.regH-1)&0xFF;
                }
                break;
            case 0x3E: //LD A
                this.regA = this.memoryManager.readByte(this.programCounter);
                this.programCounter++;
                break;
            case 0x77: //LD HL,A
                this.memoryManager.writeByte((this.regL) | (this.regH<<8),this.regA);
                break;
            case 0xAF: //xor A
                this.regA ^ this.regA;
                break;
            case 0xCB: //special instruction CB
                instruction = this.memoryManager.readByte(this.programCounter++);
                this.ExecuteCBInstruction(instruction);
                break;
            case 0xE0: //LDH u8,A
                 this.memoryManager.writeByte(0xFF00 + this.memoryManager.readByte(this.programCounter),this.regA);
                 this.programCounter++;
                 break;
            case 0xE2: //LD 0xFF00 C,A
                this.memoryManager.writeByte(0xFF00 + this.regC,this.regA);
                break;
            default:
                console.log("Unknown Instruction: " + instruction.toString(16));
                break;
        }
    }

    private ExecuteCBInstruction(instruction : number) {
        switch(instruction){
            case 0x7C: //BIT7 H
                this.regF &= 0x3F; //clear Z and N
                this.regF |= 0x20; //set C
                if(this.regH&0x80){
                    this.regF |= 0x80; //set Z
                }
                break;
        }
    }

};