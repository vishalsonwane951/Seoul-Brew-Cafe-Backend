import Order from "../models/order.js";

const TERMINAL_STATUSES = ["Payment Done", "Cancelled"];
const isActive = (status) => !TERMINAL_STATUSES.includes(status);

const DEFAULT_QUICK_REPLIES = [
  "Track my order",
  "Menu & prices",
  "Cafe hours & location",
  "Contact support",
  "Give feedback",
];

const formatOrderLabel = (order) =>
  `${order.orderType} • ${order.items?.length || 0} item${
    (order.items?.length || 0) === 1 ? "" : "s"
  } • ₹${order.total}`;

const formatOrderStatusReply = (order) => {
  const placedAt = new Date(order.orderPlacedAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (order.status === "Cancelled") {
    return `Your ${order.orderType} order placed on ${placedAt} was cancelled. If that wasn't intentional, please reach out to our support team.`;
  }

  if (order.status === "Payment Done") {
    return `Your ${order.orderType} order placed on ${placedAt} is complete — payment received. Thanks for ordering with Seoul Brew Cafe! ☕`;
  }

  return `Your ${order.orderType} order (placed ${placedAt}) is currently **${order.status}**. I'll keep this updated as it moves along — you can also watch it live on the Home screen.`;
};

const classifyIntent = (raw) => {
  const msg = (raw || "").toLowerCase();

  const has = (...words) => words.some((w) => msg.includes(w));

  if (has("order", "track", "status", "where is my", "my food", "my coffee"))
    return "order_status";
  if (has("cancel")) return "order_status";
  if (has("menu", "price", "cost", "item", "food", "drink")) return "menu";
  if (has("hour", "time", "open", "close", "timing")) return "hours";
  if (has("location", "address", "where are you", "direction"))
    return "location";
  if (has("contact", "support", "phone", "call", "email", "help"))
    return "contact";
  if (has("feedback", "review", "complain", "complaint", "suggestion"))
    return "feedback";
  if (has("hi", "hello", "hey")) return "greeting";
  if (has("thank")) return "thanks";

  return "unknown";
};

export const chatMessage = async (req, res) => {
  try {
    const { message, selectedOrderId } = req.body;
    const userId = req.user._id;

    if (selectedOrderId) {
      const order = await Order.findOne({
        _id: selectedOrderId,
        user: userId,
      }).lean();
      if (!order) {
        return res.json({
          reply:
            "I couldn't find that order — it may have been removed. Anything else I can help with?",
          quickReplies: DEFAULT_QUICK_REPLIES,
        });
      }
      return res.json({ reply: formatOrderStatusReply(order) });
    }

    const intent = classifyIntent(message);

    switch (intent) {
      case "order_status": {
        const orders = await Order.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        if (orders.length === 0) {
          return res.json({
            reply:
              "You haven't placed any orders yet. Want to take a look at the menu?",
            quickReplies: ["Menu & prices", "Cafe hours & location"],
          });
        }
        const active = orders.filter((o) => isActive(o.status));
        const candidates = active.length > 0 ? active : orders.slice(0, 5);

        if (candidates.length === 1) {
          return res.json({ reply: formatOrderStatusReply(candidates[0]) });
        }

        return res.json({
          reply:
            "You have more than one order on file — which one would you like me to check?",
          orderOptions: candidates.map((o) => ({
            id: o._id.toString(),
            label: formatOrderLabel(o),
            status: o.status,
            orderType: o.orderType,
            placedAt: o.orderPlacedAt,
          })),
        });
      }

      case "menu":
        return res.json({
          reply:
            "You can browse our full menu — coffees, teas, desserts and more — on the Menu tab. Everything is freshly prepared to order!",
          quickReplies: ["Track my order", "Cafe hours & location"],
        });

      case "hours":
        return res.json({
          reply:
            "We're open Monday–Friday 9 AM–10 PM and Saturday–Sunday 10 AM–8 PM. Check the Home screen for the full schedule.",
          quickReplies: ["Cafe hours & location", "Contact support"],
        });

      case "location":
        return res.json({
          reply:
            "We're located at Sinhgad Law College, Pune. You'll find the full address and directions on the Home screen.",
          quickReplies: ["Contact support"],
        });

      case "contact":
        return res.json({
          reply:
            "You can reach our team at +91 7888251550 or goodluck@cafe.com — or find both under Profile → Contact Support.",
          quickReplies: DEFAULT_QUICK_REPLIES,
        });

      case "feedback":
        return res.json({
          reply:
            "We'd love to hear it! Please share your thoughts with our team via Profile → Contact Support, or call us directly — we read every message.",
          quickReplies: ["Contact support", "Track my order"],
        });

      case "greeting":
        return res.json({
          reply:
            "Hey there! 👋 I'm the Seoul Brew Cafe assistant. What can I help you with?",
          quickReplies: DEFAULT_QUICK_REPLIES,
        });

      case "thanks":
        return res.json({
          reply: "Anytime! Enjoy your coffee ☕",
          quickReplies: DEFAULT_QUICK_REPLIES,
        });

      default:
        return res.json({
          reply: "I'm not sure I follow, but here's what I can help with:",
          quickReplies: DEFAULT_QUICK_REPLIES,
        });
    }
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({
      reply: "Something went wrong on my end — please try again in a moment.",
    });
  }
};
