require("dotenv").config();
const prisma = require("../lib/prisma");
const path = require("path");
const fs = require("fs");
const Anthropic = require("@anthropic-ai/sdk");

const generateSummary = async (req, res) => {
  const fileId = Number(req.params.id);
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return res.status(404).send("File not found");
  const filePath = path.join(__dirname, "../uploads", file.path);
  if (!fs.existsSync(filePath))
    return res.status(404).send("File missing on server");

  const fileContent = fs.readFileSync(filePath, "utf8");
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Chunking logic
  const CHUNK_SIZE = 30000; // characters per chunk (safe for Claude)
  const MAX_CHUNKS = 10; // up to 300k chars
  let chunks = [];
  for (
    let i = 0;
    i < fileContent.length && chunks.length < MAX_CHUNKS;
    i += CHUNK_SIZE
  ) {
    chunks.push(fileContent.slice(i, i + CHUNK_SIZE));
  }

  try {
    let chunkSummaries = [];
    for (let i = 0; i < chunks.length; i++) {
      // Add a timeout for each Claude call (60s)
      const msg = await Promise.race([
        anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: `Summarize this assignment chunk (${i + 1}/${chunks.length}):\n\n${chunks[i]}`,
            },
          ],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Claude API timeout')), 60000))
      ]);
      chunkSummaries.push(msg.content?.[0]?.text || msg.completion || "");
    }
    let summary = chunkSummaries.join("\n");
    // If more than one chunk, summarize the summaries
    if (chunkSummaries.length > 1) {
      const finalMsg = await Promise.race([
        anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: `Combine and summarize these assignment summaries into a single summary:\n\n${summary}`,
            },
          ],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Claude API timeout')), 60000))
      ]);
      summary = finalMsg.content?.[0]?.text || finalMsg.completion || summary;
    }
  await prisma.file.update({ where: { id: fileId }, data: { summary } });
  res.redirect(`/folder/${file.folderId}/details`);
  } catch (e) {
    console.error('Claude summary error:', e);
    res.status(500).send("Error generating summary. " + (e && e.message ? e.message : ''));
  }
};


const getSummary = async (req, res) => {
  const fileId = Number(req.params.id);
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file || !file.summary) return res.status(404).send("Summary not found");
  res.render("file/summary", { file });
};

module.exports = { generateSummary, getSummary };
