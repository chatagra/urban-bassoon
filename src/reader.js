import fs from 'fs';
import {uint8ToString} from "./utils";

export default class Reader {

    constructor() {
        this.fp = null;
        this.position = 0;
    }

    openFile(path){
        this.fp = fs.openSync(path, 'r');
    }

    closeFile(){
        if(!this.fp){
            return;
        }

        fs.closeSync(this.fp);
    }

    getPosition(){
        return this.position;
    }

    skipDataAfterHeader(){
        this.readLong();
        this.readLong();
        this.readPackedValue();
        this.readPackedValue();
        this.readPackedValue();
        this.readPackedValue();
    }

    readLong() {
        const buffer = new Uint32Array(1);
        this.position += fs.readSync(this.fp, buffer, 0, 4, null);
        return buffer[0];
    }

    readByte() {
        const buffer = new Uint8Array(1);
        this.position += fs.readSync(this.fp, buffer, 0, 1, null);
        return buffer[0];
    }

    readString(len) {
        if(!len){
            return '';
        }

        const buffer = new Uint8Array(len);
        this.position += fs.readSync(this.fp, buffer, 0, len, null);

        return uint8ToString(buffer);
    }

    readPackedValue() {
        const size = this.readByte();

        if(size >= 0xF0) {
            const size1 = this.readByte();
            const size2 = this.readByte();
            const size3 = this.readByte();
            const size4 = this.readByte();

            return ((size1<<24)|(size2<<16)|(size3<<8)|size4);
        }

        if(size >= 0xE0) {
            const size2 = this.readByte();
            const size3 = this.readByte();
            const size4 = this.readByte();

            return (((size^0xE0)<<24)|(size2<<16)|(size3<<8)|size4);
        }

        if(size >= 0xC0) {
            const size3 = this.readByte();
            const size4 = this.readByte();

            return (((size^0xC0)<<16)|(size3<<8)|size4)
        }

        if((size & 0x80) !== 0) {
            const size4 = this.readByte();

            return (((size^0x80)<<8)|size4);
        }

        return size;
    }
}