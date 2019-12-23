import fs from 'fs';
import iconv from 'iconv-lite';
import {getPackedValue, unpackWideString} from "./utils";
import Reader from "./reader";

const lineSplitter = "==================================================";

export default class Loader {

    constructor() {
        this.fileList = [];
    }

    getFiles(args){
        if(!args.length){
            console.error('File or directory is not defined');
            return;
        }

        const path = args[0];
        if(!fs.existsSync(path)){
            console.error('File or directory is not exist');
            return;
        }
        const stats = fs.lstatSync(path);
        const isDir = stats.isDirectory();
        const isFile = stats.isFile();

        if (isDir) {
            const directory = fs.readdirSync(path);
            directory.forEach(fileName => {
                if(fileName.toLowerCase().endsWith(".dgdat")){
                    const fullPath = path + "/" + fileName;
                    const targetStats = fs.lstatSync(fullPath);
                    const isTargetFile = targetStats.isFile();
                    if(!isTargetFile){
                        return;
                    }
                    const size = targetStats.size;
                    this.fileList.push({name: fullPath, size: size});
                }
            });
        } else if (isFile) {
            const size = stats.size;
            this.fileList.push({name: path, size: size});
        } else {
            console.error('Specified link is not File or Directory');
            return;
        }


        console.log("Files:");
        console.log(lineSplitter);
        this.fileList.forEach(file => {
            console.log(file.name, (file.size/1024).toFixed(2), 'KB');
        });
        console.log(lineSplitter);
    }

    parseFiles(){
        if(!this.fileList.length){
            console.warn("Nothing to parse");
            return;
        }

        const fileReader = new Reader();

        this.fileList.forEach(file => {
            const srcFile = file.name;
            console.log('Parsing:', srcFile);
            const splitResult = srcFile.split(/\.(?=[^\.]+$)/);
            const srcFolder = splitResult[0] + "/";
            if(!fs.existsSync(srcFolder)){
                fs.mkdirSync(srcFolder);
            }

            let prop = {}, dump = [], dataDir = [], startDir = [], optdir = [];

            fileReader.openFile(srcFile);

            const id = fileReader.readLong();
            const ef = fileReader.readByte();
            if(id !== 1178879751 || ef !== 239) {
                console.error('Stop: not a 2gis data file');
                return;
            }

            fileReader.readLong();
            fileReader.readLong();
            fileReader.readPackedValue();
            fileReader.readPackedValue();
            fileReader.readPackedValue();
            fileReader.readPackedValue();

            const tblLen = fileReader.readByte();
            let tbl = fileReader.readString(tblLen);
            while(tbl.length)
            {
                let len = tbl.substr(0, 1);
                len = len.charCodeAt(0);
                tbl = tbl.substr(1);

                const chunk = tbl.substr(0, len);
                tbl = tbl.substr(len);

                const {size: size, tbl: resTbl} = getPackedValue(tbl);
                tbl = resTbl;

                console.log(chunk, "0x" + size.toString(16).toUpperCase());

                startDir.push({name: chunk, size: size, offset: fileReader.getPosition()});

                let temp = fileReader.readString(size);
                const inset = ["name", "cpt", "fbn", "lang", "stat"];

                if(inset.includes(chunk)) {
                    temp = unpackWideString(temp);
                    const buf = Buffer.from(temp, 'utf8');
                    prop[chunk] = iconv.decode(buf, "utf-16le");
                    fs.appendFileSync(srcFolder + chunk, temp);
                }
            }
        });
    }
}