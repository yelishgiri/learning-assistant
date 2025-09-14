require("dotenv").config();
const prisma = require("../lib/prisma");
const path = require("path");
const fs = require("fs");
const Anthropic = require("@anthropic-ai/sdk");

const generateSummary = async (req, res) => {
  try {
    console.log('Generate summary request for file ID:', req.params.id);
    const fileId = Number(req.params.id);
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      console.log('File not found:', fileId);
      return res.status(404).send("Study material not found");
    }
    
    const filePath = path.join(__dirname, "../uploads", file.path);
    if (!fs.existsSync(filePath)) {
      console.log('File missing on server:', filePath);
      return res.status(404).send("Study material missing on server");
    }

    console.log('Reading file content from:', filePath);
    const fileContent = fs.readFileSync(filePath, "utf8");
    
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not set');
      return res.status(500).send("AI service not configured");
    }
    
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

    console.log(`Processing ${chunks.length} chunks for file: ${file.name}`);
    let chunkSummaries = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      // Add a timeout for each Claude call (60s)
      const msg = await Promise.race([
        anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: `Summarize this study material chunk (${i + 1}/${chunks.length}):\n\n${chunks[i]}`,
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
      console.log('Combining chunk summaries into final summary');
      const finalMsg = await Promise.race([
        anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: `Combine and summarize these study material summaries into a single summary:\n\n${summary}`,
            },
          ],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Claude API timeout')), 60000))
      ]);
      summary = finalMsg.content?.[0]?.text || finalMsg.completion || summary;
    }
    
    console.log('Saving summary to database');
    await prisma.file.update({ where: { id: fileId }, data: { summary } });
    console.log('Summary generated successfully');
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
