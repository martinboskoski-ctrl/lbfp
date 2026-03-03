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

// Deposit → balance map
const BALANCE_MAP = { '70': '30', '60': '40', '50': '50' };

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

/**
 * POST /api/terkovi/pl-agreement/generate
 * Generates a filled Private Label Agreement .docx and streams it to the client.
 */
export const generatePLAgreement = async (req, res) => {
  try {
    const {
      effectiveDate,
      companyName,
      companyAddress,
      companyCRN,
      companyCEO,
      customerEmail,
      customerSignatoryName,
      MOQamount,
      depositPercent,
    } = req.body;

    // Basic server-side guard — Zod handles full validation on the client
    if (!effectiveDate || !companyName || !companyCRN) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const templatePath = path.join(
      __dirname,
      '../templates/terkovi/pl-agreement.docx'
    );

    if (!fs.existsSync(templatePath)) {
      console.error('PL Agreement template not found at:', templatePath);
      return res.status(500).json({ message: 'PL Agreement template file not found on server' });
    }

    const templateContent = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(templateContent);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks:    true,
      nullGetter:    () => '', // prevent crash on unknown/unused tags
    });

    // Format date as English long form
    const parsedDate = new Date(effectiveDate + 'T00:00:00');
    const formattedDate = parsedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const deposit = String(depositPercent ?? '70');
    const balance = BALANCE_MAP[deposit] ?? '30';

    doc.render({
      effectiveDate:         formattedDate,
      companyName:           (companyName    ?? '').trim(),
      companyAddress:        (companyAddress ?? '').trim(),
      companyCRN:            (companyCRN     ?? '').trim(),
      companyCEO:            (companyCEO     ?? '').trim(),
      customerEmail:         (customerEmail  ?? '').trim(),
      customerSignatoryName: (customerSignatoryName ?? '').trim(),
      MOQamount:             String(MOQamount ?? ''),
      depositPercent:        deposit,
      balancePercent:        balance,
    });

    const buffer = doc.getZip().generate({
      type:        'nodebuffer',
      compression: 'DEFLATE',
    });

    // Build a safe filename
    const dateStr   = effectiveDate.replace(/-/g, '');
    const partySlug = (companyName ?? '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .substring(0, 30);
    const filename = `PLAgreement_${partySlug}_${dateStr}.docx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    const details = error?.properties?.errors
      ? error.properties.errors.map((e) => e.message).join('; ')
      : error?.message ?? 'Unknown error';
    console.error('PL Agreement generation error:', details);
    res.status(500).json({ message: 'Failed to generate PL Agreement document', error: details });
  }
};
