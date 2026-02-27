import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// docxtemplater and pizzip use CommonJS exports; use createRequire for compatibility
const require = createRequire(import.meta.url);
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

/**
 * POST /api/terkovi/nda/generate
 * Generates a filled NDA .docx and streams it to the client.
 */
export const generateNDA = async (req, res) => {
  try {
    const { date, secondParty, language } = req.body;

    // Validate required fields
    if (!date || !secondParty?.crn) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Format date per language
    const parsedDate = new Date(date + 'T00:00:00');
    const fmt = (locale) => parsedDate.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
    const formattedDate =
      language === 'ENG'      ? fmt('en-GB') :
      language === 'BILINGUAL' ? fmt('en-GB') : // English date in the English column
      fmt('mk-MK');

    // Load the language-specific NDA template
    const templateFile = {
      MKD:      'nda-mkd.docx',
      ENG:      'nda-eng.docx',
      BILINGUAL: 'nda-bilingual.docx',
    }[language] ?? 'nda-bilingual.docx';

    const templatePath = path.join(
      __dirname,
      '../templates/terkovi/',
      templateFile
    );

    if (!fs.existsSync(templatePath)) {
      console.error('NDA template not found at:', templatePath);
      return res.status(500).json({ message: 'NDA template file not found on server' });
    }

    const templateContent = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(templateContent);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',   // render unrecognised tags as empty string instead of throwing
    });

    // Map fields based on language — MKD/ENG use one script; BILINGUAL provides both
    const mkd = secondParty.mkd ?? {};
    const eng = secondParty.eng ?? {};

    doc.render({
      date:                   formattedDate,
      secondPartyCRN:         secondParty.crn.trim(),
      // Single-language tags (used by MKD-only and ENG-only templates)
      secondPartyName:        language === 'ENG' ? eng.name?.trim()    : mkd.name?.trim(),
      secondPartyAddress:     language === 'ENG' ? eng.address?.trim() : mkd.address?.trim(),
      secondPartyManager:     language === 'ENG' ? eng.manager?.trim() : mkd.manager?.trim(),
      // Bilingual tags (used by two-column templates)
      secondPartyNameMkd:     mkd.name?.trim(),
      secondPartyAddressMkd:  mkd.address?.trim(),
      secondPartyManagerMkd:  mkd.manager?.trim(),
      secondPartyNameEng:     eng.name?.trim(),
      secondPartyAddressEng:  eng.address?.trim(),
      secondPartyManagerEng:  eng.manager?.trim(),
    });

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Build a safe filename
    const dateStr = date.replace(/-/g, '');
    const partyName = language === 'ENG' ? secondParty.eng?.name : secondParty.mkd?.name;
    const partySlug = (partyName ?? '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .substring(0, 30);
    const langSuffix = { MKD: 'MKD', ENG: 'ENG', BILINGUAL: 'MKD_ENG' }[language] ?? 'MKD';
    const filename = `NDA_LBFP_${partySlug}_${dateStr}_${langSuffix}.docx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    // Docxtemplater errors can be circular — extract only serializable info
    const details = error?.properties?.errors
      ? error.properties.errors.map((e) => e.message).join('; ')
      : error?.message ?? 'Unknown error';
    console.error('NDA generation error:', details);
    res.status(500).json({ message: 'Failed to generate NDA document', error: details });
  }
};
