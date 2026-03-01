import { Router, Request, Response } from "express";
import { getOpenAIClient } from "../services/openai";
import COMMODITY_GROUPS from "../data/commodityGroups";
import logger from "../logger";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { descriptions } = req.body as { descriptions?: unknown };

  if (
    !descriptions ||
    !Array.isArray(descriptions) ||
    descriptions.length === 0
  ) {
    return res.status(400).json({ error: "descriptions array is required" });
  }

  if (descriptions.length > 50) {
    return res
      .status(400)
      .json({ error: "descriptions array must not exceed 50 items" });
  }

  if (descriptions.some((d) => typeof d !== "string")) {
    return res.status(400).json({ error: "each description must be a string" });
  }

  const sanitizedDescriptions = (descriptions as string[]).map((d) =>
    d.slice(0, 500),
  );

  const groupsList = COMMODITY_GROUPS.map(
    (g) => `${g.id} | ${g.category} | ${g.name}`,
  ).join("\n");

  try {
    const openai = getOpenAIClient();

    logger.info("Sending commodity suggestion request to OpenAI", {
      descriptions,
    });

    const completion = await openai.chat.completions.create({
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
          content: `Item descriptions:\n${sanitizedDescriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}\n\nAvailable commodity groups (ID | Category | Name):\n${groupsList}`,
        },
      ],
    });

    const raw = completion.choices[0].message.content ?? "{}";
    logger.info("OpenAI commodity suggestion response received", {
      model: completion.model,
      usage: completion.usage,
    });

    const suggestion = JSON.parse(raw);
    res.json(suggestion);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Commodity suggestion failed", { error: message });
    res.status(500).json({ error: "Failed to suggest commodity group" });
  }
});

export default router;
