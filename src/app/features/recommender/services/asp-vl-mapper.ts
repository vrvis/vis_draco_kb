import { Injectable } from '@angular/core';
import { TopLevelUnitSpec } from 'vega-lite/build/src/spec/unit';

@Injectable({
  providedIn: 'root'
})
export class AspVlMapperService {

  REGEX = /(\w+)\(([\w\.\/]+)(,([\w\.]+))?\)/;

  VEGA = 'https://vega.github.io/schema/vega-lite/v4.json';

  constructor() { }

  /**
   * Convert from ASP to Vega-Lite.
   */
  asp2vl(facts: string[]): TopLevelUnitSpec<any> {
    let mark:any = '';
    let url = 'data/cars.json'; // default dataset
    const encodings = {};
    for (const value of facts) {
        // TODO: Better handle quoted fields. We currently simply remove all ".
        const cleanedValue = value.replace(/\"/g, '');
        const negSymbol = value.trim().startsWith(':-'); // TODO: remove this
        const [_, predicate, first, __, second] = this.REGEX.exec(cleanedValue);
        if (predicate === 'mark') {
            mark = first;
        }
        else if (predicate === 'data') {
            url = first;
        }
        else if (predicate !== 'soft') {
            if (!encodings[first]) {
                encodings[first] = {};
            }
            // if it contains the neg symbol, and the field is a boolean field, its value would be false
            // e.g., for the case ":- zero(e3)"
            encodings[first][predicate] = second || !negSymbol;
        }
    }
    const encoding = {};
    for (const e of Object.keys(encodings)) {
        const enc = encodings[e];
        // if quantitative encoding and zero is not set, set zero to false
        if (enc.type === 'quantitative' && enc.zero === undefined && enc.bin === undefined) {
            enc.zero = false;
        }
        const scale = {
            ...(enc.log ? { type: 'log' } : {}),
            ...(enc.zero === undefined ? {} : enc.zero ? { zero: true } : { zero: false }),
        };
        encoding[enc.channel] = {
            type: enc.type,
            ...(enc.aggregate ? { aggregate: enc.aggregate } : {}),
            ...(enc.field ? { field: enc.field } : {}),
            ...(enc.stack ? { stack: enc.stack } : {}),
            ...(enc.bin !== undefined ? (+enc.bin === 10 ? { bin: true } : { bin: { maxbins: +enc.bin } }) : {}),
            ...(Object.keys(scale).length ? { scale } : {}),
        };
    }
    return {
        $schema: this.VEGA,
        data: { url: `${url}` },
        mark,
        encoding,
    };
  }


    /**
    * Convert from Vega-Lite to ASP.
    */
    vl2asp(spec: TopLevelUnitSpec<any>): string[] {
        const facts = [`mark(${spec.mark}).`];
        if ('data' in spec && 'url' in spec.data) {
            facts.push(`data("${spec.data.url}").`);
        }
        const encoding = spec.encoding || {};
        let i = 0;
        for (const channel of Object.keys(encoding)) {
            const eid = `e${i++}`;
            facts.push(`encoding(${eid}).`);
            facts.push(`channel(${eid},${channel}).`);
            let encFieldType = null;
            let encZero = null;
            let encBinned = null;
            // translate encodings
            for (const field of Object.keys(encoding[channel])) {
                const fieldContent = encoding[channel][field];
                if (field === 'type') {
                    encFieldType = fieldContent;
                }
                if (field === 'bin') {
                    encBinned = fieldContent;
                }
                if (field === 'scale') {
                    // translate two boolean fields
                    if ('zero' in fieldContent) {
                        encZero = fieldContent.zero;
                        if (fieldContent.zero) {
                            facts.push(`zero(${eid}).`);
                        }
                        else {
                            facts.push(`:- zero(${eid}).`);
                        }
                    }
                    if ('log' in fieldContent) {
                        if (fieldContent.log) {
                            facts.push(`log(${eid}).`);
                        }
                        else {
                            facts.push(`:-log(${eid}).`);
                        }
                    }
                }
                else if (field === 'bin') {
                    if (fieldContent.maxbins) {
                        facts.push(`${field}(${eid},${fieldContent.maxbins}).`);
                    }
                    else {
                        facts.push(`${field}(${eid},10).`);
                    }
                }
                else if (field === 'field') {
                    // fields can have spaces and start with capital letters
                    facts.push(`${field}(${eid},"${fieldContent}").`);
                }
                else {
                    // translate normal fields
                    if (field !== 'bin') {
                        facts.push(`${field}(${eid},${fieldContent}).`);
                    }
                }
            }
            if (encFieldType === 'quantitative' && encZero === null && encBinned === null) {
                facts.push(`zero(${eid}).`);
            }
        }
        return facts;
    }
}
