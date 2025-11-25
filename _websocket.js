import { WebSocketServer } from "ws";
import express from "express";
import chalk from "chalk";

const app = express();
app.use(express.json());

const SOCKET_PORT = Number(process.env.SOCKET_PORT ?? 8081);
const SOCKET_NOTIFY_PORT = Number(process.env.SOCKET_NOTIFY_PORT ?? 3001);

const wss = new WebSocketServer({ port: SOCKET_PORT });

// --- helpers de broadcast ---

function broadcastString(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    });
}

function broadcastJson(payload) {
    const message = JSON.stringify(payload);
    broadcastString(message);
}

// --- Endpoint API (Notify) ---
// endpoint interno para workers notificarem o WebSocket
app.post("/notify", (req, res) => {
    const message = req.body;
    console.log("Notify recebido:", message);
    
    if (typeof message === "string") {
        broadcastString(message);
    } else if (message) {
        broadcastJson(message);
    }

    return res.json({ ok: true });
});

app.listen(SOCKET_NOTIFY_PORT, () =>
    console.log(`- Web Notify server rodando na porta ${SOCKET_NOTIFY_PORT}`)
);

// --- WebSocket Principal ---

wss.on("connection", (ws) => {
    console.log(chalk.cyan("Cliente conectado.."));

    ws.on("message", (raw) => {
        const text = raw.toString();
        // console.log(chalk.yellow("Do client:"), text); // Descomente se quiser debugar tudo

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.log("Mensagem não é JSON válido, ignorando.");
            return;
        }

        // 1. Cliente entrou no chat (JOIN)
        if (data.type === "join" && data.name) {
            ws.userName = data.name; // Salva no contexto do socket
            broadcastJson({
                type: "system",
                text: `${data.name} entrou no chat`,
                timestamp: new Date().toISOString()
            });
            return;
        }

        // 2. Mensagem de texto (MESSAGE)
        if (data.type === "message" && data.text) {
            broadcastJson({
                type: "message",
                // Usa o nome enviado ou o salvo no socket, ou 'Anônimo'
                name: data.name || ws.userName || 'Anônimo', 
                text: data.text,
                timestamp: new Date().toISOString()
            });
            return;
        }

        // 3. Reação Rápida (REACTION) - NOVO
        if (data.type === "reaction" && data.content) {
            console.log(chalk.magenta(`Reação recebida de ${data.name || ws.userName}: ${data.content}`));
            broadcastJson({
                type: "reaction",
                name: data.name || ws.userName || 'Anônimo',
                content: data.content, // Ex: '👍 Aprovado'
                timestamp: new Date().toISOString()
            });
            return;
        }

        console.log("Tipo de mensagem desconhecido:", data);
    });

    ws.on("close", () => {
        console.log(chalk.gray("Cliente desconectado."));
        if (ws.userName) {
            broadcastJson({
                type: "system",
                text: `${ws.userName} saiu do chat`,
                timestamp: new Date().toISOString()
            });
        }
    });
});

console.log(
    chalk.greenBright(`WebSocket rodando na porta ${SOCKET_PORT}...`)
);
