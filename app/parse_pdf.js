const fs = require('fs');
const PDFParser = require("pdf2json");

const pdfParser = new PDFParser(this, 1);

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFileSync('C:\\Users\\yraje\\.gemini\\antigravity-ide\\brain\\20407255-e375-46ea-ae22-a968cce10a9d\\scratch\\hosanna_text.txt', pdfParser.getRawTextContent());
    console.log('Successfully extracted text to hosanna_text.txt');
});

pdfParser.loadPDF('C:\\Users\\yraje\\.gemini\\antigravity-ide\\brain\\20407255-e375-46ea-ae22-a968cce10a9d\\.tempmediaStorage\\media_1787681712297.pdf');
