import { Injectable } from '@angular/core';

/**
 * Inferface for an rgb object should look like
 */
export interface IRGBScheme {
  /** Red channel */
  red: number;

  /** Green channel */
  green: number;

  /** Blue channel */
  blue: number;
}

/**
* Class declaraiton for injectable ColorService class
*/
@Injectable({
  providedIn: 'root'
})
export class ColorService {

  /**
   * Constructor color service
   */
  constructor() { }

  /**
   * Builds and returns the complementary color of a given rgb color
   * @param {IRGBScheme} rgb input on which the complementary should be built
   * @returns {IRGBScheme} complimentary color of rgb input
   */
  getComplementaryColor(rgb: IRGBScheme): IRGBScheme {
    return { red: 255 - rgb.red, green: 255 - rgb.green, blue: 255 - rgb.blue };
  }

  /**
   * Builds and return foreground color for a given rgb color
   * @param {IRGBScheme} rgb input on which the foreground should be built
   * @param {IRGBScheme} difference the value to be added or subtracted to get foreground color
   * @returns {IRGBScheme} foreground color for rgb input
   */
  getForegroundColor(rgb: IRGBScheme, difference: number = 100): IRGBScheme {
    let mid = (rgb.red + rgb.green + rgb.blue) / 3;
    let boundary = 125;
    return { red: mid < boundary ? this.trimColor(rgb.red + difference) : this.trimColor(rgb.red - difference), green: mid < boundary ? this.trimColor(rgb.green + difference) : this.trimColor(rgb.green - difference), blue: mid < boundary ? this.trimColor(rgb.blue + difference) : this.trimColor(rgb.blue - difference) };
  }

  /**
   * Trim color value to get value between 0 and 255
   * @param value to trim
   * @returns color value between 0 and 255
   */
  private trimColor(value: number) {
    return value >= 255 ? 255 : (value < 0 ? 0 : value);
  }

  getForgroundColorFromStringToString(rgb_string: string, difference: number = 100): string {
    const color: IRGBScheme = this.getRGBFromString(rgb_string);
    const forground: IRGBScheme = this.getForegroundColor(color, difference);
    return this.toString(forground);
  }

  /**
   * Parses an rgb string and returns an rgb color following the interface @{IRGBScheme}
   * @param {string} rgb_string input string
   * @return {IRGBScheme} rgb color from string input
   */
  getRGBFromString(rgb_string: string): IRGBScheme {
    rgb_string = rgb_string.replace(/rgb/g,'');
    rgb_string = rgb_string.replace(/rgb /g,'');
    rgb_string = rgb_string.replace(/ /g,'');
    rgb_string = rgb_string.replace(/\(/g,'');
    rgb_string = rgb_string.replace(/\)/g,'');
    let rgb = rgb_string.split(',');
    return { red: +rgb[0], green: +rgb[1], blue: +rgb[2] };
  }

  /**
   * Builds and return a string of an rgb color as input
   * @param {IRGBScheme} rgb color
   * @returns {string} rgb color as string in form of rgb(X,Y,Z)
   */
  toString(rgb: IRGBScheme): string {
    return `rgb(${rgb.red},${rgb.green},${rgb.blue})`;
  }
}
