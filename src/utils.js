const getPackedValue = (tbl) => {
    let size = tbl.substr(0, 1);
    size = size.charCodeAt(0);
    tbl = tbl.substr(1);

    if(size >= 0xF0) {
        let size1 = tbl.substr(0, 1);
        size1 = size1.charCodeAt(0);
        tbl = tbl.substr(1);

        let size2 = tbl.substr(0, 1);
        size2 = size2.charCodeAt(0);
        tbl = tbl.substr(1);

        let size3 = tbl.substr(0, 1);
        size3 = size3.charCodeAt(0);
        tbl = tbl.substr(1);

        let size4 = tbl.substr(0, 1);
        size4 = size4.charCodeAt(0);
        tbl = tbl.substr(1);

        return {tbl: tbl, size: ((size1<<24)|(size2<<16)|(size3<<8)|size4)};
    }

    if(size >= 0xE0) {
        let size2 = tbl.substr(0, 1);
        size2 = size2.charCodeAt(0);
        tbl = tbl.substr(1);

        let size3 = tbl.substr(0, 1);
        size3 = size3.charCodeAt(0);
        tbl = tbl.substr(1);

        let size4 = tbl.substr(0, 1);
        size4 = size4.charCodeAt(0);
        tbl = tbl.substr(1);

        return {tbl: tbl, size: (((size^0xE0)<<24)|(size2<<16)|(size3<<8)|size4)};
    }

    if(size >= 0xC0) {
        let size3 = tbl.substr(0, 1);
        size3 = size3.charCodeAt(0);
        tbl = tbl.substr(1);

        let size4 = tbl.substr(0, 1);
        size4 = size4.charCodeAt(0);
        tbl = tbl.substr(1);

        return {tbl: tbl, size: (((size^0xC0)<<16)|(size3<<8)|size4)};
    }

    if((size & 0x80) !== 0) {
        let size4 = tbl.substr(0, 1);
        size4 = size4.charCodeAt(0);
        tbl = tbl.substr(1);

        return {tbl: tbl, size: (((size^0x80)<<8)|size4)};
    }

    return {tbl: tbl, size: size};
};

const unpackWideString = (str) => {
    const {size: size1, tbl: resStr1} = getPackedValue(str);
    const {size: size2, tbl: resStr2} = getPackedValue(resStr1);

    let resStr3 = resStr2;

    let z = '';
    for(let i = 0; i < size2; i++) {
        z += resStr3.substr(0,1);
        z += '\0';
        resStr3 = resStr3.substr(1);
    }

    if(resStr3.length) {
        const arr = [];

        let mcount = resStr3.substr(0,1);
        mcount = mcount.charCodeAt(0);
        resStr3 = resStr3.substr(1);

        for(let i = 0; i < mcount; i++) {
            let v = resStr3.substr(0,1);
            v = v.charCodeAt(0);
            resStr3 = resStr3.substr(1);
            arr.push(v);
        }

        let iter = 0;
        while(resStr3.length)
        {
            let v = resStr3.substr(0,1);
            v = v.charCodeAt(0);
            resStr3 = resStr3.substr(1);
            const count = Math.floor(v / mcount);
            const offset = v % mcount;

            if(count === 0) {
                const l = z.length;
                for(let i = iter; i < l; i += 2) {
                    z = setCharAt(z, i + 1, String.fromCharCode(arr[offset]));
                }
            } else {
                for(let i = 0; i < count; i++) {
                    z = setCharAt(z, iter + 1, String.fromCharCode(arr[offset]));
                    iter += 2;
                }
            }
        }
    }

    return z;
};

const setCharAt = (str, index, chr) => {
    if(index > str.length-1) {
        return str;
    }

    return str.substr(0, index) + chr + str.substr(index + 1);
};

const uint8ToString = (buffer) => {
    const CHUNK_SZ = 0x8000;
    const c = [];
    for (let i = 0; i < buffer.length; i+=CHUNK_SZ) {
        c.push(String.fromCharCode.apply(null, buffer.subarray(i, i + CHUNK_SZ)));
    }
    return c.join('');
};

export {
    getPackedValue,
    unpackWideString,
    uint8ToString
}