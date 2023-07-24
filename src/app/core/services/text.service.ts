import {Injectable} from '@angular/core';

/**
 * Interface for dimensions of a node
 */
interface IDimension {
  /** Width of node */
  width: number;

  /** Height of node */
  height: number;
}

/**
* Class declaraiton for injectable TextService class  
*/
@Injectable({
  providedIn: 'root'
})
export class TextService {

  /** Standard font family */
  font_family = 'sans-serif';

  /** Standard font size */
  font_size = '14px';

  /** Standard font weight */
  font_weight = '400';
  
  /** Standard font stitched */
  font = this.font_weight + ' ' + this.font_size + ' ' + this.font_family;

  /**
   * Constructor text service
   */
  constructor() {
  }

  /**
   * Uses canvas.measureText to compute and return the width of the given text.
   *
   * @param {String} _text text from which widht and height should be computed
   * @param {Number} _size size of the text
   * @param {Number} _weight weight of the text
   * @param {String} _font font family of the text
   * @returns {IDimension} dimensions of the text
   *
   * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
   */
  getTextDimension(_text: string, _size?: number, _weight?: number, _font?: string): IDimension {
    //console.log(...arguments);
    let font = (_weight ? _weight : '' + this.font_weight) + ' ' + (_size ? _size + 'px' : this.font_size) + ' ' + (_font ? _font : this.font_family);
    // @ts-ignore
    let canvas = this.getTextDimension.canvas || (this.getTextDimension.canvas = document.createElement('canvas') as HTMLCanvasElement);
    let context = canvas.getContext('2d');
    context.font = font;
    let metrics = context.measureText(_text);
    console.log(metrics);
    return {width: metrics.width, height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent};
  }

  /**
   * Uses svg to compute and return the width and height of the given text.
   *
   * @param {String} _text text from which widht and height should be computed
   * @param {Number} _size size of the text
   * @param {Number} _weight weight of the text
   * @param {String} _font font family of the text
   * @returns {IDimension} dimensions of the text
   *
   * @see https://stackoverflow.com/questions/1636842/svg-get-text-element-width
   */
  getSVGTextDimension(_text: string, _size?: number, _weight?: number, _font?: string) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svg.appendChild(text);

    document.body.appendChild(svg);

    text.setAttributeNS(null, 'font-family', _font ? _font : this.font_family);
    text.setAttributeNS(null, 'font-size', _size ? _size + 'px' : this.font_size);
    text.setAttributeNS(null, 'font-weight', '' + (_weight ? _weight : this.font_weight));
    text.innerHTML = _text;
    let svgRect = text.getBBox();

    document.body.removeChild(svg);

    return {width: svgRect.width, height: svgRect.height};
  }

  /**
   * Shortens a text to a given length
   * @param text text to be shortened
   * @param length length of how long the text should max be
   * @returns {string} shortened text
   */
  shortenText(text: string, length: number): string {
    let points = text.length > length ? '...' : '';
    return text.substr(0, length) + points;
  }
}
