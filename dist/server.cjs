var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path = __toESM(require("path"), 1);
var import_ws = require("ws");
var import_vite = require("vite");
var app = (0, import_express.default)();
var server = import_http.default.createServer(app);
var PORT = 3e3;
app.use(import_express.default.json());
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: Date.now() });
});
var SERVER_MISSIONS = [
  {
    id: "stairway_laser_chase",
    title: "Staircase Red Dot Interceptor",
    icon: "\u{1F534}",
    category: "Agility",
    description: "Intercept the erratic dancing laser beam racing along the grand staircase.",
    objective: "Pounce or jump onto the red laser dot 3 times!",
    targetRoom: "Grand Staircase",
    targetPosition: { x: -24, y: 1, z: 36 },
    targetCount: 3,
    currentCount: 0,
    durationSeconds: 900,
    // 15 mins
    secondsLeft: 900,
    rewardCred: 850,
    completed: false,
    flavorQuote: '"That red dot thinks it owns the mansion. Prove it wrong."',
    hint: "Sprint up the staircase and time your jump [SPACE] or dash [SHIFT] directly onto the beam!"
  },
  {
    id: "dining_table_heist",
    title: "Grand Banquet Heist",
    icon: "\u{1F357}",
    category: "Heist",
    description: "Climb onto the 20-meter mahogany banquet table and snatch delicious gourmet snacks.",
    objective: "Steal the golden roast chicken leg & salmon platter!",
    targetRoom: "Dining Room",
    targetPosition: { x: 24, y: 2.3, z: 18 },
    targetCount: 2,
    currentCount: 0,
    durationSeconds: 900,
    secondsLeft: 900,
    rewardCred: 1200,
    completed: false,
    flavorQuote: '"Humans call it fine dining. Cats call it complimentary buffet."',
    hint: "Leap from the dining chairs to scale the high tabletop runner without getting spotted!"
  },
  {
    id: "glass_gravity_knocker",
    title: "Newtonian Gravity Inspector",
    icon: "\u{1F95B}",
    category: "Chaos",
    description: "Verify physics laws by swatting fragile crystal drinking glasses off the kitchen counter.",
    objective: "Knock over 3 crystal glasses perched along the marble counter edge!",
    targetRoom: "Gourmet Kitchen",
    targetPosition: { x: 24, y: 2.4, z: -18 },
    targetCount: 3,
    currentCount: 0,
    durationSeconds: 900,
    secondsLeft: 900,
    rewardCred: 950,
    completed: false,
    flavorQuote: '"It was standing too securely. Balance must be restored."',
    hint: "Climb the kitchen island prep counter and walk directly into the glassware to push them off."
  },
  {
    id: "bathroom_mummy_roll",
    title: "Toilet Paper Mummy Spooler",
    icon: "\u{1F9FB}",
    category: "Chaos",
    description: "Rapidly swat and unravel the premium luxury 3-ply toilet paper roll.",
    objective: "Swat the toilet paper roll 5 times to create a decorative paper trail!",
    targetRoom: "Marble Bathroom",
    targetPosition: { x: 10, y: 1.9, z: -48 },
    targetCount: 5,
    currentCount: 0,
    durationSeconds: 900,
    secondsLeft: 900,
    rewardCred: 750,
    completed: false,
    flavorQuote: '"This luxury bathroom lacks artistic streamers. Let me fix that."',
    hint: "Approach the chrome stand in the bathroom and press [5] or trigger Banter Mischief to swat!"
  },
  {
    id: "warm_laptop_keyboard_nap",
    title: "Thermal Keyboard Saboteur",
    icon: "\u{1F4BB}",
    category: "Cuteness",
    description: "Park your warm fluffy feline body directly across the homeowner's glowing laptop keyboard.",
    objective: "Loaf across the glowing keyboard for 4 seconds while the human works!",
    targetRoom: "Master Bedroom",
    targetPosition: { x: -22, y: 1.85, z: -38 },
    targetCount: 4,
    currentCount: 0,
    durationSeconds: 900,
    secondsLeft: 900,
    rewardCred: 1100,
    completed: false,
    flavorQuote: `"If it wasn't meant for sitting, why is it made of pure warm."`,
    hint: "Hop onto the study desk and hold [SPACE] for Loaf mode or press [3] to Purr loudly."
  },
  {
    id: "robo_vacuum_rodeo",
    title: "Roomba Rodeo Master",
    icon: "\u{1F916}",
    category: "Agility",
    description: "Leap on top of the roaming robotic vacuum and surf across the living room.",
    objective: "Ride atop the autonomous Roomba cleaner for 4 continuous seconds!",
    targetRoom: "Living Room",
    targetPosition: { x: 22, y: 0.15, z: 10 },
    targetCount: 4,
    currentCount: 0,
    durationSeconds: 900,
    secondsLeft: 900,
    rewardCred: 1350,
    completed: false,
    flavorQuote: `"I don't walk through the house. The house drives me."`,
    hint: "Time a jump [SPACE] onto the moving robot cleaner to mount it. Press jump again to dismount!"
  },
  {
    id: "curtain_climber_bat",
    title: "Grand Velvet Curtain Scaler",
    icon: "\u{1F9D7}",
    category: "Stealth",
    description: "Climb 8 meters up the royal purple living room curtains to reach the ceiling apex.",
    objective: "Climb high up the living room curtains to the safety perches!",
    targetRoom: "Living Room",
    targetPosition: { x: -58, y: 6, z: 0 },
    targetCount: 1,
    currentCount: 0,
    durationSeconds: 900,
    secondsLeft: 900,
    rewardCred: 900,
    completed: false,
    flavorQuote: '"Curtains are just vertical carpets created for feline ascendance."',
    hint: "Sprint into the large purple window curtains on the west wall and hold [W] to climb up high!"
  }
];
var rooms = /* @__PURE__ */ new Map();
function pickRandomMission() {
  const tpl = SERVER_MISSIONS[Math.floor(Math.random() * SERVER_MISSIONS.length)];
  return {
    ...tpl,
    currentCount: 0,
    secondsLeft: tpl.durationSeconds,
    completed: false
  };
}
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      clients: /* @__PURE__ */ new Map(),
      sharedMission: pickRandomMission(),
      missionTimer: 900,
      isKissHuntActive: false,
      kissHuntTimer: 0,
      availableSlots: [1, 2, 3, 4]
    });
  }
  return rooms.get(roomId);
}
function broadcastToRoom(room, msg, excludeClientId) {
  const jsonStr = JSON.stringify(msg);
  room.clients.forEach((client) => {
    if (client.id !== excludeClientId && client.ws.readyState === import_ws.WebSocket.OPEN) {
      client.ws.send(jsonStr);
    }
  });
}
var wss = new import_ws.WebSocketServer({ server });
wss.on("connection", (ws, req) => {
  const urlParams = new URLSearchParams(req.url?.split("?")[1] || "");
  const roomId = (urlParams.get("room") || "default_room").toUpperCase();
  const clientId = "player_" + Math.random().toString(36).substring(2, 9);
  const room = getOrCreateRoom(roomId);
  if (room.clients.size >= 4) {
    ws.send(JSON.stringify({ type: "room_full", message: "Room already has maximum 4 feline players!" }));
    ws.close();
    return;
  }
  const assignedSlot = room.availableSlots.shift() || 1;
  const newClient = {
    ws,
    id: clientId,
    roomId,
    slot: assignedSlot,
    name: `Cat Operative #${assignedSlot}`,
    catId: assignedSlot === 1 ? "orange_gangster" : assignedSlot === 2 ? "black_ninja" : assignedSlot === 3 ? "sassy_tabby" : "brawler_calico",
    position: { x: -14 + (assignedSlot - 1) * 3, y: 0.4, z: 6 + (assignedSlot - 1) * 2 },
    rotation: Math.PI,
    action: "idle",
    currentExpression: "happy_purr",
    isLoafing: false,
    isClimbing: false,
    isDashing: false,
    isMicActive: true,
    isSpeaking: false,
    ping: 12,
    lastPingTime: Date.now()
  };
  room.clients.set(clientId, newClient);
  const existingPlayers = Array.from(room.clients.values()).map((c) => ({
    id: c.id,
    slot: c.slot,
    name: c.name,
    catId: c.catId,
    customization: c.customization,
    position: c.position,
    rotation: c.rotation,
    action: c.action,
    currentExpression: c.currentExpression,
    isLoafing: c.isLoafing,
    isClimbing: c.isClimbing,
    isDashing: c.isDashing,
    isMicActive: c.isMicActive,
    isSpeaking: c.isSpeaking,
    ping: c.ping,
    lastUpdate: Date.now()
  }));
  ws.send(
    JSON.stringify({
      type: "init_state",
      myId: clientId,
      mySlot: assignedSlot,
      roomId: room.id,
      players: existingPlayers,
      sharedMission: room.sharedMission,
      isKissHuntActive: room.isKissHuntActive,
      kissHuntTimer: room.kissHuntTimer
    })
  );
  broadcastToRoom(
    room,
    {
      type: "player_joined",
      player: {
        id: clientId,
        slot: assignedSlot,
        name: newClient.name,
        catId: newClient.catId,
        customization: newClient.customization,
        position: newClient.position,
        rotation: newClient.rotation,
        action: newClient.action,
        currentExpression: newClient.currentExpression,
        isLoafing: newClient.isLoafing,
        isClimbing: newClient.isClimbing,
        isDashing: newClient.isDashing,
        isMicActive: newClient.isMicActive,
        isSpeaking: newClient.isSpeaking,
        ping: newClient.ping,
        lastUpdate: Date.now()
      }
    },
    clientId
  );
  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      if (data.type === "update_profile") {
        if (data.name) newClient.name = data.name;
        if (data.catId) newClient.catId = data.catId;
        if (data.customization) newClient.customization = data.customization;
        broadcastToRoom(room, {
          type: "player_profile_updated",
          id: clientId,
          name: newClient.name,
          catId: newClient.catId,
          customization: newClient.customization
        });
      } else if (data.type === "player_state") {
        newClient.position = data.position || newClient.position;
        newClient.rotation = typeof data.rotation === "number" ? data.rotation : newClient.rotation;
        newClient.action = data.action || newClient.action;
        newClient.currentExpression = data.currentExpression || newClient.currentExpression;
        newClient.isLoafing = !!data.isLoafing;
        newClient.isClimbing = !!data.isClimbing;
        newClient.isDashing = !!data.isDashing;
        newClient.isMicActive = typeof data.isMicActive === "boolean" ? data.isMicActive : newClient.isMicActive;
        newClient.isSpeaking = !!data.isSpeaking;
        broadcastToRoom(
          room,
          {
            type: "player_moved",
            id: clientId,
            position: newClient.position,
            rotation: newClient.rotation,
            action: newClient.action,
            currentExpression: newClient.currentExpression,
            isLoafing: newClient.isLoafing,
            isClimbing: newClient.isClimbing,
            isDashing: newClient.isDashing,
            isMicActive: newClient.isMicActive,
            isSpeaking: newClient.isSpeaking
          },
          clientId
        );
      } else if (data.type === "mission_progress") {
        if (room.sharedMission && !room.sharedMission.completed) {
          room.sharedMission.currentCount = data.currentCount;
          if (room.sharedMission.currentCount >= room.sharedMission.targetCount) {
            room.sharedMission.completed = true;
            room.isKissHuntActive = false;
            broadcastToRoom(room, {
              type: "mission_completed",
              completedBy: newClient.name,
              completedById: clientId,
              mission: room.sharedMission,
              rewardCred: room.sharedMission.rewardCred
            });
            setTimeout(() => {
              room.sharedMission = pickRandomMission();
              room.isKissHuntActive = false;
              broadcastToRoom(room, {
                type: "new_mission_started",
                mission: room.sharedMission
              });
            }, 5e3);
          } else {
            broadcastToRoom(room, {
              type: "mission_progress_update",
              currentCount: room.sharedMission.currentCount,
              targetCount: room.sharedMission.targetCount,
              updatedBy: newClient.name
            });
          }
        }
      } else if (data.type === "cat_action") {
        broadcastToRoom(
          room,
          {
            type: "cat_action_triggered",
            id: clientId,
            actionType: data.actionType,
            soundId: data.soundId
          },
          clientId
        );
      } else if (data.type === "webrtc_signal") {
        const targetClient = room.clients.get(data.targetId);
        if (targetClient && targetClient.ws.readyState === import_ws.WebSocket.OPEN) {
          targetClient.ws.send(
            JSON.stringify({
              type: "webrtc_signal",
              senderId: clientId,
              signalType: data.signalType,
              signal: data.signal
            })
          );
        }
      } else if (data.type === "ping") {
        newClient.ping = Math.round(Date.now() - newClient.lastPingTime);
        newClient.lastPingTime = Date.now();
        ws.send(JSON.stringify({ type: "pong", time: Date.now() }));
      }
    } catch (e) {
      console.warn("Malformed client message:", e);
    }
  });
  ws.on("close", () => {
    room.clients.delete(clientId);
    room.availableSlots.push(assignedSlot);
    room.availableSlots.sort((a, b) => a - b);
    broadcastToRoom(room, {
      type: "player_left",
      id: clientId,
      name: newClient.name
    });
    if (room.clients.size === 0) {
      rooms.delete(roomId);
    }
  });
});
setInterval(() => {
  rooms.forEach((room) => {
    if (room.clients.size === 0) return;
    if (room.sharedMission && !room.sharedMission.completed) {
      room.sharedMission.secondsLeft -= 1;
      if (room.sharedMission.secondsLeft === 30 && !room.isKissHuntActive) {
        broadcastToRoom(room, {
          type: "mission_time_warning_30s",
          secondsLeft: 30,
          message: "\u26A0\uFE0F 30 SECONDS LEFT before Time is Up! Complete the task or prepare to climb high!"
        });
      }
      if (room.sharedMission.secondsLeft <= 0 && !room.isKissHuntActive) {
        room.isKissHuntActive = true;
        room.kissHuntTimer = 60;
        broadcastToRoom(room, {
          type: "kiss_hunt_started",
          message: "\u{1F6A8} TIME IS UP! The scary human is coming to kiss all uncompleted cats! CLIMB HIGH TO ESCAPE!"
        });
      }
      if (room.isKissHuntActive) {
        room.kissHuntTimer -= 1;
        if (room.kissHuntTimer <= 0) {
          room.isKissHuntActive = false;
          room.sharedMission = pickRandomMission();
          broadcastToRoom(room, {
            type: "new_mission_started",
            mission: room.sharedMission
          });
        }
      }
      if (room.sharedMission.secondsLeft % 5 === 0) {
        broadcastToRoom(room, {
          type: "mission_time_sync",
          secondsLeft: room.sharedMission.secondsLeft,
          isKissHuntActive: room.isKissHuntActive,
          kissHuntTimer: room.kissHuntTimer
        });
      }
    }
  });
}, 1e3);
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Don't Get Kiss server running on http://0.0.0.0:${PORT}`);
  });
}
start();
//# sourceMappingURL=server.cjs.map
