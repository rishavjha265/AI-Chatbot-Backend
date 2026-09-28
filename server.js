 const app = require("./src/app");
const { createServer } = require("http");
const { Server } = require("socket.io");
const generateResponse = require("./src/service/ai.service.js");

const httpServer = createServer(app);
const io = new Server(httpServer);

io.on("connection", (socket) => {
  console.log("A user connected");

  const chatHistory = [];

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  socket.on("ai-message", async (data) => {
    try {
      console.log("Received AI message:", data);

      chatHistory.push({
        role: "user",
        parts: [{ text: data }],
      });

      const response = await generateResponse(chatHistory);

      chatHistory.push({
        role: "model",
        parts: [{ text: response }],
      });

      socket.emit("ai-message-response", {
        response,
      });
    } catch (error) {
      console.error(error);

      if (error.status === 429) {
        socket.emit("ai-message-response", {
          response:
            "⚠️ Gemini API quota exceeded. Please try again later or use a new API key.",
        });
      } else {
        socket.emit("ai-message-response", {
          response: "Something went wrong!",
        });
      }
    }
  });
});

httpServer.listen(3000, () => {
  console.log("Server is running on port 3000");
});