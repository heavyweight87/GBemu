import { SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG } from 'constants';
import {MemoryManager} from "./MemoryManager";

export class Z80 {
    stackPointer : number = 0;
    programCounter : number = 0;
    regA : number = 0;
    regB : number = 0;
    regC : number = 0;
    regD : number = 0;
    regE : number = 0;
    regH : number = 0;
    regL : number = 0;
    regF : number = 0; //flags
    memoryManager: MemoryManager;
    //flag masks
    readonly REGF_Z_MASK = 0x80;
    readonly REGF_CO_MASK = 0x10;

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
            case 0x04: //RCL A - shift A left
                //the last bit is coppied to the carry over, and to the first bit
                var last_bit = this.regA&0x80;
                this.regA = (this.regA<<1)&0xFE;
                this.regF &= ~(this.REGF_CO_MASK); //turn the carry over off
                if(last_bit){
                    this.regA = 0x01; //copy the bit over
                    this.regF |= this.REGF_CO_MASK; //set the carry over bit
                }
                break;
            case 0x05: //DEC B
                this.regB = (this.regB--)&0xFF;
                if(this.regB){
                    this.regF |= this.REGF_Z_MASK;
                }
                else{
                    this.regF &= ~(this.REGF_Z_MASK); //turn off z
                }
                break;
            case 0x06: //LD B,u8
                this.regB = this.memoryManager.readByte(this.programCounter);
                this.programCounter++;
                break;
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
            case 0x17: //RLA - shift righy, preserve Z
                //the carry is placed into the 1st bit
                var old_carry = this.regF & this.REGF_CO_MASK;
                //the last bit is put into the carry 
                var last_bit = this.regA &0x80;
                this.regA = (this.regA<<1)&0xFE;
                if(old_carry){
                    this.regC |= 0x01; //add the carry to the first bit
                }
                this.regF &= ~(this.REGF_CO_MASK); //reset carry
                if(last_bit){
                    this.regF |= this.REGF_CO_MASK; //turn carry on
                }
                break
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
                if((this.regF&this.REGF_Z_MASK) == 0){
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
            case 0x4F: //LD C,A
                this.regC = this.regA;
                break;
            case 0x77: //LD HL,A
                this.memoryManager.writeByte((this.regL) | (this.regH<<8),this.regA);
                break;
            case 0xAF: //xor A
                this.regA ^ this.regA;
                break;
            case 0xC1: //POP BC
                this.regC = this.memoryManager.readByte(this.stackPointer);
                this.stackPointer++;
                this.regB = this.memoryManager.readByte(this.stackPointer);
                this.stackPointer++;
                break;
            case 0xC5: //PUSH CB
                //push CB on the stack
                this.stackPointer--;
                this.memoryManager.writeByte(this.stackPointer,this.regB);
                this.stackPointer--;
                this.memoryManager.writeByte(this.stackPointer,this.regC);
                break;
            case 0xCB: //special instruction CB
                instruction = this.memoryManager.readByte(this.programCounter++);
                this.ExecuteCBInstruction(instruction);
                break;
            case 0xCC: //call Z, a16
                if(this.regF & this.REGF_Z_MASK)
                {
                    //the return address goes on the stack pointer
                    this.stackPointer-=2; //stack grows downwards
                    var return_address = this.programCounter+2;
                    //write the stack pointer with the return address
                    this.memoryManager.writeByte(this.stackPointer,return_address&0xFF);
                    this.memoryManager.writeByte(this.stackPointer+1,(return_address>>8)&0xFF);
                    //write the program counter with the jump address
                    this.programCounter = this.memoryManager.readByte16(this.programCounter);
                }
                else {
                    this.programCounter+=2; //don't jump
                }
                break;
            case 0xCD: 
                //the return address goes on the stack pointer
                this.stackPointer-=2; //stack grows downwards
                var return_address = this.programCounter+2;
                //write the stack pointer with the return address
                this.memoryManager.writeByte(this.stackPointer,return_address&0xFF);
                this.memoryManager.writeByte(this.stackPointer+1,(return_address>>8)&0xFF);
                //write the program counter with the jump address
                this.programCounter = this.memoryManager.readByte16(this.programCounter);
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
            case 0x11: //RL C - rotate left
                //the carry is placed into the 1st bit
                var old_carry = this.regF & this.REGF_CO_MASK;
                //the last bit is put into the carry 
                var last_bit = this.regC &0x80;
                this.regC = (this.regC<<1)&0xFE;
                if(old_carry){
                    this.regC |= 0x01; //add the carry to the first bit
                }
                this.regF = 0; //reset flags
                if(last_bit){
                    this.regF |= this.REGF_CO_MASK; //turn carry on
                }
                if(this.regC){
                    this.regF |= this.REGF_Z_MASK;
                }
                break;
            case 0x7C: //BIT7 H
                this.regF &= 0x3F; //clear Z and N
                this.regF |= 0x20; //set C
                if(this.regH&0x80){
                    this.regF |= 0x80; //set Z
                }
                break;
            default: 
                console.log("Unknown special instruction " + instruction.toString(16));
                break;
        }
    }


};