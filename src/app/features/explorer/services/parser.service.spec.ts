import { TestBed } from '@angular/core/testing';

import { ParserService } from './parser.service';
import { constraints } from 'draco-core';

describe('ParserService', () => {
  let service: ParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  
  it('#getAST should return valid ast for define asp rules',
    (done: DoneFn) => {
      
    const asp = constraints.DEFINE;

    console.time('ast'+ asp.length)
    const ast = service.getAST(asp);
    console.timeEnd('ast'+ asp.length);
    console.log(ast);
    
    expect(ast).toBeDefined();
    done();
  });
  
  it('#getAST should return valid ast for hard asp constraints',
    (done: DoneFn) => {
      
    const asp = constraints.HARD;
    
    console.time('ast'+ asp.length)
    const ast = service.getAST(asp);
    console.timeEnd('ast'+ asp.length);
    console.log(ast);
    
    expect(ast).toBeDefined();
    done();
  });
  
  it('#getAST should return valid ast for soft asp constraints',
    (done: DoneFn) => {
      
    const asp = constraints.SOFT;

    console.time('ast'+ asp.length)
    const ast = service.getAST(asp);
    console.timeEnd('ast'+ asp.length);
    console.log(ast);
    
    expect(ast).toBeDefined();
    expect(ast?.errors).toHaveSize(0);
    done();
  });
  
  it('#getAST should return valid ast for asp vega-lite generate',
    (done: DoneFn) => {
      
    const asp = constraints.GENERATE;

    console.time('ast'+ asp.length)
    const ast = service.getAST(asp);
    console.timeEnd('ast'+ asp.length);
    console.log(ast);
    
    expect(ast).toBeDefined();
    expect(ast?.errors).toHaveSize(0);
    done();
  });
});
