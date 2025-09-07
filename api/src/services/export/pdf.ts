import { ExportData } from '../exportService';
import { generateHTML } from './template';

export const generatePDF = async (data: ExportData): Promise<Buffer> => {
  try {
    const puppeteerModule: any = await import('puppeteer');
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROMIUM_PATH;
    const browser = await puppeteerModule.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      protocolTimeout: 60000,
      ...(executablePath ? { executablePath } : {})
    });

    const page = await browser.newPage();
    const html = await generateHTML(data);

    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });

    await browser.close();
    return Buffer.from(pdf);
  } catch (error) {
    console.error('PDF generation error:', error);
    const msg = error instanceof Error && /Cannot find module|ERR_MODULE_NOT_FOUND/.test(error.message)
      ? 'PDF generation requires puppeteer to be installed. Please install it to enable this feature.'
      : (error instanceof Error ? error.message : 'Unknown error');
    throw new Error(`PDF generation failed: ${msg}`);
  }
}
