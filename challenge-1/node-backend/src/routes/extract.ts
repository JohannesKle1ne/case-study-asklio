import { Router, Request, Response } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { getOpenAIClient } from "../services/openai";
import COMMODITY_GROUPS from "../data/commodityGroups";
import logger from "../logger";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded" });
  }

  try {
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract text from PDF" });
    }
    logger.info("Sending PDF text to OpenAI for extraction", {
      chars: text.length,
    });

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a procurement data extraction assistant. Extract structured procurement information from vendor offer documents.
Return a JSON object with exactly this structure (use null for missing fields):
{
  "vendor_name": string | null,
  "vat_id": string | null,
  "subtotal_net": number | null,
  "surcharges": [
    {
      "label": string,
      "amount": number
    }
  ],
  "requestor_department": string | null,
  "total_cost": number | null,
  "order_lines": [
    {
      "position_description": string,
      "unit_price": number,
      "amount": number,
      "unit": string,
      "total_price": number
    }
  ]
}
For "vendor_name", extract the name of the company or person who ISSUED the offer (the seller/supplier). Key signals: the issuer's name appears near fields like "Angebots-Nr.", "Angebot", document date, contact person, phone/email of the sender, company registration (HR-Nr., HRB), and bank details (IBAN/BIC). The RECIPIENT (buyer) typically appears at the very top of the document as the delivery/billing address — do NOT use that name. Example: if a document starts with "Lio Technologies GmbH, Agnes-Pockels-Bogen 1..." as the address block, but is signed/issued by "styleGREEN / FlowerArt GmbH" with their IBAN and HR number, then "FlowerArt GmbH" is the vendor_name.
For "unit", infer from context (e.g. "licenses", "units", "pieces", "months", "hours").
For "requestor_department", extract the internal department of the buying organization that requested this offer (e.g. "Marketing Department", "IT Department"). This must be a specific department name, NOT a company name. If no department is explicitly mentioned, return null.
For "vat_id", extract the VAT ID (Umsatzsteuer-Identifikationsnummer) of the vendor/issuer, not the buyer.
For "subtotal_net", extract the net sum of order line positions (e.g. "Positionen netto", "Nettosumme", "Zwischensumme") as a number.
For "surcharges", extract any additional costs shown in the document summary that are NOT order line items. This includes shipping/freight costs (e.g. "Versandkosten netto"), taxes (e.g. "USt. 19%", "MwSt."), copyright levies, or any other surcharges. Use the label exactly as shown in the document. Do NOT include alternative positions (marked as "Alt." or "Alternativ").
For "total_cost", extract the final gross total (e.g. "Endsumme", "Gesamtsumme", "Gesamtsumme (EUR)").
For "order_lines", only include actual purchasable positions. Skip alternative/optional positions (marked as "Alt.", "Alternativ zu", or similar).
Only include fields you are confident about. Return empty array for order_lines and surcharges if none found.`,
        },
        {
          role: "user",
          content: `Extract procurement information from this vendor offer. The document may start with the RECIPIENT's address at the top — that company is the buyer, not the vendor. The vendor is the company that wrote and sent this offer, identifiable by their own contact details, registration numbers, and bank information embedded in the document.\n\n${text}`,
        },
      ],
    });

    const raw = completion.choices[0].message.content ?? "{}";
    logger.info("OpenAI extraction response received", {
      model: completion.model,
      usage: completion.usage,
    });

    const extracted = JSON.parse(raw);

    const orderDescriptions: string[] = (extracted.order_lines ?? [])
      .map(
        (l: { position_description?: string }) => l.position_description ?? "",
      )
      .filter(Boolean);

    let commodity = null;
    if (orderDescriptions.length > 0) {
      const groupsList = COMMODITY_GROUPS.map(
        (g) => `${g.id} | ${g.category} | ${g.name}`,
      ).join("\n");

      try {
        const commodityCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are a procurement classification assistant. Given a list of item descriptions from a procurement request, determine the single best matching commodity group from the provided list.
Return a JSON object with this structure:
{
  "commodity_group_id": string,
  "commodity_group_name": string,
  "category": string,
  "reasoning": string
}
Base your decision on the PRIMARY items being procured. Ancillary lines like shipping or delivery fees are common but should not drive the classification — only choose a logistics/shipping group if the entire request is fundamentally about transportation.`,
            },
            {
              role: "user",
              content: `Item descriptions:\n${orderDescriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}\n\nAvailable commodity groups (ID | Category | Name):\n${groupsList}`,
            },
          ],
        });
        logger.info("OpenAI commodity suggestion response received", {
          model: commodityCompletion.model,
          usage: commodityCompletion.usage,
        });
        commodity = JSON.parse(
          commodityCompletion.choices[0].message.content ?? "{}",
        );
      } catch (commodityErr) {
        logger.error("Commodity suggestion failed during extraction", {
          error:
            commodityErr instanceof Error
              ? commodityErr.message
              : "Unknown error",
        });
      }
    }

    res.json({ ...extracted, commodity_suggestion: commodity });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Only PDF files are allowed") {
      return res.status(400).json({ error: message });
    }
    logger.error("PDF extraction failed", { error: message });
    res.status(500).json({ error: "Failed to extract data from document" });
  }
});

export default router;
