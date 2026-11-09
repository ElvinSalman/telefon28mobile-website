import {test,expect} from '@playwright/test';
import {Workbook} from 'exceljs';
import {parseSimpleSheet,simpleColumns,categoryGuess,importIdentity} from '../lib/simple-import';
const headers=simpleColumns.join(',');
const csv=(rows:string)=>new File([headers+'\n'+rows],'qa.csv');
test('six-column CSV/XLSX Unicode, cents, variants and exact errors',async()=>{
 const row='iPhone QA,123.45,Yeni Ə Brend,128 GB,Qara,Təsvir';
 const parsed=await parseSimpleSheet(csv(row));expect(parsed[0]).toMatchObject({price:123.45,category:'phone',brand:'Yeni Ə Brend'});
 const book=new Workbook(),sheet=book.addWorksheet('Məhsullar');sheet.addRow([...simpleColumns]);sheet.addRow(['iPhone QA','123,45','Yeni Ə Brend','128 GB','Qara','Təsvir']);book.addWorksheet('Təlimat').addRow(['fictional']);
 expect(await parseSimpleSheet(new File([new Uint8Array(await book.xlsx.writeBuffer())],'qa.xlsx'))).toEqual(parsed);
 for(const [value,pattern] of [[row+'\n'+row,/Sətir 3/],['iPhone,12.345,Apple,,,',/sütun 2/],['iPhone,,Apple,,,',/sütun 2/],['iPhone,12,,,,',/sütun 3/],['\n'+row+'\nphone,abc,Apple,,,',/Sətir 4/]] as const)await expect(parseSimpleSheet(csv(value))).rejects.toThrow(pattern);
 expect(await parseSimpleSheet(csv(row+'\niPhone QA,123.45,yeni ə brend,256 GB,Qara,'))).toHaveLength(2);
 expect(importIdentity({...parsed[0],brand:' YENİ Ə BREND '})).toBe(importIdentity(parsed[0]));
 expect(categoryGuess('Unknown QA').slug).toBe('');
 for(const [name,slug] of [['iPad','tablet'],['MacBook','laptop'],['Apple Watch','watch'],['AirPods','audio'],['PlayStation','gaming'],['Dyson dryer','home-appliances']])expect(categoryGuess(name).slug).toBe(slug);
 await expect(parseSimpleSheet(csv(Array.from({length:201},(_,i)=>`iPhone ${i},12,Apple,,,`).join('\n')))).rejects.toThrow('1–200');
 sheet.getCell('B2').value={formula:'1+1',result:2};await expect(parseSimpleSheet(new File([new Uint8Array(await book.xlsx.writeBuffer())],'formula.xlsx'))).rejects.toThrow('Sətir 2, sütun 2');
 await expect(parseSimpleSheet(new File(['bad'],'bad.xlsx'))).rejects.toThrow();
});


