import express from "express";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const sqs = new SQSClient({ region: process.env.AWS_REGION });
const QUEUE_URL = process.env.QUEUE_URL;

app.post("/input", async (req, res) => {
  const msg = req.body;
  try {
    await sqs.send(new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(msg),
    }));
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao enviar SQS:", err);
    res.status(500).json({ error: "Erro SQS" });
  }
});

app.listen(3000, () => console.log("✅ API rodando na porta 3000"));
