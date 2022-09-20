var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// functions/r2/create.ts
var onRequestPut = async ({ env }) => {
  const object = await env.BUCKET.put("test", "Hello world!");
  return new Response(JSON.stringify(object));
};

// functions/r2/get.ts
var onRequestGet = async ({ env }) => {
  const object = await env.BUCKET.get("test");
  return new Response(JSON.stringify(object));
};

// functions/regex_chars/my-file.ts
var onRequestGet2 = () => new Response("My file with regex chars");

// functions/i/[slug].ts
var onRequestGet3 = ({ params }) => {
  const { slug } = params;
  return new Response(`<h1>A blog with a slug: ${slug}</h1>`, {
    headers: { "content-type": "text/html" }
  });
};

// node_modules/1co/index.js
function matchFilter(filter) {
  const parsed = parse(filter);
  const predicate = compile(parsed);
  return (ctx) => predicate(ctx);
}
function parse(filter) {
  return Array.isArray(filter) ? filter.map((q) => q.split(":")) : [
    filter.split(":")
  ];
}
function compile(parsed) {
  const preprocessed = parsed.flatMap((q) => check(q, preprocess(q)));
  const ltree = treeify(preprocessed);
  const predicate = arborist(ltree);
  return (ctx) => !!predicate(ctx.update, ctx);
}
function preprocess(filter) {
  const valid = UPDATE_KEYS;
  const expanded1 = [
    filter
  ].flatMap((q) => {
    const [l1, l2, l3] = q;
    if (!(l1 in L1_SHORTCUTS))
      return [
        q
      ];
    if (!l1 && !l2 && !l3)
      return [
        q
      ];
    const targets = L1_SHORTCUTS[l1];
    const expanded = targets.map((s2) => [
      s2,
      l2,
      l3
    ]);
    if (l2 === void 0)
      return expanded;
    if (l2 in L2_SHORTCUTS && (l2 || l3))
      return expanded;
    return expanded.filter(([s3]) => !!valid[s3]?.[l2]);
  }).flatMap((q) => {
    const [l1, l2, l3] = q;
    if (!(l2 in L2_SHORTCUTS))
      return [
        q
      ];
    if (!l2 && !l3)
      return [
        q
      ];
    const targets = L2_SHORTCUTS[l2];
    const expanded = targets.map((s4) => [
      l1,
      s4,
      l3
    ]);
    if (l3 === void 0)
      return expanded;
    return expanded.filter(([, s5]) => !!valid[l1]?.[s5]?.[l3]);
  });
  if (expanded1.length === 0) {
    throw new Error(`Shortcuts in '${filter.join(":")}' do not expand to any valid filter query`);
  }
  return expanded1;
}
function check(original, preprocessed) {
  if (preprocessed.length === 0)
    throw new Error("Empty filter query given");
  const errors = preprocessed.map(checkOne).filter((r1) => r1 !== true);
  if (errors.length === 0)
    return preprocessed;
  else if (errors.length === 1)
    throw new Error(errors[0]);
  else {
    throw new Error(`Invalid filter query '${original.join(":")}'. There are ${errors.length} errors after expanding the contained shortcuts: ${errors.join("; ")}`);
  }
}
function checkOne(filter) {
  const [l1, l2, l3, ...n1] = filter;
  if (l1 === void 0)
    return "Empty filter query given";
  if (!(l1 in UPDATE_KEYS)) {
    const permitted = Object.keys(UPDATE_KEYS);
    return `Invalid L1 filter '${l1}' given in '${filter.join(":")}'. Permitted values are: ${permitted.map((k) => `'${k}'`).join(", ")}.`;
  }
  if (l2 === void 0)
    return true;
  const l1Obj = UPDATE_KEYS[l1];
  if (!(l2 in l1Obj)) {
    const permitted = Object.keys(l1Obj);
    return `Invalid L2 filter '${l2}' given in '${filter.join(":")}'. Permitted values are: ${permitted.map((k) => `'${k}'`).join(", ")}.`;
  }
  if (l3 === void 0)
    return true;
  const l2Obj = l1Obj[l2];
  if (!(l3 in l2Obj)) {
    const permitted = Object.keys(l2Obj);
    return `Invalid L3 filter '${l3}' given in '${filter.join(":")}'. ${permitted.length === 0 ? `No further filtering is possible after '${l1}:${l2}'.` : `Permitted values are: ${permitted.map((k) => `'${k}'`).join(", ")}.`}`;
  }
  if (n1.length === 0)
    return true;
  return `Cannot filter further than three levels, ':${n1.join(":")}' is invalid!`;
}
function treeify(paths) {
  const tree = {};
  for (const [l1, l2, l3] of paths) {
    const subtree = tree[l1] ??= {};
    if (l2 !== void 0) {
      const set = subtree[l2] ??= /* @__PURE__ */ new Set();
      if (l3 !== void 0)
        set.add(l3);
    }
  }
  return tree;
}
function or(left, right) {
  return (obj, ctx) => left(obj, ctx) || right(obj, ctx);
}
function concat(get, test) {
  return (obj, ctx) => {
    const nextObj = get(obj, ctx);
    return nextObj && test(nextObj, ctx);
  };
}
function leaf(pred) {
  return (obj, ctx) => pred(obj, ctx) != null;
}
function arborist(tree) {
  const l1Predicates = Object.entries(tree).map(([l1, subtree]) => {
    const l1Pred = (obj) => obj[l1];
    const l2Predicates = Object.entries(subtree).map(([l2, set]) => {
      const l2Pred = (obj) => obj[l2];
      const l3Predicates = Array.from(set).map((l3) => {
        const l3Pred = l3 === "me" ? (obj, ctx) => {
          const me = ctx.me.id;
          return testMaybeArray(obj, (u1) => u1.id === me);
        } : (obj) => testMaybeArray(obj, (e) => e[l3] || e.type === l3);
        return l3Pred;
      });
      return l3Predicates.length === 0 ? leaf(l2Pred) : concat(l2Pred, l3Predicates.reduce(or));
    });
    return l2Predicates.length === 0 ? leaf(l1Pred) : concat(l1Pred, l2Predicates.reduce(or));
  });
  if (l1Predicates.length === 0) {
    throw new Error("Cannot create filter function for empty query");
  }
  return l1Predicates.reduce(or);
}
function testMaybeArray(t, pred) {
  const p1 = (x1) => x1 != null && pred(x1);
  return Array.isArray(t) ? t.some(p1) : p1(t);
}
var ENTITY_KEYS = {
  mention: {},
  hashtag: {},
  cashtag: {},
  bot_command: {},
  url: {},
  email: {},
  phone_number: {},
  bold: {},
  italic: {},
  underline: {},
  strikethrough: {},
  spoiler: {},
  code: {},
  pre: {},
  text_link: {},
  text_mention: {},
  custom_emoji: {}
};
var USER_KEYS = {
  me: {},
  is_bot: {},
  is_premium: {},
  added_to_attachment_menu: {}
};
var EDITABLE_MESSAGE_KEYS = {
  text: {},
  animation: {},
  audio: {},
  document: {},
  photo: {},
  video: {},
  game: {},
  location: {},
  entities: ENTITY_KEYS,
  caption_entities: ENTITY_KEYS,
  caption: {}
};
var COMMON_MESSAGE_KEYS = {
  ...EDITABLE_MESSAGE_KEYS,
  sticker: {},
  video_note: {},
  voice: {},
  contact: {},
  dice: {},
  poll: {},
  venue: {},
  new_chat_title: {},
  new_chat_photo: {},
  delete_chat_photo: {},
  message_auto_delete_timer_changed: {},
  pinned_message: {},
  invoice: {},
  proximity_alert_triggered: {},
  video_chat_scheduled: {},
  video_chat_started: {},
  video_chat_ended: {},
  video_chat_participants_invited: {},
  web_app_data: {},
  forward_date: {},
  is_automatic_forward: {}
};
var MESSAGE_KEYS = {
  ...COMMON_MESSAGE_KEYS,
  new_chat_members: USER_KEYS,
  left_chat_member: USER_KEYS,
  group_chat_created: {},
  supergroup_chat_created: {},
  migrate_to_chat_id: {},
  migrate_from_chat_id: {},
  successful_payment: {},
  connected_website: {},
  passport_data: {}
};
var CHANNEL_POST_KEYS = {
  ...COMMON_MESSAGE_KEYS,
  channel_chat_created: {}
};
var CALLBACK_QUERY_KEYS = {
  data: {},
  game_short_name: {}
};
var CHAT_MEMBER_UPDATED_KEYS = {
  from: USER_KEYS
};
var UPDATE_KEYS = {
  message: MESSAGE_KEYS,
  edited_message: MESSAGE_KEYS,
  channel_post: CHANNEL_POST_KEYS,
  edited_channel_post: CHANNEL_POST_KEYS,
  inline_query: {},
  chosen_inline_result: {},
  callback_query: CALLBACK_QUERY_KEYS,
  shipping_query: {},
  pre_checkout_query: {},
  poll: {},
  poll_answer: {},
  my_chat_member: CHAT_MEMBER_UPDATED_KEYS,
  chat_member: CHAT_MEMBER_UPDATED_KEYS,
  chat_join_request: {}
};
var L1_SHORTCUTS = {
  "": [
    "message",
    "channel_post"
  ],
  msg: [
    "message",
    "channel_post"
  ],
  edit: [
    "edited_message",
    "edited_channel_post"
  ]
};
var L2_SHORTCUTS = {
  "": [
    "entities",
    "caption_entities"
  ],
  media: [
    "photo",
    "video"
  ],
  file: [
    "photo",
    "animation",
    "audio",
    "document",
    "video",
    "video_note",
    "voice",
    "sticker"
  ]
};
var checker = {
  filterQuery(filter) {
    const pred = matchFilter(filter);
    return (ctx) => pred(ctx);
  },
  text(trigger) {
    const hasText = checker.filterQuery([
      ":text",
      ":caption"
    ]);
    const trg = triggerFn(trigger);
    return (ctx) => {
      if (!hasText(ctx))
        return false;
      const msg = ctx.message ?? ctx.channelPost;
      const txt = msg.text ?? msg.caption;
      return match(ctx, txt, trg);
    };
  },
  command(command) {
    const hasEntities = checker.filterQuery(":entities:bot_command");
    const atCommands = /* @__PURE__ */ new Set();
    const noAtCommands = /* @__PURE__ */ new Set();
    toArray(command).forEach((cmd) => {
      if (cmd.startsWith("/")) {
        throw new Error(`Do not include '/' when registering command handlers (use '${cmd.substring(1)}' not '${cmd}')`);
      }
      const set = cmd.indexOf("@") === -1 ? noAtCommands : atCommands;
      set.add(cmd);
    });
    return (ctx) => {
      if (!hasEntities(ctx))
        return false;
      const msg = ctx.message ?? ctx.channelPost;
      const txt = msg.text ?? msg.caption;
      return msg.entities.some((e) => {
        if (e.type !== "bot_command")
          return false;
        if (e.offset !== 0)
          return false;
        const cmd = txt.substring(1, e.length);
        if (noAtCommands.has(cmd) || atCommands.has(cmd)) {
          ctx.match = txt.substring(cmd.length + 1).trimStart();
          return true;
        }
        const index = cmd.indexOf("@");
        if (index === -1)
          return false;
        const atTarget = cmd.substring(index + 1);
        if (atTarget !== ctx.me.username)
          return false;
        const atCommand = cmd.substring(0, index);
        if (noAtCommands.has(atCommand)) {
          ctx.match = txt.substring(cmd.length + 1).trimStart();
          return true;
        }
        return false;
      });
    };
  },
  chatType(chatType) {
    const set = new Set(toArray(chatType));
    return (ctx) => ctx.chat?.type !== void 0 && set.has(ctx.chat.type);
  },
  callbackQuery(trigger) {
    const hasCallbackQuery = checker.filterQuery("callback_query:data");
    const trg = triggerFn(trigger);
    return (ctx) => hasCallbackQuery(ctx) && match(ctx, ctx.callbackQuery.data, trg);
  },
  gameQuery(trigger) {
    const hasGameQuery = checker.filterQuery("callback_query:game_short_name");
    const trg = triggerFn(trigger);
    return (ctx) => hasGameQuery(ctx) && match(ctx, ctx.callbackQuery.game_short_name, trg);
  },
  inlineQuery(trigger) {
    const hasInlineQuery = checker.filterQuery("inline_query");
    const trg = triggerFn(trigger);
    return (ctx) => hasInlineQuery(ctx) && match(ctx, ctx.inlineQuery.query, trg);
  }
};
var _Context = class {
  match;
  constructor(update, api, me) {
    this.update = update;
    this.api = api;
    this.me = me;
  }
  get message() {
    return this.update.message;
  }
  get editedMessage() {
    return this.update.edited_message;
  }
  get channelPost() {
    return this.update.channel_post;
  }
  get editedChannelPost() {
    return this.update.edited_channel_post;
  }
  get inlineQuery() {
    return this.update.inline_query;
  }
  get chosenInlineResult() {
    return this.update.chosen_inline_result;
  }
  get callbackQuery() {
    return this.update.callback_query;
  }
  get shippingQuery() {
    return this.update.shipping_query;
  }
  get preCheckoutQuery() {
    return this.update.pre_checkout_query;
  }
  get poll() {
    return this.update.poll;
  }
  get pollAnswer() {
    return this.update.poll_answer;
  }
  get myChatMember() {
    return this.update.my_chat_member;
  }
  get chatMember() {
    return this.update.chat_member;
  }
  get chatJoinRequest() {
    return this.update.chat_join_request;
  }
  get msg() {
    return this.message ?? this.editedMessage ?? this.callbackQuery?.message ?? this.channelPost ?? this.editedChannelPost;
  }
  get chat() {
    return (this.msg ?? this.myChatMember ?? this.chatMember ?? this.chatJoinRequest)?.chat;
  }
  get senderChat() {
    return this.msg?.sender_chat;
  }
  get from() {
    return (this.callbackQuery ?? this.inlineQuery ?? this.shippingQuery ?? this.preCheckoutQuery ?? this.chosenInlineResult ?? this.msg ?? this.myChatMember ?? this.chatMember ?? this.chatJoinRequest)?.from;
  }
  get inlineMessageId() {
    return this.callbackQuery?.inline_message_id ?? this.chosenInlineResult?.inline_message_id;
  }
  has(filter) {
    return _Context.has.filterQuery(filter)(this);
  }
  hasText(trigger) {
    return _Context.has.text(trigger)(this);
  }
  hasCommand(command) {
    return _Context.has.command(command)(this);
  }
  hasChatType(chatType) {
    return _Context.has.chatType(chatType)(this);
  }
  hasCallbackQuery(trigger) {
    return _Context.has.callbackQuery(trigger)(this);
  }
  hasGameQuery(trigger) {
    return _Context.has.gameQuery(trigger)(this);
  }
  hasInlineQuery(trigger) {
    return _Context.has.inlineQuery(trigger)(this);
  }
  reply(text, other, signal) {
    return this.api.sendMessage(orThrow(this.chat, "sendMessage").id, text, other, signal);
  }
  forwardMessage(chat_id, other, signal) {
    return this.api.forwardMessage(chat_id, orThrow(this.chat, "forwardMessage").id, orThrow(this.msg, "forwardMessage").message_id, other, signal);
  }
  copyMessage(chat_id, other, signal) {
    return this.api.copyMessage(chat_id, orThrow(this.chat, "copyMessage").id, orThrow(this.msg, "copyMessage").message_id, other, signal);
  }
  replyWithPhoto(photo, other, signal) {
    return this.api.sendPhoto(orThrow(this.chat, "sendPhoto").id, photo, other, signal);
  }
  replyWithAudio(audio, other, signal) {
    return this.api.sendAudio(orThrow(this.chat, "sendAudio").id, audio, other, signal);
  }
  replyWithDocument(document2, other, signal) {
    return this.api.sendDocument(orThrow(this.chat, "sendDocument").id, document2, other, signal);
  }
  replyWithVideo(video, other, signal) {
    return this.api.sendVideo(orThrow(this.chat, "sendVideo").id, video, other, signal);
  }
  replyWithAnimation(animation, other, signal) {
    return this.api.sendAnimation(orThrow(this.chat, "sendAnimation").id, animation, other, signal);
  }
  replyWithVoice(voice, other, signal) {
    return this.api.sendVoice(orThrow(this.chat, "sendVoice").id, voice, other, signal);
  }
  replyWithVideoNote(video_note, other, signal) {
    return this.api.sendVideoNote(orThrow(this.chat, "sendVideoNote").id, video_note, other, signal);
  }
  replyWithMediaGroup(media, other, signal) {
    return this.api.sendMediaGroup(orThrow(this.chat, "sendMediaGroup").id, media, other, signal);
  }
  replyWithLocation(latitude, longitude, other, signal) {
    return this.api.sendLocation(orThrow(this.chat, "sendLocation").id, latitude, longitude, other, signal);
  }
  editMessageLiveLocation(latitude, longitude, other, signal) {
    const inlineId = this.inlineMessageId;
    return inlineId !== void 0 ? this.api.editMessageLiveLocationInline(inlineId, latitude, longitude, other) : this.api.editMessageLiveLocation(orThrow(this.chat, "editMessageLiveLocation").id, orThrow(this.msg, "editMessageLiveLocation").message_id, latitude, longitude, other, signal);
  }
  stopMessageLiveLocation(other, signal) {
    const inlineId = this.inlineMessageId;
    return inlineId !== void 0 ? this.api.stopMessageLiveLocationInline(inlineId, other) : this.api.stopMessageLiveLocation(orThrow(this.chat, "stopMessageLiveLocation").id, orThrow(this.msg, "stopMessageLiveLocation").message_id, other, signal);
  }
  replyWithVenue(latitude, longitude, title1, address, other, signal) {
    return this.api.sendVenue(orThrow(this.chat, "sendVenue").id, latitude, longitude, title1, address, other, signal);
  }
  replyWithContact(phone_number, first_name, other, signal) {
    return this.api.sendContact(orThrow(this.chat, "sendContact").id, phone_number, first_name, other, signal);
  }
  replyWithPoll(question, options, other, signal) {
    return this.api.sendPoll(orThrow(this.chat, "sendPoll").id, question, options, other, signal);
  }
  replyWithDice(emoji, other, signal) {
    return this.api.sendDice(orThrow(this.chat, "sendDice").id, emoji, other, signal);
  }
  replyWithChatAction(action, signal) {
    return this.api.sendChatAction(orThrow(this.chat, "sendChatAction").id, action, signal);
  }
  getUserProfilePhotos(other, signal) {
    return this.api.getUserProfilePhotos(orThrow(this.from, "getUserProfilePhotos").id, other, signal);
  }
  getFile(signal) {
    const m2 = orThrow(this.msg, "getFile");
    const file = m2.photo !== void 0 ? m2.photo[m2.photo.length - 1] : m2.animation ?? m2.audio ?? m2.document ?? m2.video ?? m2.video_note ?? m2.voice ?? m2.sticker;
    return this.api.getFile(orThrow(file, "getFile").file_id, signal);
  }
  kickAuthor(...args) {
    return this.banAuthor(...args);
  }
  banAuthor(other, signal) {
    return this.api.banChatMember(orThrow(this.chat, "banAuthor").id, orThrow(this.from, "banAuthor").id, other, signal);
  }
  kickChatMember(...args) {
    return this.banChatMember(...args);
  }
  banChatMember(user_id, other, signal) {
    return this.api.banChatMember(orThrow(this.chat, "banChatMember").id, user_id, other, signal);
  }
  unbanChatMember(user_id, other, signal) {
    return this.api.unbanChatMember(orThrow(this.chat, "unbanChatMember").id, user_id, other, signal);
  }
  restrictAuthor(permissions, other, signal) {
    return this.api.restrictChatMember(orThrow(this.chat, "restrictAuthor").id, orThrow(this.from, "restrictAuthor").id, permissions, other, signal);
  }
  restrictChatMember(user_id, permissions, other, signal) {
    return this.api.restrictChatMember(orThrow(this.chat, "restrictChatMember").id, user_id, permissions, other, signal);
  }
  promoteAuthor(other, signal) {
    return this.api.promoteChatMember(orThrow(this.chat, "promoteAuthor").id, orThrow(this.from, "promoteAuthor").id, other, signal);
  }
  promoteChatMember(user_id, other, signal) {
    return this.api.promoteChatMember(orThrow(this.chat, "promoteChatMember").id, user_id, other, signal);
  }
  setChatAdministratorAuthorCustomTitle(custom_title, signal) {
    return this.api.setChatAdministratorCustomTitle(orThrow(this.chat, "setChatAdministratorAuthorCustomTitle").id, orThrow(this.from, "setChatAdministratorAuthorCustomTitle").id, custom_title, signal);
  }
  setChatAdministratorCustomTitle(user_id, custom_title, signal) {
    return this.api.setChatAdministratorCustomTitle(orThrow(this.chat, "setChatAdministratorCustomTitle").id, user_id, custom_title, signal);
  }
  banChatSenderChat(sender_chat_id, signal) {
    return this.api.banChatSenderChat(orThrow(this.chat, "banChatSenderChat").id, sender_chat_id, signal);
  }
  unbanChatSenderChat(sender_chat_id, signal) {
    return this.api.unbanChatSenderChat(orThrow(this.chat, "unbanChatSenderChat").id, sender_chat_id, signal);
  }
  setChatPermissions(permissions, signal) {
    return this.api.setChatPermissions(orThrow(this.chat, "setChatPermissions").id, permissions, signal);
  }
  exportChatInviteLink(signal) {
    return this.api.exportChatInviteLink(orThrow(this.chat, "exportChatInviteLink").id, signal);
  }
  createChatInviteLink(other, signal) {
    return this.api.createChatInviteLink(orThrow(this.chat, "createChatInviteLink").id, other, signal);
  }
  editChatInviteLink(invite_link, other, signal) {
    return this.api.editChatInviteLink(orThrow(this.chat, "editChatInviteLink").id, invite_link, other, signal);
  }
  revokeChatInviteLink(invite_link, signal) {
    return this.api.revokeChatInviteLink(orThrow(this.chat, "editChatInviteLink").id, invite_link, signal);
  }
  approveChatJoinRequest(user_id, signal) {
    return this.api.approveChatJoinRequest(orThrow(this.chat, "approveChatJoinRequest").id, user_id, signal);
  }
  declineChatJoinRequest(user_id, signal) {
    return this.api.declineChatJoinRequest(orThrow(this.chat, "declineChatJoinRequest").id, user_id, signal);
  }
  setChatPhoto(photo, signal) {
    return this.api.setChatPhoto(orThrow(this.chat, "setChatPhoto").id, photo, signal);
  }
  deleteChatPhoto(signal) {
    return this.api.deleteChatPhoto(orThrow(this.chat, "deleteChatPhoto").id, signal);
  }
  setChatTitle(title2, signal) {
    return this.api.setChatTitle(orThrow(this.chat, "setChatTitle").id, title2, signal);
  }
  setChatDescription(description, signal) {
    return this.api.setChatDescription(orThrow(this.chat, "setChatDescription").id, description, signal);
  }
  pinChatMessage(message_id, other, signal) {
    return this.api.pinChatMessage(orThrow(this.chat, "pinChatMessage").id, message_id, other, signal);
  }
  unpinChatMessage(message_id, signal) {
    return this.api.unpinChatMessage(orThrow(this.chat, "unpinChatMessage").id, message_id, signal);
  }
  unpinAllChatMessages(signal) {
    return this.api.unpinAllChatMessages(orThrow(this.chat, "unpinAllChatMessages").id, signal);
  }
  leaveChat(signal) {
    return this.api.leaveChat(orThrow(this.chat, "leaveChat").id, signal);
  }
  getChat(signal) {
    return this.api.getChat(orThrow(this.chat, "getChat").id, signal);
  }
  getChatAdministrators(signal) {
    return this.api.getChatAdministrators(orThrow(this.chat, "getChatAdministrators").id, signal);
  }
  getChatMembersCount(...args) {
    return this.getChatMemberCount(...args);
  }
  getChatMemberCount(signal) {
    return this.api.getChatMemberCount(orThrow(this.chat, "getChatMemberCount").id, signal);
  }
  getAuthor(signal) {
    return this.api.getChatMember(orThrow(this.chat, "getAuthor").id, orThrow(this.from, "getAuthor").id, signal);
  }
  getChatMember(user_id, signal) {
    return this.api.getChatMember(orThrow(this.chat, "getChatMember").id, user_id, signal);
  }
  setChatStickerSet(sticker_set_name, signal) {
    return this.api.setChatStickerSet(orThrow(this.chat, "setChatStickerSet").id, sticker_set_name, signal);
  }
  deleteChatStickerSet(signal) {
    return this.api.deleteChatStickerSet(orThrow(this.chat, "deleteChatStickerSet").id, signal);
  }
  answerCallbackQuery(other, signal) {
    return this.api.answerCallbackQuery(orThrow(this.callbackQuery, "answerCallbackQuery").id, typeof other === "string" ? {
      text: other
    } : other, signal);
  }
  setChatMenuButton(other, signal) {
    return this.api.setChatMenuButton(other, signal);
  }
  getChatMenuButton(other, signal) {
    return this.api.getChatMenuButton(other, signal);
  }
  setMyDefaultAdministratorRights(other, signal) {
    return this.api.setMyDefaultAdministratorRights(other, signal);
  }
  getMyDefaultAdministratorRights(other, signal) {
    return this.api.getMyDefaultAdministratorRights(other, signal);
  }
  editMessageText(text, other, signal) {
    const inlineId = this.inlineMessageId;
    return inlineId !== void 0 ? this.api.editMessageTextInline(inlineId, text, other) : this.api.editMessageText(orThrow(this.chat, "editMessageText").id, orThrow(this.msg, "editMessageText").message_id, text, other, signal);
  }
  editMessageCaption(other, signal) {
    const inlineId = this.inlineMessageId;
    return inlineId !== void 0 ? this.api.editMessageCaptionInline(inlineId, other) : this.api.editMessageCaption(orThrow(this.chat, "editMessageCaption").id, orThrow(this.msg, "editMessageCaption").message_id, other, signal);
  }
  editMessageMedia(media, other, signal) {
    const inlineId = this.inlineMessageId;
    return inlineId !== void 0 ? this.api.editMessageMediaInline(inlineId, media, other) : this.api.editMessageMedia(orThrow(this.chat, "editMessageMedia").id, orThrow(this.msg, "editMessageMedia").message_id, media, other, signal);
  }
  editMessageReplyMarkup(other, signal) {
    const inlineId = this.inlineMessageId;
    return inlineId !== void 0 ? this.api.editMessageReplyMarkupInline(inlineId, other) : this.api.editMessageReplyMarkup(orThrow(this.chat, "editMessageReplyMarkup").id, orThrow(this.msg, "editMessageReplyMarkup").message_id, other, signal);
  }
  stopPoll(other, signal) {
    return this.api.stopPoll(orThrow(this.chat, "stopPoll").id, orThrow(this.msg, "stopPoll").message_id, other, signal);
  }
  deleteMessage(signal) {
    return this.api.deleteMessage(orThrow(this.chat, "deleteMessage").id, orThrow(this.msg, "deleteMessage").message_id, signal);
  }
  replyWithSticker(sticker, other, signal) {
    return this.api.sendSticker(orThrow(this.chat, "sendSticker").id, sticker, other, signal);
  }
  getCustomEmojiStickers(signal) {
    return this.api.getCustomEmojiStickers((this.msg?.entities ?? []).filter((e) => e.type === "custom_emoji").map((e) => e.custom_emoji_id), signal);
  }
  answerInlineQuery(results, other, signal) {
    return this.api.answerInlineQuery(orThrow(this.inlineQuery, "answerInlineQuery").id, results, other, signal);
  }
  replyWithInvoice(title3, description, payload, provider_token, currency, prices, other, signal) {
    return this.api.sendInvoice(orThrow(this.chat, "sendInvoice").id, title3, description, payload, provider_token, currency, prices, other, signal);
  }
  answerShippingQuery(ok, other, signal) {
    return this.api.answerShippingQuery(orThrow(this.shippingQuery, "answerShippingQuery").id, ok, other, signal);
  }
  answerPreCheckoutQuery(ok, other, signal) {
    return this.api.answerPreCheckoutQuery(orThrow(this.preCheckoutQuery, "answerPreCheckoutQuery").id, ok, typeof other === "string" ? {
      error_message: other
    } : other, signal);
  }
  setPassportDataErrors(errors, signal) {
    return this.api.setPassportDataErrors(orThrow(this.from, "setPassportDataErrors").id, errors, signal);
  }
  replyWithGame(game_short_name, other, signal) {
    return this.api.sendGame(orThrow(this.chat, "sendGame").id, game_short_name, other, signal);
  }
  update;
  api;
  me;
};
var Context = _Context;
__publicField(Context, "has", checker);
function orThrow(value, method) {
  if (value === void 0) {
    throw new Error(`Missing information for API call to ${method}`);
  }
  return value;
}
function triggerFn(trigger) {
  return toArray(trigger).map((t) => typeof t === "string" ? (txt) => txt === t ? t : null : (txt) => txt.match(t));
}
function match(ctx, content, triggers) {
  for (const t of triggers) {
    const res = t(content);
    if (res) {
      ctx.match = res;
      return true;
    }
  }
  return false;
}
function toArray(e) {
  return Array.isArray(e) ? e : [
    e
  ];
}
var BotError = class extends Error {
  constructor(error, ctx) {
    super(generateBotErrorMessage(error));
    this.error = error;
    this.ctx = ctx;
    this.name = "BotError";
    if (error instanceof Error)
      this.stack = error.stack;
  }
  error;
  ctx;
};
function generateBotErrorMessage(error) {
  let msg;
  if (error instanceof Error) {
    msg = `${error.name} in middleware: ${error.message}`;
  } else {
    const type = typeof error;
    msg = `Non-error value of type ${type} thrown in middleware`;
    switch (type) {
      case "bigint":
      case "boolean":
      case "number":
      case "symbol":
        msg += `: ${error}`;
        break;
      case "string":
        msg += `: ${String(error).substring(0, 50)}`;
        break;
      default:
        msg += "!";
        break;
    }
  }
  return msg;
}
function flatten(mw) {
  return typeof mw === "function" ? mw : (ctx, next) => mw.middleware()(ctx, next);
}
function concat1(first, andThen) {
  return async (ctx, next) => {
    let nextCalled = false;
    await first(ctx, async () => {
      if (nextCalled)
        throw new Error("`next` already called before!");
      else
        nextCalled = true;
      await andThen(ctx, next);
    });
  };
}
function pass(_ctx, next) {
  return next();
}
var leaf1 = () => Promise.resolve();
async function run(middleware, ctx) {
  await middleware(ctx, leaf1);
}
var Composer = class {
  handler;
  constructor(...middleware) {
    this.handler = middleware.length === 0 ? pass : middleware.map(flatten).reduce(concat1);
  }
  middleware() {
    return this.handler;
  }
  use(...middleware) {
    const composer = new Composer(...middleware);
    this.handler = concat1(this.handler, flatten(composer));
    return composer;
  }
  on(filter, ...middleware) {
    return this.filter(Context.has.filterQuery(filter), ...middleware);
  }
  hears(trigger, ...middleware) {
    return this.filter(Context.has.text(trigger), ...middleware);
  }
  command(command, ...middleware) {
    return this.filter(Context.has.command(command), ...middleware);
  }
  chatType(chatType, ...middleware) {
    return this.filter(Context.has.chatType(chatType), ...middleware);
  }
  callbackQuery(trigger, ...middleware) {
    return this.filter(Context.has.callbackQuery(trigger), ...middleware);
  }
  gameQuery(trigger, ...middleware) {
    return this.filter(Context.has.gameQuery(trigger), ...middleware);
  }
  inlineQuery(trigger, ...middleware) {
    return this.filter(Context.has.inlineQuery(trigger), ...middleware);
  }
  filter(predicate, ...middleware) {
    const composer = new Composer(...middleware);
    this.branch(predicate, composer, pass);
    return composer;
  }
  drop(predicate, ...middleware) {
    return this.filter(async (ctx) => !await predicate(ctx), ...middleware);
  }
  fork(...middleware) {
    const composer = new Composer(...middleware);
    const fork = flatten(composer);
    this.use((ctx, next) => Promise.all([
      next(),
      run(fork, ctx)
    ]));
    return composer;
  }
  lazy(middlewareFactory) {
    return this.use(async (ctx, next) => {
      const middleware = await middlewareFactory(ctx);
      const arr = Array.isArray(middleware) ? middleware : [
        middleware
      ];
      await flatten(new Composer(...arr))(ctx, next);
    });
  }
  route(router, routeHandlers, fallback = pass) {
    return this.lazy(async (ctx) => {
      const route = await router(ctx);
      return (route === void 0 || !routeHandlers[route] ? fallback : routeHandlers[route]) ?? [];
    });
  }
  branch(predicate, trueMiddleware, falseMiddleware) {
    return this.lazy(async (ctx) => await predicate(ctx) ? trueMiddleware : falseMiddleware);
  }
  errorBoundary(errorHandler, ...middleware) {
    const composer = new Composer(...middleware);
    const bound = flatten(composer);
    this.use(async (ctx, next) => {
      let nextCalled = false;
      const cont = () => (nextCalled = true, Promise.resolve());
      try {
        await bound(ctx, cont);
      } catch (err) {
        nextCalled = false;
        await errorHandler(new BotError(err, ctx), cont);
      }
      if (nextCalled)
        await next();
    });
    return composer;
  }
};
var s = 1e3;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;
var ms = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === "string" && val.length > 0) {
    return parse1(val);
  } else if (type === "number" && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
};
function parse1(str1) {
  str1 = String(str1);
  if (str1.length > 100) {
    return;
  }
  var match1 = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str1);
  if (!match1) {
    return;
  }
  var n2 = parseFloat(match1[1]);
  var type = (match1[2] || "ms").toLowerCase();
  switch (type) {
    case "years":
    case "year":
    case "yrs":
    case "yr":
    case "y":
      return n2 * y;
    case "weeks":
    case "week":
    case "w":
      return n2 * w;
    case "days":
    case "day":
    case "d":
      return n2 * d;
    case "hours":
    case "hour":
    case "hrs":
    case "hr":
    case "h":
      return n2 * h;
    case "minutes":
    case "minute":
    case "mins":
    case "min":
    case "m":
      return n2 * m;
    case "seconds":
    case "second":
    case "secs":
    case "sec":
    case "s":
      return n2 * s;
    case "milliseconds":
    case "millisecond":
    case "msecs":
    case "msec":
    case "ms":
      return n2;
    default:
      return void 0;
  }
}
function fmtShort(ms2) {
  var msAbs = Math.abs(ms2);
  if (msAbs >= d) {
    return Math.round(ms2 / d) + "d";
  }
  if (msAbs >= h) {
    return Math.round(ms2 / h) + "h";
  }
  if (msAbs >= m) {
    return Math.round(ms2 / m) + "m";
  }
  if (msAbs >= s) {
    return Math.round(ms2 / s) + "s";
  }
  return ms2 + "ms";
}
function fmtLong(ms2) {
  var msAbs = Math.abs(ms2);
  if (msAbs >= d) {
    return plural(ms2, msAbs, d, "day");
  }
  if (msAbs >= h) {
    return plural(ms2, msAbs, h, "hour");
  }
  if (msAbs >= m) {
    return plural(ms2, msAbs, m, "minute");
  }
  if (msAbs >= s) {
    return plural(ms2, msAbs, s, "second");
  }
  return ms2 + " ms";
}
function plural(ms2, msAbs, n3, name) {
  var isPlural = msAbs >= n3 * 1.5;
  return Math.round(ms2 / n3) + " " + name + (isPlural ? "s" : "");
}
function defaultSetTimout() {
  throw new Error("setTimeout has not been defined");
}
function defaultClearTimeout() {
  throw new Error("clearTimeout has not been defined");
}
var cachedSetTimeout = defaultSetTimout;
var cachedClearTimeout = defaultClearTimeout;
var globalContext;
if (typeof window !== "undefined") {
  globalContext = window;
} else if (typeof self !== "undefined") {
  globalContext = self;
} else {
  globalContext = {};
}
if (typeof globalContext.setTimeout === "function") {
  cachedSetTimeout = setTimeout;
}
if (typeof globalContext.clearTimeout === "function") {
  cachedClearTimeout = clearTimeout;
}
function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    return setTimeout(fun, 0);
  }
  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }
  try {
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e2) {
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}
function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    return clearTimeout(marker);
  }
  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }
  try {
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      return cachedClearTimeout.call(null, marker);
    } catch (e2) {
      return cachedClearTimeout.call(this, marker);
    }
  }
}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;
function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }
  draining = false;
  if (currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }
  if (queue.length) {
    drainQueue();
  }
}
function drainQueue() {
  if (draining) {
    return;
  }
  var timeout = runTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;
  while (len) {
    currentQueue = queue;
    queue = [];
    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run();
      }
    }
    queueIndex = -1;
    len = queue.length;
  }
  currentQueue = null;
  draining = false;
  runClearTimeout(timeout);
}
function nextTick(fun) {
  var args = new Array(arguments.length - 1);
  if (arguments.length > 1) {
    for (var i1 = 1; i1 < arguments.length; i1++) {
      args[i1 - 1] = arguments[i1];
    }
  }
  queue.push(new Item(fun, args));
  if (queue.length === 1 && !draining) {
    runTimeout(drainQueue);
  }
}
function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}
Item.prototype.run = function() {
  this.fun.apply(null, this.array);
};
var title = "browser";
var platform = "browser";
var browser = true;
var argv = [];
var version = "";
var versions = {};
var release = {};
var config = {};
function noop() {
}
var on = noop;
var addListener = noop;
var once = noop;
var off = noop;
var removeListener = noop;
var removeAllListeners = noop;
var emit = noop;
function binding(name) {
  throw new Error("process.binding is not supported");
}
function cwd() {
  return "/";
}
function chdir(dir) {
  throw new Error("process.chdir is not supported");
}
function umask() {
  return 0;
}
var performance = globalContext.performance || {};
var performanceNow = performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow || function() {
  return new Date().getTime();
};
function hrtime(previousTimestamp) {
  var clocktime = performanceNow.call(performance) * 1e-3;
  var seconds = Math.floor(clocktime);
  var nanoseconds = Math.floor(clocktime % 1 * 1e9);
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0];
    nanoseconds = nanoseconds - previousTimestamp[1];
    if (nanoseconds < 0) {
      seconds--;
      nanoseconds += 1e9;
    }
  }
  return [
    seconds,
    nanoseconds
  ];
}
var startTime = new Date();
function uptime() {
  var currentTime = new Date();
  var dif = currentTime - startTime;
  return dif / 1e3;
}
var process = {
  nextTick,
  title,
  browser,
  env: {
    NODE_ENV: "production"
  },
  argv,
  version,
  versions,
  on,
  addListener,
  once,
  off,
  removeListener,
  removeAllListeners,
  emit,
  binding,
  cwd,
  chdir,
  umask,
  hrtime,
  platform,
  release,
  config,
  uptime
};
function createCommonjsModule(fn, basedir, module) {
  return module = {
    path: basedir,
    exports: {},
    require: function(path2, base) {
      return commonjsRequire(path2, base === void 0 || base === null ? module.path : base);
    }
  }, fn(module, module.exports), module.exports;
}
function commonjsRequire() {
  throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs");
}
function setup(env) {
  createDebug.debug = createDebug;
  createDebug.default = createDebug;
  createDebug.coerce = coerce;
  createDebug.disable = disable;
  createDebug.enable = enable;
  createDebug.enabled = enabled;
  createDebug.humanize = ms;
  createDebug.destroy = destroy2;
  Object.keys(env).forEach((key) => {
    createDebug[key] = env[key];
  });
  createDebug.names = [];
  createDebug.skips = [];
  createDebug.formatters = {};
  function selectColor(namespace) {
    let hash = 0;
    for (let i2 = 0; i2 < namespace.length; i2++) {
      hash = (hash << 5) - hash + namespace.charCodeAt(i2);
      hash |= 0;
    }
    return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
  }
  createDebug.selectColor = selectColor;
  function createDebug(namespace) {
    let prevTime;
    let enableOverride = null;
    let namespacesCache;
    let enabledCache;
    function debug4(...args) {
      if (!debug4.enabled) {
        return;
      }
      const self2 = debug4;
      const curr = Number(new Date());
      const ms2 = curr - (prevTime || curr);
      self2.diff = ms2;
      self2.prev = prevTime;
      self2.curr = curr;
      prevTime = curr;
      args[0] = createDebug.coerce(args[0]);
      if (typeof args[0] !== "string") {
        args.unshift("%O");
      }
      let index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, (match22, format3) => {
        if (match22 === "%%") {
          return "%";
        }
        index++;
        const formatter = createDebug.formatters[format3];
        if (typeof formatter === "function") {
          const val = args[index];
          match22 = formatter.call(self2, val);
          args.splice(index, 1);
          index--;
        }
        return match22;
      });
      createDebug.formatArgs.call(self2, args);
      const logFn = self2.log || createDebug.log;
      logFn.apply(self2, args);
    }
    debug4.namespace = namespace;
    debug4.useColors = createDebug.useColors();
    debug4.color = createDebug.selectColor(namespace);
    debug4.extend = extend;
    debug4.destroy = createDebug.destroy;
    Object.defineProperty(debug4, "enabled", {
      enumerable: true,
      configurable: false,
      get: () => {
        if (enableOverride !== null) {
          return enableOverride;
        }
        if (namespacesCache !== createDebug.namespaces) {
          namespacesCache = createDebug.namespaces;
          enabledCache = createDebug.enabled(namespace);
        }
        return enabledCache;
      },
      set: (v) => {
        enableOverride = v;
      }
    });
    if (typeof createDebug.init === "function") {
      createDebug.init(debug4);
    }
    return debug4;
  }
  function extend(namespace, delimiter3) {
    const newDebug = createDebug(this.namespace + (typeof delimiter3 === "undefined" ? ":" : delimiter3) + namespace);
    newDebug.log = this.log;
    return newDebug;
  }
  function enable(namespaces) {
    createDebug.save(namespaces);
    createDebug.namespaces = namespaces;
    createDebug.names = [];
    createDebug.skips = [];
    let i3;
    const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
    const len = split.length;
    for (i3 = 0; i3 < len; i3++) {
      if (!split[i3]) {
        continue;
      }
      namespaces = split[i3].replace(/\*/g, ".*?");
      if (namespaces[0] === "-") {
        createDebug.skips.push(new RegExp("^" + namespaces.slice(1) + "$"));
      } else {
        createDebug.names.push(new RegExp("^" + namespaces + "$"));
      }
    }
  }
  function disable() {
    const namespaces = [
      ...createDebug.names.map(toNamespace),
      ...createDebug.skips.map(toNamespace).map((namespace) => "-" + namespace)
    ].join(",");
    createDebug.enable("");
    return namespaces;
  }
  function enabled(name) {
    if (name[name.length - 1] === "*") {
      return true;
    }
    let i4;
    let len;
    for (i4 = 0, len = createDebug.skips.length; i4 < len; i4++) {
      if (createDebug.skips[i4].test(name)) {
        return false;
      }
    }
    for (i4 = 0, len = createDebug.names.length; i4 < len; i4++) {
      if (createDebug.names[i4].test(name)) {
        return true;
      }
    }
    return false;
  }
  function toNamespace(regexp) {
    return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
  }
  function coerce(val) {
    if (val instanceof Error) {
      return val.stack || val.message;
    }
    return val;
  }
  function destroy2() {
    console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
  }
  createDebug.enable(createDebug.load());
  return createDebug;
}
var common = setup;
var browser$1 = createCommonjsModule(function(module, exports) {
  exports.formatArgs = formatArgs2;
  exports.save = save2;
  exports.load = load2;
  exports.useColors = useColors2;
  exports.storage = localstorage();
  exports.destroy = (() => {
    let warned = false;
    return () => {
      if (!warned) {
        warned = true;
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
    };
  })();
  exports.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function useColors2() {
    if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
      return false;
    }
    return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function formatArgs2(args) {
    args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
    if (!this.useColors) {
      return;
    }
    const c1 = "color: " + this.color;
    args.splice(1, 0, c1, "color: inherit");
    let index = 0;
    let lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, (match32) => {
      if (match32 === "%%") {
        return;
      }
      index++;
      if (match32 === "%c") {
        lastC = index;
      }
    });
    args.splice(lastC, 0, c1);
  }
  exports.log = console.debug || console.log || (() => {
  });
  function save2(namespaces) {
    try {
      if (namespaces) {
        exports.storage.setItem("debug", namespaces);
      } else {
        exports.storage.removeItem("debug");
      }
    } catch (error) {
    }
  }
  function load2() {
    let r2;
    try {
      r2 = exports.storage.getItem("debug");
    } catch (error) {
    }
    if (!r2 && typeof process !== "undefined" && "env" in process) {
      r2 = process.env.DEBUG;
    }
    return r2;
  }
  function localstorage() {
    try {
      return localStorage;
    } catch (error) {
    }
  }
  module.exports = common(exports);
  const { formatters } = module.exports;
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
});
browser$1.colors;
browser$1.destroy;
browser$1.formatArgs;
browser$1.load;
browser$1.log;
browser$1.save;
browser$1.storage;
browser$1.useColors;
var DenoStdInternalError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "DenoStdInternalError";
  }
};
function assert(expr, msg = "") {
  if (!expr) {
    throw new DenoStdInternalError(msg);
  }
}
var CR = "\r".charCodeAt(0);
var LF = "\n".charCodeAt(0);
var DEFAULT_BUFFER_SIZE = 32 * 1024;
function readableStreamFromIterable(iterable) {
  const iterator = iterable[Symbol.asyncIterator]?.() ?? iterable[Symbol.iterator]?.();
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    async cancel(reason) {
      if (typeof iterator.throw == "function") {
        try {
          await iterator.throw(reason);
        } catch {
        }
      }
    }
  });
}
async function* iterateReader(r5, options) {
  const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
  const b1 = new Uint8Array(bufSize);
  while (true) {
    const result = await r5.read(b1);
    if (result === null) {
      break;
    }
    yield b1.subarray(0, result);
  }
}
"\r".charCodeAt(0);
"\n".charCodeAt(0);
var isDeno = typeof Deno !== "undefined";
var baseFetchConfig = (_apiRoot) => ({});
var toRaw = Symbol("InputFile data");
var GrammyError = class extends Error {
  ok;
  error_code;
  description;
  parameters;
  constructor(message, err, method, payload) {
    super(`${message} (${err.error_code}: ${err.description})`);
    this.method = method;
    this.payload = payload;
    this.ok = false;
    this.name = "GrammyError";
    this.error_code = err.error_code;
    this.description = err.description;
    this.parameters = err.parameters ?? {};
  }
  method;
  payload;
};
function toGrammyError(err, method, payload) {
  return new GrammyError(`Call to '${method}' failed!`, err, method, payload);
}
var HttpError = class extends Error {
  constructor(message, error) {
    super(message);
    this.error = error;
    this.name = "HttpError";
  }
  error;
};
function isTelegramError(err) {
  return typeof err === "object" && err !== null && "status" in err && "statusText" in err;
}
function toHttpError(method, sensitiveLogs) {
  return (err) => {
    let msg = `Network request for '${method}' failed!`;
    if (isTelegramError(err))
      msg += ` (${err.status}: ${err.statusText})`;
    if (sensitiveLogs && err instanceof Error)
      msg += ` ${err.message}`;
    throw new HttpError(msg, err);
  };
}
var osType = (() => {
  const { Deno: Deno2 } = globalThis;
  if (typeof Deno2?.build?.os === "string") {
    return Deno2.build.os;
  }
  const { navigator: navigator2 } = globalThis;
  if (navigator2?.appVersion?.includes?.("Win")) {
    return "windows";
  }
  return "linux";
})();
var isWindows = osType === "windows";
var CHAR_FORWARD_SLASH = 47;
function assertPath(path3) {
  if (typeof path3 !== "string") {
    throw new TypeError(`Path must be a string. Received ${JSON.stringify(path3)}`);
  }
}
function isPosixPathSeparator(code) {
  return code === 47;
}
function isPathSeparator(code) {
  return isPosixPathSeparator(code) || code === 92;
}
function isWindowsDeviceRoot(code) {
  return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString(path4, allowAboveRoot, separator, isPathSeparator1) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code;
  for (let i7 = 0, len = path4.length; i7 <= len; ++i7) {
    if (i7 < len)
      code = path4.charCodeAt(i7);
    else if (isPathSeparator1(code))
      break;
    else
      code = CHAR_FORWARD_SLASH;
    if (isPathSeparator1(code)) {
      if (lastSlash === i7 - 1 || dots === 1) {
      } else if (lastSlash !== i7 - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
            }
            lastSlash = i7;
            dots = 0;
            continue;
          } else if (res.length === 2 || res.length === 1) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i7;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += `${separator}..`;
          else
            res = "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += separator + path4.slice(lastSlash + 1, i7);
        else
          res = path4.slice(lastSlash + 1, i7);
        lastSegmentLength = i7 - lastSlash - 1;
      }
      lastSlash = i7;
      dots = 0;
    } else if (code === 46 && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
function _format(sep3, pathObject) {
  const dir = pathObject.dir || pathObject.root;
  const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
  if (!dir)
    return base;
  if (dir === pathObject.root)
    return dir + base;
  return dir + sep3 + base;
}
var WHITESPACE_ENCODINGS = {
  "	": "%09",
  "\n": "%0A",
  "\v": "%0B",
  "\f": "%0C",
  "\r": "%0D",
  " ": "%20"
};
function encodeWhitespace(string) {
  return string.replaceAll(/[\s]/g, (c3) => {
    return WHITESPACE_ENCODINGS[c3] ?? c3;
  });
}
var sep = "\\";
var delimiter = ";";
function resolve(...pathSegments) {
  let resolvedDevice = "";
  let resolvedTail = "";
  let resolvedAbsolute = false;
  for (let i8 = pathSegments.length - 1; i8 >= -1; i8--) {
    let path5;
    const { Deno: Deno2 } = globalThis;
    if (i8 >= 0) {
      path5 = pathSegments[i8];
    } else if (!resolvedDevice) {
      if (typeof Deno2?.cwd !== "function") {
        throw new TypeError("Resolved a drive-letter-less path without a CWD.");
      }
      path5 = Deno2.cwd();
    } else {
      if (typeof Deno2?.env?.get !== "function" || typeof Deno2?.cwd !== "function") {
        throw new TypeError("Resolved a relative path without a CWD.");
      }
      path5 = Deno2.cwd();
      if (path5 === void 0 || path5.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
        path5 = `${resolvedDevice}\\`;
      }
    }
    assertPath(path5);
    const len = path5.length;
    if (len === 0)
      continue;
    let rootEnd = 0;
    let device = "";
    let isAbsolute12 = false;
    const code = path5.charCodeAt(0);
    if (len > 1) {
      if (isPathSeparator(code)) {
        isAbsolute12 = true;
        if (isPathSeparator(path5.charCodeAt(1))) {
          let j = 2;
          let last = j;
          for (; j < len; ++j) {
            if (isPathSeparator(path5.charCodeAt(j)))
              break;
          }
          if (j < len && j !== last) {
            const firstPart = path5.slice(last, j);
            last = j;
            for (; j < len; ++j) {
              if (!isPathSeparator(path5.charCodeAt(j)))
                break;
            }
            if (j < len && j !== last) {
              last = j;
              for (; j < len; ++j) {
                if (isPathSeparator(path5.charCodeAt(j)))
                  break;
              }
              if (j === len) {
                device = `\\\\${firstPart}\\${path5.slice(last)}`;
                rootEnd = j;
              } else if (j !== last) {
                device = `\\\\${firstPart}\\${path5.slice(last, j)}`;
                rootEnd = j;
              }
            }
          }
        } else {
          rootEnd = 1;
        }
      } else if (isWindowsDeviceRoot(code)) {
        if (path5.charCodeAt(1) === 58) {
          device = path5.slice(0, 2);
          rootEnd = 2;
          if (len > 2) {
            if (isPathSeparator(path5.charCodeAt(2))) {
              isAbsolute12 = true;
              rootEnd = 3;
            }
          }
        }
      }
    } else if (isPathSeparator(code)) {
      rootEnd = 1;
      isAbsolute12 = true;
    }
    if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
      continue;
    }
    if (resolvedDevice.length === 0 && device.length > 0) {
      resolvedDevice = device;
    }
    if (!resolvedAbsolute) {
      resolvedTail = `${path5.slice(rootEnd)}\\${resolvedTail}`;
      resolvedAbsolute = isAbsolute12;
    }
    if (resolvedAbsolute && resolvedDevice.length > 0)
      break;
  }
  resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
  return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize(path6) {
  assertPath(path6);
  const len = path6.length;
  if (len === 0)
    return ".";
  let rootEnd = 0;
  let device;
  let isAbsolute22 = false;
  const code = path6.charCodeAt(0);
  if (len > 1) {
    if (isPathSeparator(code)) {
      isAbsolute22 = true;
      if (isPathSeparator(path6.charCodeAt(1))) {
        let j = 2;
        let last = j;
        for (; j < len; ++j) {
          if (isPathSeparator(path6.charCodeAt(j)))
            break;
        }
        if (j < len && j !== last) {
          const firstPart = path6.slice(last, j);
          last = j;
          for (; j < len; ++j) {
            if (!isPathSeparator(path6.charCodeAt(j)))
              break;
          }
          if (j < len && j !== last) {
            last = j;
            for (; j < len; ++j) {
              if (isPathSeparator(path6.charCodeAt(j)))
                break;
            }
            if (j === len) {
              return `\\\\${firstPart}\\${path6.slice(last)}\\`;
            } else if (j !== last) {
              device = `\\\\${firstPart}\\${path6.slice(last, j)}`;
              rootEnd = j;
            }
          }
        }
      } else {
        rootEnd = 1;
      }
    } else if (isWindowsDeviceRoot(code)) {
      if (path6.charCodeAt(1) === 58) {
        device = path6.slice(0, 2);
        rootEnd = 2;
        if (len > 2) {
          if (isPathSeparator(path6.charCodeAt(2))) {
            isAbsolute22 = true;
            rootEnd = 3;
          }
        }
      }
    }
  } else if (isPathSeparator(code)) {
    return "\\";
  }
  let tail;
  if (rootEnd < len) {
    tail = normalizeString(path6.slice(rootEnd), !isAbsolute22, "\\", isPathSeparator);
  } else {
    tail = "";
  }
  if (tail.length === 0 && !isAbsolute22)
    tail = ".";
  if (tail.length > 0 && isPathSeparator(path6.charCodeAt(len - 1))) {
    tail += "\\";
  }
  if (device === void 0) {
    if (isAbsolute22) {
      if (tail.length > 0)
        return `\\${tail}`;
      else
        return "\\";
    } else if (tail.length > 0) {
      return tail;
    } else {
      return "";
    }
  } else if (isAbsolute22) {
    if (tail.length > 0)
      return `${device}\\${tail}`;
    else
      return `${device}\\`;
  } else if (tail.length > 0) {
    return device + tail;
  } else {
    return device;
  }
}
function isAbsolute(path7) {
  assertPath(path7);
  const len = path7.length;
  if (len === 0)
    return false;
  const code = path7.charCodeAt(0);
  if (isPathSeparator(code)) {
    return true;
  } else if (isWindowsDeviceRoot(code)) {
    if (len > 2 && path7.charCodeAt(1) === 58) {
      if (isPathSeparator(path7.charCodeAt(2)))
        return true;
    }
  }
  return false;
}
function join(...paths) {
  const pathsCount = paths.length;
  if (pathsCount === 0)
    return ".";
  let joined;
  let firstPart = null;
  for (let i9 = 0; i9 < pathsCount; ++i9) {
    const path8 = paths[i9];
    assertPath(path8);
    if (path8.length > 0) {
      if (joined === void 0)
        joined = firstPart = path8;
      else
        joined += `\\${path8}`;
    }
  }
  if (joined === void 0)
    return ".";
  let needsReplace = true;
  let slashCount = 0;
  assert(firstPart != null);
  if (isPathSeparator(firstPart.charCodeAt(0))) {
    ++slashCount;
    const firstLen = firstPart.length;
    if (firstLen > 1) {
      if (isPathSeparator(firstPart.charCodeAt(1))) {
        ++slashCount;
        if (firstLen > 2) {
          if (isPathSeparator(firstPart.charCodeAt(2)))
            ++slashCount;
          else {
            needsReplace = false;
          }
        }
      }
    }
  }
  if (needsReplace) {
    for (; slashCount < joined.length; ++slashCount) {
      if (!isPathSeparator(joined.charCodeAt(slashCount)))
        break;
    }
    if (slashCount >= 2)
      joined = `\\${joined.slice(slashCount)}`;
  }
  return normalize(joined);
}
function relative(from, to) {
  assertPath(from);
  assertPath(to);
  if (from === to)
    return "";
  const fromOrig = resolve(from);
  const toOrig = resolve(to);
  if (fromOrig === toOrig)
    return "";
  from = fromOrig.toLowerCase();
  to = toOrig.toLowerCase();
  if (from === to)
    return "";
  let fromStart = 0;
  let fromEnd = from.length;
  for (; fromStart < fromEnd; ++fromStart) {
    if (from.charCodeAt(fromStart) !== 92)
      break;
  }
  for (; fromEnd - 1 > fromStart; --fromEnd) {
    if (from.charCodeAt(fromEnd - 1) !== 92)
      break;
  }
  const fromLen = fromEnd - fromStart;
  let toStart = 0;
  let toEnd = to.length;
  for (; toStart < toEnd; ++toStart) {
    if (to.charCodeAt(toStart) !== 92)
      break;
  }
  for (; toEnd - 1 > toStart; --toEnd) {
    if (to.charCodeAt(toEnd - 1) !== 92)
      break;
  }
  const toLen = toEnd - toStart;
  const length = fromLen < toLen ? fromLen : toLen;
  let lastCommonSep = -1;
  let i10 = 0;
  for (; i10 <= length; ++i10) {
    if (i10 === length) {
      if (toLen > length) {
        if (to.charCodeAt(toStart + i10) === 92) {
          return toOrig.slice(toStart + i10 + 1);
        } else if (i10 === 2) {
          return toOrig.slice(toStart + i10);
        }
      }
      if (fromLen > length) {
        if (from.charCodeAt(fromStart + i10) === 92) {
          lastCommonSep = i10;
        } else if (i10 === 2) {
          lastCommonSep = 3;
        }
      }
      break;
    }
    const fromCode = from.charCodeAt(fromStart + i10);
    const toCode = to.charCodeAt(toStart + i10);
    if (fromCode !== toCode)
      break;
    else if (fromCode === 92)
      lastCommonSep = i10;
  }
  if (i10 !== length && lastCommonSep === -1) {
    return toOrig;
  }
  let out = "";
  if (lastCommonSep === -1)
    lastCommonSep = 0;
  for (i10 = fromStart + lastCommonSep + 1; i10 <= fromEnd; ++i10) {
    if (i10 === fromEnd || from.charCodeAt(i10) === 92) {
      if (out.length === 0)
        out += "..";
      else
        out += "\\..";
    }
  }
  if (out.length > 0) {
    return out + toOrig.slice(toStart + lastCommonSep, toEnd);
  } else {
    toStart += lastCommonSep;
    if (toOrig.charCodeAt(toStart) === 92)
      ++toStart;
    return toOrig.slice(toStart, toEnd);
  }
}
function toNamespacedPath(path9) {
  if (typeof path9 !== "string")
    return path9;
  if (path9.length === 0)
    return "";
  const resolvedPath = resolve(path9);
  if (resolvedPath.length >= 3) {
    if (resolvedPath.charCodeAt(0) === 92) {
      if (resolvedPath.charCodeAt(1) === 92) {
        const code = resolvedPath.charCodeAt(2);
        if (code !== 63 && code !== 46) {
          return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
        }
      }
    } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
      if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
        return `\\\\?\\${resolvedPath}`;
      }
    }
  }
  return path9;
}
function dirname(path10) {
  assertPath(path10);
  const len = path10.length;
  if (len === 0)
    return ".";
  let rootEnd = -1;
  let end = -1;
  let matchedSlash = true;
  let offset = 0;
  const code = path10.charCodeAt(0);
  if (len > 1) {
    if (isPathSeparator(code)) {
      rootEnd = offset = 1;
      if (isPathSeparator(path10.charCodeAt(1))) {
        let j = 2;
        let last = j;
        for (; j < len; ++j) {
          if (isPathSeparator(path10.charCodeAt(j)))
            break;
        }
        if (j < len && j !== last) {
          last = j;
          for (; j < len; ++j) {
            if (!isPathSeparator(path10.charCodeAt(j)))
              break;
          }
          if (j < len && j !== last) {
            last = j;
            for (; j < len; ++j) {
              if (isPathSeparator(path10.charCodeAt(j)))
                break;
            }
            if (j === len) {
              return path10;
            }
            if (j !== last) {
              rootEnd = offset = j + 1;
            }
          }
        }
      }
    } else if (isWindowsDeviceRoot(code)) {
      if (path10.charCodeAt(1) === 58) {
        rootEnd = offset = 2;
        if (len > 2) {
          if (isPathSeparator(path10.charCodeAt(2)))
            rootEnd = offset = 3;
        }
      }
    }
  } else if (isPathSeparator(code)) {
    return path10;
  }
  for (let i11 = len - 1; i11 >= offset; --i11) {
    if (isPathSeparator(path10.charCodeAt(i11))) {
      if (!matchedSlash) {
        end = i11;
        break;
      }
    } else {
      matchedSlash = false;
    }
  }
  if (end === -1) {
    if (rootEnd === -1)
      return ".";
    else
      end = rootEnd;
  }
  return path10.slice(0, end);
}
function basename(path11, ext = "") {
  if (ext !== void 0 && typeof ext !== "string") {
    throw new TypeError('"ext" argument must be a string');
  }
  assertPath(path11);
  let start = 0;
  let end = -1;
  let matchedSlash = true;
  let i12;
  if (path11.length >= 2) {
    const drive = path11.charCodeAt(0);
    if (isWindowsDeviceRoot(drive)) {
      if (path11.charCodeAt(1) === 58)
        start = 2;
    }
  }
  if (ext !== void 0 && ext.length > 0 && ext.length <= path11.length) {
    if (ext.length === path11.length && ext === path11)
      return "";
    let extIdx = ext.length - 1;
    let firstNonSlashEnd = -1;
    for (i12 = path11.length - 1; i12 >= start; --i12) {
      const code = path11.charCodeAt(i12);
      if (isPathSeparator(code)) {
        if (!matchedSlash) {
          start = i12 + 1;
          break;
        }
      } else {
        if (firstNonSlashEnd === -1) {
          matchedSlash = false;
          firstNonSlashEnd = i12 + 1;
        }
        if (extIdx >= 0) {
          if (code === ext.charCodeAt(extIdx)) {
            if (--extIdx === -1) {
              end = i12;
            }
          } else {
            extIdx = -1;
            end = firstNonSlashEnd;
          }
        }
      }
    }
    if (start === end)
      end = firstNonSlashEnd;
    else if (end === -1)
      end = path11.length;
    return path11.slice(start, end);
  } else {
    for (i12 = path11.length - 1; i12 >= start; --i12) {
      if (isPathSeparator(path11.charCodeAt(i12))) {
        if (!matchedSlash) {
          start = i12 + 1;
          break;
        }
      } else if (end === -1) {
        matchedSlash = false;
        end = i12 + 1;
      }
    }
    if (end === -1)
      return "";
    return path11.slice(start, end);
  }
}
function extname(path12) {
  assertPath(path12);
  let start = 0;
  let startDot = -1;
  let startPart = 0;
  let end = -1;
  let matchedSlash = true;
  let preDotState = 0;
  if (path12.length >= 2 && path12.charCodeAt(1) === 58 && isWindowsDeviceRoot(path12.charCodeAt(0))) {
    start = startPart = 2;
  }
  for (let i13 = path12.length - 1; i13 >= start; --i13) {
    const code = path12.charCodeAt(i13);
    if (isPathSeparator(code)) {
      if (!matchedSlash) {
        startPart = i13 + 1;
        break;
      }
      continue;
    }
    if (end === -1) {
      matchedSlash = false;
      end = i13 + 1;
    }
    if (code === 46) {
      if (startDot === -1)
        startDot = i13;
      else if (preDotState !== 1)
        preDotState = 1;
    } else if (startDot !== -1) {
      preDotState = -1;
    }
  }
  if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return "";
  }
  return path12.slice(startDot, end);
}
function format(pathObject) {
  if (pathObject === null || typeof pathObject !== "object") {
    throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
  }
  return _format("\\", pathObject);
}
function parse2(path13) {
  assertPath(path13);
  const ret = {
    root: "",
    dir: "",
    base: "",
    ext: "",
    name: ""
  };
  const len = path13.length;
  if (len === 0)
    return ret;
  let rootEnd = 0;
  let code = path13.charCodeAt(0);
  if (len > 1) {
    if (isPathSeparator(code)) {
      rootEnd = 1;
      if (isPathSeparator(path13.charCodeAt(1))) {
        let j = 2;
        let last = j;
        for (; j < len; ++j) {
          if (isPathSeparator(path13.charCodeAt(j)))
            break;
        }
        if (j < len && j !== last) {
          last = j;
          for (; j < len; ++j) {
            if (!isPathSeparator(path13.charCodeAt(j)))
              break;
          }
          if (j < len && j !== last) {
            last = j;
            for (; j < len; ++j) {
              if (isPathSeparator(path13.charCodeAt(j)))
                break;
            }
            if (j === len) {
              rootEnd = j;
            } else if (j !== last) {
              rootEnd = j + 1;
            }
          }
        }
      }
    } else if (isWindowsDeviceRoot(code)) {
      if (path13.charCodeAt(1) === 58) {
        rootEnd = 2;
        if (len > 2) {
          if (isPathSeparator(path13.charCodeAt(2))) {
            if (len === 3) {
              ret.root = ret.dir = path13;
              return ret;
            }
            rootEnd = 3;
          }
        } else {
          ret.root = ret.dir = path13;
          return ret;
        }
      }
    }
  } else if (isPathSeparator(code)) {
    ret.root = ret.dir = path13;
    return ret;
  }
  if (rootEnd > 0)
    ret.root = path13.slice(0, rootEnd);
  let startDot = -1;
  let startPart = rootEnd;
  let end = -1;
  let matchedSlash = true;
  let i14 = path13.length - 1;
  let preDotState = 0;
  for (; i14 >= rootEnd; --i14) {
    code = path13.charCodeAt(i14);
    if (isPathSeparator(code)) {
      if (!matchedSlash) {
        startPart = i14 + 1;
        break;
      }
      continue;
    }
    if (end === -1) {
      matchedSlash = false;
      end = i14 + 1;
    }
    if (code === 46) {
      if (startDot === -1)
        startDot = i14;
      else if (preDotState !== 1)
        preDotState = 1;
    } else if (startDot !== -1) {
      preDotState = -1;
    }
  }
  if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    if (end !== -1) {
      ret.base = ret.name = path13.slice(startPart, end);
    }
  } else {
    ret.name = path13.slice(startPart, startDot);
    ret.base = path13.slice(startPart, end);
    ret.ext = path13.slice(startDot, end);
  }
  if (startPart > 0 && startPart !== rootEnd) {
    ret.dir = path13.slice(0, startPart - 1);
  } else
    ret.dir = ret.root;
  return ret;
}
function fromFileUrl(url) {
  url = url instanceof URL ? url : new URL(url);
  if (url.protocol != "file:") {
    throw new TypeError("Must be a file URL.");
  }
  let path14 = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
  if (url.hostname != "") {
    path14 = `\\\\${url.hostname}${path14}`;
  }
  return path14;
}
function toFileUrl(path15) {
  if (!isAbsolute(path15)) {
    throw new TypeError("Must be an absolute path.");
  }
  const [, hostname, pathname] = path15.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
  const url = new URL("file:///");
  url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
  if (hostname != null && hostname != "localhost") {
    url.hostname = hostname;
    if (!url.hostname) {
      throw new TypeError("Invalid hostname.");
    }
  }
  return url;
}
var mod = {
  sep,
  delimiter,
  resolve,
  normalize,
  isAbsolute,
  join,
  relative,
  toNamespacedPath,
  dirname,
  basename,
  extname,
  format,
  parse: parse2,
  fromFileUrl,
  toFileUrl
};
var sep1 = "/";
var delimiter1 = ":";
function resolve1(...pathSegments) {
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let i15 = pathSegments.length - 1; i15 >= -1 && !resolvedAbsolute; i15--) {
    let path16;
    if (i15 >= 0)
      path16 = pathSegments[i15];
    else {
      const { Deno: Deno2 } = globalThis;
      if (typeof Deno2?.cwd !== "function") {
        throw new TypeError("Resolved a relative path without a CWD.");
      }
      path16 = Deno2.cwd();
    }
    assertPath(path16);
    if (path16.length === 0) {
      continue;
    }
    resolvedPath = `${path16}/${resolvedPath}`;
    resolvedAbsolute = path16.charCodeAt(0) === CHAR_FORWARD_SLASH;
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
  if (resolvedAbsolute) {
    if (resolvedPath.length > 0)
      return `/${resolvedPath}`;
    else
      return "/";
  } else if (resolvedPath.length > 0)
    return resolvedPath;
  else
    return ".";
}
function normalize1(path17) {
  assertPath(path17);
  if (path17.length === 0)
    return ".";
  const isAbsolute12 = path17.charCodeAt(0) === 47;
  const trailingSeparator = path17.charCodeAt(path17.length - 1) === 47;
  path17 = normalizeString(path17, !isAbsolute12, "/", isPosixPathSeparator);
  if (path17.length === 0 && !isAbsolute12)
    path17 = ".";
  if (path17.length > 0 && trailingSeparator)
    path17 += "/";
  if (isAbsolute12)
    return `/${path17}`;
  return path17;
}
function isAbsolute1(path18) {
  assertPath(path18);
  return path18.length > 0 && path18.charCodeAt(0) === 47;
}
function join1(...paths) {
  if (paths.length === 0)
    return ".";
  let joined;
  for (let i16 = 0, len = paths.length; i16 < len; ++i16) {
    const path19 = paths[i16];
    assertPath(path19);
    if (path19.length > 0) {
      if (!joined)
        joined = path19;
      else
        joined += `/${path19}`;
    }
  }
  if (!joined)
    return ".";
  return normalize1(joined);
}
function relative1(from, to) {
  assertPath(from);
  assertPath(to);
  if (from === to)
    return "";
  from = resolve1(from);
  to = resolve1(to);
  if (from === to)
    return "";
  let fromStart = 1;
  const fromEnd = from.length;
  for (; fromStart < fromEnd; ++fromStart) {
    if (from.charCodeAt(fromStart) !== 47)
      break;
  }
  const fromLen = fromEnd - fromStart;
  let toStart = 1;
  const toEnd = to.length;
  for (; toStart < toEnd; ++toStart) {
    if (to.charCodeAt(toStart) !== 47)
      break;
  }
  const toLen = toEnd - toStart;
  const length = fromLen < toLen ? fromLen : toLen;
  let lastCommonSep = -1;
  let i17 = 0;
  for (; i17 <= length; ++i17) {
    if (i17 === length) {
      if (toLen > length) {
        if (to.charCodeAt(toStart + i17) === 47) {
          return to.slice(toStart + i17 + 1);
        } else if (i17 === 0) {
          return to.slice(toStart + i17);
        }
      } else if (fromLen > length) {
        if (from.charCodeAt(fromStart + i17) === 47) {
          lastCommonSep = i17;
        } else if (i17 === 0) {
          lastCommonSep = 0;
        }
      }
      break;
    }
    const fromCode = from.charCodeAt(fromStart + i17);
    const toCode = to.charCodeAt(toStart + i17);
    if (fromCode !== toCode)
      break;
    else if (fromCode === 47)
      lastCommonSep = i17;
  }
  let out = "";
  for (i17 = fromStart + lastCommonSep + 1; i17 <= fromEnd; ++i17) {
    if (i17 === fromEnd || from.charCodeAt(i17) === 47) {
      if (out.length === 0)
        out += "..";
      else
        out += "/..";
    }
  }
  if (out.length > 0)
    return out + to.slice(toStart + lastCommonSep);
  else {
    toStart += lastCommonSep;
    if (to.charCodeAt(toStart) === 47)
      ++toStart;
    return to.slice(toStart);
  }
}
function toNamespacedPath1(path20) {
  return path20;
}
function dirname1(path21) {
  assertPath(path21);
  if (path21.length === 0)
    return ".";
  const hasRoot = path21.charCodeAt(0) === 47;
  let end = -1;
  let matchedSlash = true;
  for (let i18 = path21.length - 1; i18 >= 1; --i18) {
    if (path21.charCodeAt(i18) === 47) {
      if (!matchedSlash) {
        end = i18;
        break;
      }
    } else {
      matchedSlash = false;
    }
  }
  if (end === -1)
    return hasRoot ? "/" : ".";
  if (hasRoot && end === 1)
    return "//";
  return path21.slice(0, end);
}
function basename1(path22, ext = "") {
  if (ext !== void 0 && typeof ext !== "string") {
    throw new TypeError('"ext" argument must be a string');
  }
  assertPath(path22);
  let start = 0;
  let end = -1;
  let matchedSlash = true;
  let i19;
  if (ext !== void 0 && ext.length > 0 && ext.length <= path22.length) {
    if (ext.length === path22.length && ext === path22)
      return "";
    let extIdx = ext.length - 1;
    let firstNonSlashEnd = -1;
    for (i19 = path22.length - 1; i19 >= 0; --i19) {
      const code = path22.charCodeAt(i19);
      if (code === 47) {
        if (!matchedSlash) {
          start = i19 + 1;
          break;
        }
      } else {
        if (firstNonSlashEnd === -1) {
          matchedSlash = false;
          firstNonSlashEnd = i19 + 1;
        }
        if (extIdx >= 0) {
          if (code === ext.charCodeAt(extIdx)) {
            if (--extIdx === -1) {
              end = i19;
            }
          } else {
            extIdx = -1;
            end = firstNonSlashEnd;
          }
        }
      }
    }
    if (start === end)
      end = firstNonSlashEnd;
    else if (end === -1)
      end = path22.length;
    return path22.slice(start, end);
  } else {
    for (i19 = path22.length - 1; i19 >= 0; --i19) {
      if (path22.charCodeAt(i19) === 47) {
        if (!matchedSlash) {
          start = i19 + 1;
          break;
        }
      } else if (end === -1) {
        matchedSlash = false;
        end = i19 + 1;
      }
    }
    if (end === -1)
      return "";
    return path22.slice(start, end);
  }
}
function extname1(path23) {
  assertPath(path23);
  let startDot = -1;
  let startPart = 0;
  let end = -1;
  let matchedSlash = true;
  let preDotState = 0;
  for (let i20 = path23.length - 1; i20 >= 0; --i20) {
    const code = path23.charCodeAt(i20);
    if (code === 47) {
      if (!matchedSlash) {
        startPart = i20 + 1;
        break;
      }
      continue;
    }
    if (end === -1) {
      matchedSlash = false;
      end = i20 + 1;
    }
    if (code === 46) {
      if (startDot === -1)
        startDot = i20;
      else if (preDotState !== 1)
        preDotState = 1;
    } else if (startDot !== -1) {
      preDotState = -1;
    }
  }
  if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return "";
  }
  return path23.slice(startDot, end);
}
function format1(pathObject) {
  if (pathObject === null || typeof pathObject !== "object") {
    throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
  }
  return _format("/", pathObject);
}
function parse3(path24) {
  assertPath(path24);
  const ret = {
    root: "",
    dir: "",
    base: "",
    ext: "",
    name: ""
  };
  if (path24.length === 0)
    return ret;
  const isAbsolute22 = path24.charCodeAt(0) === 47;
  let start;
  if (isAbsolute22) {
    ret.root = "/";
    start = 1;
  } else {
    start = 0;
  }
  let startDot = -1;
  let startPart = 0;
  let end = -1;
  let matchedSlash = true;
  let i21 = path24.length - 1;
  let preDotState = 0;
  for (; i21 >= start; --i21) {
    const code = path24.charCodeAt(i21);
    if (code === 47) {
      if (!matchedSlash) {
        startPart = i21 + 1;
        break;
      }
      continue;
    }
    if (end === -1) {
      matchedSlash = false;
      end = i21 + 1;
    }
    if (code === 46) {
      if (startDot === -1)
        startDot = i21;
      else if (preDotState !== 1)
        preDotState = 1;
    } else if (startDot !== -1) {
      preDotState = -1;
    }
  }
  if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    if (end !== -1) {
      if (startPart === 0 && isAbsolute22) {
        ret.base = ret.name = path24.slice(1, end);
      } else {
        ret.base = ret.name = path24.slice(startPart, end);
      }
    }
  } else {
    if (startPart === 0 && isAbsolute22) {
      ret.name = path24.slice(1, startDot);
      ret.base = path24.slice(1, end);
    } else {
      ret.name = path24.slice(startPart, startDot);
      ret.base = path24.slice(startPart, end);
    }
    ret.ext = path24.slice(startDot, end);
  }
  if (startPart > 0)
    ret.dir = path24.slice(0, startPart - 1);
  else if (isAbsolute22)
    ret.dir = "/";
  return ret;
}
function fromFileUrl1(url) {
  url = url instanceof URL ? url : new URL(url);
  if (url.protocol != "file:") {
    throw new TypeError("Must be a file URL.");
  }
  return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl1(path25) {
  if (!isAbsolute1(path25)) {
    throw new TypeError("Must be an absolute path.");
  }
  const url = new URL("file:///");
  url.pathname = encodeWhitespace(path25.replace(/%/g, "%25").replace(/\\/g, "%5C"));
  return url;
}
var mod1 = {
  sep: sep1,
  delimiter: delimiter1,
  resolve: resolve1,
  normalize: normalize1,
  isAbsolute: isAbsolute1,
  join: join1,
  relative: relative1,
  toNamespacedPath: toNamespacedPath1,
  dirname: dirname1,
  basename: basename1,
  extname: extname1,
  format: format1,
  parse: parse3,
  fromFileUrl: fromFileUrl1,
  toFileUrl: toFileUrl1
};
var path = isWindows ? mod : mod1;
var { join: join2, normalize: normalize2 } = path;
var path1 = isWindows ? mod : mod1;
var { basename: basename2, delimiter: delimiter2, dirname: dirname2, extname: extname2, format: format2, fromFileUrl: fromFileUrl2, isAbsolute: isAbsolute2, join: join3, normalize: normalize3, parse: parse4, relative: relative2, resolve: resolve2, sep: sep2, toFileUrl: toFileUrl2, toNamespacedPath: toNamespacedPath2 } = path1;
var l = Object.create;
var o = Object.defineProperty;
var r = Object.getOwnPropertyDescriptor;
var m1 = Object.getOwnPropertyNames;
var n = Object.getPrototypeOf;
var s1 = Object.prototype.hasOwnProperty;
var i = (t, e) => () => (e || t((e = {
  exports: {}
}).exports, e), e.exports);
var p = (t, e, d1, f) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let _ of m1(e))
      !s1.call(t, _) && _ !== d1 && o(t, _, {
        get: () => e[_],
        enumerable: !(f = r(e, _)) || f.enumerable
      });
  return t;
};
var c = (t, e, d2) => (d2 = t != null ? l(n(t)) : {}, p(e || !t || !t.__esModule ? o(d2, "default", {
  value: t,
  enumerable: true
}) : d2, t));
var u = i(() => {
});
var x = c(u());
var { default: a, ...b } = x;
var debug = browser$1("grammy:warn");
var InputFile = class {
  consumed = false;
  fileData;
  filename;
  constructor(file, filename) {
    this.fileData = file;
    filename ??= this.guessFilename(file);
    this.filename = filename;
    if (typeof file === "string" && (file.startsWith("http:") || file.startsWith("https:"))) {
      debug(`InputFile received the local file path '${file}' that looks like a URL. Is this a mistake?`);
    }
  }
  guessFilename(file) {
    if (typeof file === "string")
      return basename2(file);
    if (typeof file !== "object")
      return void 0;
    if ("url" in file)
      return basename2(file.url);
    if (!(file instanceof URL))
      return void 0;
    return basename2(file.pathname) || basename2(file.hostname);
  }
  async [toRaw]() {
    if (this.consumed) {
      throw new Error("Cannot reuse InputFile data source!");
    }
    const data = this.fileData;
    if (typeof data === "string") {
      if (!isDeno) {
        throw new Error("Reading files by path requires a Deno environment");
      }
      const file = await Deno.open(data);
      return iterateReader(file);
    }
    if (data instanceof Blob)
      return data.stream();
    if (isDenoFile(data))
      return iterateReader(data);
    if (data instanceof URL)
      return fetchFile(data);
    if ("url" in data)
      return fetchFile(data.url);
    if (!(data instanceof Uint8Array))
      this.consumed = true;
    return data;
  }
};
async function* fetchFile(url) {
  const { body } = await fetch(url);
  if (body === null) {
    throw new Error(`Download failed, no response body from '${url}'`);
  }
  yield* body;
}
function isDenoFile(data) {
  return isDeno && data instanceof Deno.FsFile;
}
function requiresFormDataUpload(payload) {
  return payload instanceof InputFile || typeof payload === "object" && payload !== null && Object.values(payload).some((v) => Array.isArray(v) ? v.some(requiresFormDataUpload) : v instanceof InputFile || requiresFormDataUpload(v));
}
function str(value) {
  return JSON.stringify(value, (_, v) => v ?? void 0);
}
function createJsonPayload(payload) {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      connection: "keep-alive"
    },
    body: str(payload)
  };
}
async function* protectItr(itr, onError) {
  try {
    yield* itr;
  } catch (err) {
    onError(err);
  }
}
function createFormDataPayload(payload, onError) {
  const boundary = createBoundary();
  const itr = payloadToMultipartItr(payload, boundary);
  const safeItr = protectItr(itr, onError);
  const stream = readableStreamFromIterable(safeItr);
  return {
    method: "POST",
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
      connection: "keep-alive"
    },
    body: stream
  };
}
function createBoundary() {
  return "----------" + randomId(32);
}
function randomId(length = 16) {
  return Array.from(Array(length)).map(() => Math.random().toString(36)[2] || 0).join("");
}
var enc = new TextEncoder();
async function* payloadToMultipartItr(payload, boundary) {
  const files = extractFiles(payload);
  yield enc.encode(`--${boundary}\r
`);
  const separator = enc.encode(`\r
--${boundary}\r
`);
  let first = true;
  for (const [key, value] of Object.entries(payload)) {
    if (value == null)
      continue;
    if (!first)
      yield separator;
    yield valuePart(key, typeof value === "object" ? str(value) : value);
    first = false;
  }
  for (const { id, origin, file } of files) {
    if (!first)
      yield separator;
    yield* filePart(id, origin, file);
    first = false;
  }
  yield enc.encode(`\r
--${boundary}--\r
`);
}
function extractFiles(value, key) {
  if (typeof value !== "object" || value === null)
    return [];
  return Object.entries(value).flatMap(([k, v]) => {
    const origin = key ?? k;
    if (Array.isArray(v))
      return v.flatMap((p6) => extractFiles(p6, origin));
    else if (v instanceof InputFile) {
      const id = randomId();
      Object.assign(value, {
        [k]: `attach://${id}`
      });
      return {
        id,
        origin,
        file: v
      };
    } else
      return extractFiles(v, origin);
  });
}
function valuePart(key, value) {
  return enc.encode(`content-disposition:form-data;name="${key}"\r
\r
${value}`);
}
async function* filePart(id, origin, input) {
  const filename = input.filename || `${origin}.${getExt(origin)}`;
  if (filename.includes("\r") || filename.includes("\n")) {
    throw new Error(`File paths cannot contain carriage-return (\\r) or newline (\\n) characters! Filename for property '${origin}' was:
"""
${filename}
"""`);
  }
  yield enc.encode(`content-disposition:form-data;name="${id}";filename=${filename}\r
content-type:application/octet-stream\r
\r
`);
  const data = await input[toRaw]();
  if (data instanceof Uint8Array)
    yield data;
  else
    yield* data;
}
function getExt(key) {
  switch (key) {
    case "photo":
      return "jpg";
    case "voice":
      return "ogg";
    case "audio":
      return "mp3";
    case "animation":
    case "video":
    case "video_note":
      return "mp4";
    case "sticker":
      return "webp";
    default:
      return "dat";
  }
}
var debug1 = browser$1("grammy:core");
function concatTransformer(prev, trans) {
  return (method, payload, signal) => trans(prev, method, payload, signal);
}
var ApiClient = class {
  options;
  hasUsedWebhookReply;
  installedTransformers;
  constructor(token1, options1 = {}, webhookReplyEnvelope = {}) {
    this.token = token1;
    this.webhookReplyEnvelope = webhookReplyEnvelope;
    this.hasUsedWebhookReply = false;
    this.installedTransformers = [];
    this.call = async (method, p7, signal) => {
      const payload = p7 ?? {};
      debug1(`Calling ${method}`);
      const opts = this.options;
      const formDataRequired = requiresFormDataUpload(payload);
      if (this.webhookReplyEnvelope.send !== void 0 && !this.hasUsedWebhookReply && !formDataRequired && opts.canUseWebhookReply(method)) {
        this.hasUsedWebhookReply = true;
        const config1 = createJsonPayload({
          ...payload,
          method
        });
        await this.webhookReplyEnvelope.send(config1.body);
        return {
          ok: true,
          result: true
        };
      }
      const controller = createAbortControllerFromSignal(signal);
      const timeout = createTimeout(controller, opts.timeoutSeconds, method);
      const streamErr = createStreamError(controller);
      const url = opts.buildUrl(opts.apiRoot, this.token, method);
      const config2 = formDataRequired ? createFormDataPayload(payload, (err) => streamErr.catch(err)) : createJsonPayload(payload);
      const sig = controller.signal;
      const options = {
        ...opts.baseFetchConfig,
        signal: sig,
        ...config2
      };
      const successPromise = fetch(url instanceof URL ? url.href : url, options).catch(toHttpError(method, opts.sensitiveLogs));
      const operations = [
        successPromise,
        streamErr.promise,
        timeout.promise
      ];
      try {
        const res = await Promise.race(operations);
        return await res.json();
      } finally {
        if (timeout.handle !== void 0)
          clearTimeout(timeout.handle);
      }
    };
    const apiRoot = options1.apiRoot ?? "https://api.telegram.org";
    this.options = {
      apiRoot,
      buildUrl: options1.buildUrl ?? ((root, token, method) => `${root}/bot${token}/${method}`),
      timeoutSeconds: options1.timeoutSeconds ?? 500,
      baseFetchConfig: {
        ...baseFetchConfig(apiRoot),
        ...options1.baseFetchConfig
      },
      canUseWebhookReply: options1.canUseWebhookReply ?? (() => false),
      sensitiveLogs: options1.sensitiveLogs ?? false
    };
    if (this.options.apiRoot.endsWith("/")) {
      throw new Error(`Remove the trailing '/' from the 'apiRoot' option (use '${this.options.apiRoot.substring(0, this.options.apiRoot.length - 1)}' instead of '${this.options.apiRoot}')`);
    }
  }
  call;
  use(...transformers) {
    this.call = transformers.reduce(concatTransformer, this.call);
    this.installedTransformers.push(...transformers);
    return this;
  }
  async callApi(method, payload, signal) {
    const data = await this.call(method, payload, signal);
    if (data.ok)
      return data.result;
    else
      throw toGrammyError(data, method, payload);
  }
  token;
  webhookReplyEnvelope;
};
function createRawApi(token, options, webhookReplyEnvelope) {
  const client = new ApiClient(token, options, webhookReplyEnvelope);
  const proxyHandler = {
    get(_, m3) {
      return m3 === "toJSON" ? "__internal" : client.callApi.bind(client, m3);
    },
    ...proxyMethods
  };
  const raw = new Proxy({}, proxyHandler);
  const installedTransformers = client.installedTransformers;
  const api = {
    raw,
    installedTransformers,
    use: (...t) => {
      client.use(...t);
      return api;
    }
  };
  return api;
}
var proxyMethods = {
  set() {
    return false;
  },
  defineProperty() {
    return false;
  },
  deleteProperty() {
    return false;
  },
  ownKeys() {
    return [];
  }
};
function createTimeout(controller, seconds, method) {
  let handle = void 0;
  const promise = new Promise((_, reject) => {
    handle = setTimeout(() => {
      const msg = `Request to '${method}' timed out after ${seconds} seconds`;
      reject(new Error(msg));
      controller.abort();
    }, 1e3 * seconds);
  });
  return {
    promise,
    handle
  };
}
function createStreamError(abortController) {
  let onError = (err) => {
    throw err;
  };
  const promise = new Promise((_, reject) => {
    onError = (err) => {
      reject(err);
      abortController.abort();
    };
  });
  return {
    promise,
    catch: onError
  };
}
function createAbortControllerFromSignal(signal) {
  const abortController = new AbortController();
  if (signal === void 0)
    return abortController;
  const sig = signal;
  function abort() {
    abortController.abort();
    sig.removeEventListener("abort", abort);
  }
  if (sig.aborted)
    abort();
  else
    sig.addEventListener("abort", abort);
  return {
    abort,
    signal: abortController.signal
  };
}
var Api = class {
  raw;
  config;
  constructor(token, config3, webhookReplyEnvelope) {
    const { raw, use, installedTransformers } = createRawApi(token, config3, webhookReplyEnvelope);
    this.raw = raw;
    this.config = {
      use,
      installedTransformers: () => [
        ...installedTransformers
      ]
    };
  }
  getUpdates(other, signal) {
    return this.raw.getUpdates({
      ...other
    }, signal);
  }
  setWebhook(url, other, signal) {
    return this.raw.setWebhook({
      url,
      ...other
    }, signal);
  }
  deleteWebhook(other, signal) {
    return this.raw.deleteWebhook({
      ...other
    }, signal);
  }
  getWebhookInfo(signal) {
    return this.raw.getWebhookInfo(signal);
  }
  getMe(signal) {
    return this.raw.getMe(signal);
  }
  logOut(signal) {
    return this.raw.logOut(signal);
  }
  close(signal) {
    return this.raw.close(signal);
  }
  sendMessage(chat_id, text, other, signal) {
    return this.raw.sendMessage({
      chat_id,
      text,
      ...other
    }, signal);
  }
  forwardMessage(chat_id, from_chat_id, message_id, other, signal) {
    return this.raw.forwardMessage({
      chat_id,
      from_chat_id,
      message_id,
      ...other
    }, signal);
  }
  copyMessage(chat_id, from_chat_id, message_id, other, signal) {
    return this.raw.copyMessage({
      chat_id,
      from_chat_id,
      message_id,
      ...other
    }, signal);
  }
  sendPhoto(chat_id, photo, other, signal) {
    return this.raw.sendPhoto({
      chat_id,
      photo,
      ...other
    }, signal);
  }
  sendAudio(chat_id, audio, other, signal) {
    return this.raw.sendAudio({
      chat_id,
      audio,
      ...other
    }, signal);
  }
  sendDocument(chat_id, document2, other, signal) {
    return this.raw.sendDocument({
      chat_id,
      document: document2,
      ...other
    }, signal);
  }
  sendVideo(chat_id, video, other, signal) {
    return this.raw.sendVideo({
      chat_id,
      video,
      ...other
    }, signal);
  }
  sendAnimation(chat_id, animation, other, signal) {
    return this.raw.sendAnimation({
      chat_id,
      animation,
      ...other
    }, signal);
  }
  sendVoice(chat_id, voice, other, signal) {
    return this.raw.sendVoice({
      chat_id,
      voice,
      ...other
    }, signal);
  }
  sendVideoNote(chat_id, video_note, other, signal) {
    return this.raw.sendVideoNote({
      chat_id,
      video_note,
      ...other
    }, signal);
  }
  sendMediaGroup(chat_id, media, other, signal) {
    return this.raw.sendMediaGroup({
      chat_id,
      media,
      ...other
    }, signal);
  }
  sendLocation(chat_id, latitude, longitude, other, signal) {
    return this.raw.sendLocation({
      chat_id,
      latitude,
      longitude,
      ...other
    }, signal);
  }
  editMessageLiveLocation(chat_id, message_id, latitude, longitude, other, signal) {
    return this.raw.editMessageLiveLocation({
      chat_id,
      message_id,
      latitude,
      longitude,
      ...other
    }, signal);
  }
  editMessageLiveLocationInline(inline_message_id, latitude, longitude, other, signal) {
    return this.raw.editMessageLiveLocation({
      inline_message_id,
      latitude,
      longitude,
      ...other
    }, signal);
  }
  stopMessageLiveLocation(chat_id, message_id, other, signal) {
    return this.raw.stopMessageLiveLocation({
      chat_id,
      message_id,
      ...other
    }, signal);
  }
  stopMessageLiveLocationInline(inline_message_id, other, signal) {
    return this.raw.stopMessageLiveLocation({
      inline_message_id,
      ...other
    }, signal);
  }
  sendVenue(chat_id, latitude, longitude, title4, address, other, signal) {
    return this.raw.sendVenue({
      chat_id,
      latitude,
      longitude,
      title: title4,
      address,
      ...other
    }, signal);
  }
  sendContact(chat_id, phone_number, first_name, other, signal) {
    return this.raw.sendContact({
      chat_id,
      phone_number,
      first_name,
      ...other
    }, signal);
  }
  sendPoll(chat_id, question, options, other, signal) {
    return this.raw.sendPoll({
      chat_id,
      question,
      options,
      ...other
    }, signal);
  }
  sendDice(chat_id, emoji, other, signal) {
    return this.raw.sendDice({
      chat_id,
      emoji,
      ...other
    }, signal);
  }
  sendChatAction(chat_id, action, signal) {
    return this.raw.sendChatAction({
      chat_id,
      action
    }, signal);
  }
  getUserProfilePhotos(user_id, other, signal) {
    return this.raw.getUserProfilePhotos({
      user_id,
      ...other
    }, signal);
  }
  getFile(file_id, signal) {
    return this.raw.getFile({
      file_id
    }, signal);
  }
  kickChatMember(...args) {
    return this.banChatMember(...args);
  }
  banChatMember(chat_id, user_id, other, signal) {
    return this.raw.banChatMember({
      chat_id,
      user_id,
      ...other
    }, signal);
  }
  unbanChatMember(chat_id, user_id, other, signal) {
    return this.raw.unbanChatMember({
      chat_id,
      user_id,
      ...other
    }, signal);
  }
  restrictChatMember(chat_id, user_id, permissions, other, signal) {
    return this.raw.restrictChatMember({
      chat_id,
      user_id,
      permissions,
      ...other
    }, signal);
  }
  promoteChatMember(chat_id, user_id, other, signal) {
    return this.raw.promoteChatMember({
      chat_id,
      user_id,
      ...other
    }, signal);
  }
  setChatAdministratorCustomTitle(chat_id, user_id, custom_title, signal) {
    return this.raw.setChatAdministratorCustomTitle({
      chat_id,
      user_id,
      custom_title
    }, signal);
  }
  banChatSenderChat(chat_id, sender_chat_id, signal) {
    return this.raw.banChatSenderChat({
      chat_id,
      sender_chat_id
    }, signal);
  }
  unbanChatSenderChat(chat_id, sender_chat_id, signal) {
    return this.raw.unbanChatSenderChat({
      chat_id,
      sender_chat_id
    }, signal);
  }
  setChatPermissions(chat_id, permissions, signal) {
    return this.raw.setChatPermissions({
      chat_id,
      permissions
    }, signal);
  }
  exportChatInviteLink(chat_id, signal) {
    return this.raw.exportChatInviteLink({
      chat_id
    }, signal);
  }
  createChatInviteLink(chat_id, other, signal) {
    return this.raw.createChatInviteLink({
      chat_id,
      ...other
    }, signal);
  }
  editChatInviteLink(chat_id, invite_link, other, signal) {
    return this.raw.editChatInviteLink({
      chat_id,
      invite_link,
      ...other
    }, signal);
  }
  revokeChatInviteLink(chat_id, invite_link, signal) {
    return this.raw.revokeChatInviteLink({
      chat_id,
      invite_link
    }, signal);
  }
  approveChatJoinRequest(chat_id, user_id, signal) {
    return this.raw.approveChatJoinRequest({
      chat_id,
      user_id
    }, signal);
  }
  declineChatJoinRequest(chat_id, user_id, signal) {
    return this.raw.declineChatJoinRequest({
      chat_id,
      user_id
    }, signal);
  }
  setChatPhoto(chat_id, photo, signal) {
    return this.raw.setChatPhoto({
      chat_id,
      photo
    }, signal);
  }
  deleteChatPhoto(chat_id, signal) {
    return this.raw.deleteChatPhoto({
      chat_id
    }, signal);
  }
  setChatTitle(chat_id, title5, signal) {
    return this.raw.setChatTitle({
      chat_id,
      title: title5
    }, signal);
  }
  setChatDescription(chat_id, description, signal) {
    return this.raw.setChatDescription({
      chat_id,
      description
    }, signal);
  }
  pinChatMessage(chat_id, message_id, other, signal) {
    return this.raw.pinChatMessage({
      chat_id,
      message_id,
      ...other
    }, signal);
  }
  unpinChatMessage(chat_id, message_id, signal) {
    return this.raw.unpinChatMessage({
      chat_id,
      message_id
    }, signal);
  }
  unpinAllChatMessages(chat_id, signal) {
    return this.raw.unpinAllChatMessages({
      chat_id
    }, signal);
  }
  leaveChat(chat_id, signal) {
    return this.raw.leaveChat({
      chat_id
    }, signal);
  }
  getChat(chat_id, signal) {
    return this.raw.getChat({
      chat_id
    }, signal);
  }
  getChatAdministrators(chat_id, signal) {
    return this.raw.getChatAdministrators({
      chat_id
    }, signal);
  }
  getChatMembersCount(...args) {
    return this.getChatMemberCount(...args);
  }
  getChatMemberCount(chat_id, signal) {
    return this.raw.getChatMemberCount({
      chat_id
    }, signal);
  }
  getChatMember(chat_id, user_id, signal) {
    return this.raw.getChatMember({
      chat_id,
      user_id
    }, signal);
  }
  setChatStickerSet(chat_id, sticker_set_name, signal) {
    return this.raw.setChatStickerSet({
      chat_id,
      sticker_set_name
    }, signal);
  }
  deleteChatStickerSet(chat_id, signal) {
    return this.raw.deleteChatStickerSet({
      chat_id
    }, signal);
  }
  answerCallbackQuery(callback_query_id, other, signal) {
    return this.raw.answerCallbackQuery({
      callback_query_id,
      ...other
    }, signal);
  }
  setChatMenuButton(other, signal) {
    return this.raw.setChatMenuButton({
      ...other
    }, signal);
  }
  getChatMenuButton(other, signal) {
    return this.raw.getChatMenuButton({
      ...other
    }, signal);
  }
  setMyDefaultAdministratorRights(other, signal) {
    return this.raw.setMyDefaultAdministratorRights({
      ...other
    }, signal);
  }
  getMyDefaultAdministratorRights(other, signal) {
    return this.raw.getMyDefaultAdministratorRights({
      ...other
    }, signal);
  }
  setMyCommands(commands, other, signal) {
    return this.raw.setMyCommands({
      commands,
      ...other
    }, signal);
  }
  deleteMyCommands(other, signal) {
    return this.raw.deleteMyCommands({
      ...other
    }, signal);
  }
  getMyCommands(other, signal) {
    return this.raw.getMyCommands({
      ...other
    }, signal);
  }
  editMessageText(chat_id, message_id, text, other, signal) {
    return this.raw.editMessageText({
      chat_id,
      message_id,
      text,
      ...other
    }, signal);
  }
  editMessageTextInline(inline_message_id, text, other, signal) {
    return this.raw.editMessageText({
      inline_message_id,
      text,
      ...other
    }, signal);
  }
  editMessageCaption(chat_id, message_id, other, signal) {
    return this.raw.editMessageCaption({
      chat_id,
      message_id,
      ...other
    }, signal);
  }
  editMessageCaptionInline(inline_message_id, other, signal) {
    return this.raw.editMessageCaption({
      inline_message_id,
      ...other
    }, signal);
  }
  editMessageMedia(chat_id, message_id, media, other, signal) {
    return this.raw.editMessageMedia({
      chat_id,
      message_id,
      media,
      ...other
    }, signal);
  }
  editMessageMediaInline(inline_message_id, media, other, signal) {
    return this.raw.editMessageMedia({
      inline_message_id,
      media,
      ...other
    }, signal);
  }
  editMessageReplyMarkup(chat_id, message_id, other, signal) {
    return this.raw.editMessageReplyMarkup({
      chat_id,
      message_id,
      ...other
    }, signal);
  }
  editMessageReplyMarkupInline(inline_message_id, other, signal) {
    return this.raw.editMessageReplyMarkup({
      inline_message_id,
      ...other
    }, signal);
  }
  stopPoll(chat_id, message_id, other, signal) {
    return this.raw.stopPoll({
      chat_id,
      message_id,
      ...other
    }, signal);
  }
  deleteMessage(chat_id, message_id, signal) {
    return this.raw.deleteMessage({
      chat_id,
      message_id
    }, signal);
  }
  sendSticker(chat_id, sticker, other, signal) {
    return this.raw.sendSticker({
      chat_id,
      sticker,
      ...other
    }, signal);
  }
  getStickerSet(name, signal) {
    return this.raw.getStickerSet({
      name
    }, signal);
  }
  getCustomEmojiStickers(custom_emoji_ids, signal) {
    return this.raw.getCustomEmojiStickers({
      custom_emoji_ids
    }, signal);
  }
  uploadStickerFile(user_id, png_sticker, signal) {
    return this.raw.uploadStickerFile({
      user_id,
      png_sticker
    }, signal);
  }
  createNewStickerSet(user_id, name, title6, emojis, other, signal) {
    return this.raw.createNewStickerSet({
      user_id,
      name,
      title: title6,
      emojis,
      ...other
    }, signal);
  }
  addStickerToSet(user_id, name, emojis, other, signal) {
    return this.raw.addStickerToSet({
      user_id,
      name,
      emojis,
      ...other
    }, signal);
  }
  setStickerPositionInSet(sticker, position, signal) {
    return this.raw.setStickerPositionInSet({
      sticker,
      position
    }, signal);
  }
  deleteStickerFromSet(sticker, signal) {
    return this.raw.deleteStickerFromSet({
      sticker
    }, signal);
  }
  setStickerSetThumb(name, user_id, thumb, signal) {
    return this.raw.setStickerSetThumb({
      name,
      user_id,
      thumb
    }, signal);
  }
  answerInlineQuery(inline_query_id, results, other, signal) {
    return this.raw.answerInlineQuery({
      inline_query_id,
      results,
      ...other
    }, signal);
  }
  answerWebAppQuery(web_app_query_id, result, signal) {
    return this.raw.answerWebAppQuery({
      web_app_query_id,
      result
    }, signal);
  }
  sendInvoice(chat_id, title7, description, payload, provider_token, currency, prices, other, signal) {
    return this.raw.sendInvoice({
      chat_id,
      title: title7,
      description,
      payload,
      provider_token,
      currency,
      prices,
      ...other
    }, signal);
  }
  createInvoiceLink(title8, description, payload, provider_token, currency, prices, other, signal) {
    return this.raw.createInvoiceLink({
      title: title8,
      description,
      payload,
      provider_token,
      currency,
      prices,
      ...other
    }, signal);
  }
  answerShippingQuery(shipping_query_id, ok, other, signal) {
    return this.raw.answerShippingQuery({
      shipping_query_id,
      ok,
      ...other
    }, signal);
  }
  answerPreCheckoutQuery(pre_checkout_query_id, ok, other, signal) {
    return this.raw.answerPreCheckoutQuery({
      pre_checkout_query_id,
      ok,
      ...other
    }, signal);
  }
  setPassportDataErrors(user_id, errors, signal) {
    return this.raw.setPassportDataErrors({
      user_id,
      errors
    }, signal);
  }
  sendGame(chat_id, game_short_name, other, signal) {
    return this.raw.sendGame({
      chat_id,
      game_short_name,
      ...other
    }, signal);
  }
  setGameScore(chat_id, message_id, user_id, score, other, signal) {
    return this.raw.setGameScore({
      chat_id,
      message_id,
      user_id,
      score,
      ...other
    }, signal);
  }
  setGameScoreInline(inline_message_id, user_id, score, other, signal) {
    return this.raw.setGameScore({
      inline_message_id,
      user_id,
      score,
      ...other
    }, signal);
  }
  getGameHighScores(chat_id, message_id, user_id, signal) {
    return this.raw.getGameHighScores({
      chat_id,
      message_id,
      user_id
    }, signal);
  }
  getGameHighScoresInline(inline_message_id, user_id, signal) {
    return this.raw.getGameHighScores({
      inline_message_id,
      user_id
    }, signal);
  }
};
var debug2 = browser$1("grammy:bot");
var debugErr = browser$1("grammy:error");
var Bot = class extends Composer {
  pollingRunning;
  pollingAbortController;
  lastTriedUpdateId;
  api;
  me;
  mePromise;
  clientConfig;
  ContextConstructor;
  errorHandler;
  constructor(token, config4) {
    super();
    this.token = token;
    this.pollingRunning = false;
    this.lastTriedUpdateId = 0;
    this.errorHandler = async (err) => {
      console.error("Error in middleware while handling update", err.ctx?.update?.update_id, err.error);
      console.error("No error handler was set!");
      console.error("Set your own error handler with `bot.catch = ...`");
      if (this.pollingRunning) {
        console.error("Stopping bot");
        await this.stop();
      }
      throw err;
    };
    if (!token)
      throw new Error("Empty token!");
    this.me = config4?.botInfo;
    this.clientConfig = config4?.client;
    this.ContextConstructor = config4?.ContextConstructor ?? Context;
    this.api = new Api(token, this.clientConfig);
  }
  set botInfo(botInfo) {
    this.me = botInfo;
  }
  get botInfo() {
    if (this.me === void 0) {
      throw new Error("Bot information unavailable! Make sure to call `await bot.init()` before accessing `bot.botInfo`!");
    }
    return this.me;
  }
  isInited() {
    return this.me !== void 0;
  }
  async init() {
    if (!this.isInited()) {
      debug2("Initializing bot");
      this.mePromise ??= withRetries(() => this.api.getMe());
      let me;
      try {
        me = await this.mePromise;
      } finally {
        this.mePromise = void 0;
      }
      if (this.me === void 0)
        this.me = me;
      else
        debug2("Bot info was set by now, will not overwrite");
    }
    debug2(`I am ${this.me.username}!`);
  }
  async handleUpdates(updates) {
    for (const update of updates) {
      this.lastTriedUpdateId = update.update_id;
      try {
        await this.handleUpdate(update);
      } catch (err) {
        if (err instanceof BotError) {
          await this.errorHandler(err);
        } else {
          console.error("FATAL: grammY unable to handle:", err);
          throw err;
        }
      }
    }
  }
  async handleUpdate(update, webhookReplyEnvelope) {
    if (this.me === void 0) {
      throw new Error("Bot not initialized! Either call `await bot.init()`, or directly set the `botInfo` option in the `Bot` constructor to specify a known bot info object.");
    }
    debug2(`Processing update ${update.update_id}`);
    const api = new Api(this.token, this.clientConfig, webhookReplyEnvelope);
    const t = this.api.config.installedTransformers();
    if (t.length > 0)
      api.config.use(...t);
    const ctx = new this.ContextConstructor(update, api, this.me);
    try {
      await run(this.middleware(), ctx);
    } catch (err) {
      debugErr(`Error in middleware for update ${update.update_id}`);
      throw new BotError(err, ctx);
    }
  }
  async start(options) {
    if (!this.isInited())
      await this.init();
    if (this.pollingRunning) {
      debug2("Simple long polling already running!");
      return;
    }
    await withRetries(() => this.api.deleteWebhook({
      drop_pending_updates: options?.drop_pending_updates
    }));
    await options?.onStart?.(this.botInfo);
    this.use = () => {
      throw new Error(`It looks like you are registering more listeners on your bot from within other listeners! This means that every time your bot handles a message like this one, new listeners will be added. This list grows until your machine crashes, so grammY throws this error to tell you that you should probably do things a bit differently. If you're unsure how to resolve this problem, you can ask in the group chat: https://telegram.me/grammyjs

On the other hand, if you actually know what you're doing and you do need to install further middleware while your bot is running, consider installing a composer instance on your bot, and in turn augment the composer after the fact. This way, you can circumvent this protection against memory leaks.`);
    };
    debug2("Starting simple long polling");
    await this.loop(options);
    debug2("Middleware is done running");
  }
  async stop() {
    if (this.pollingRunning) {
      debug2("Stopping bot, saving update offset");
      this.pollingRunning = false;
      this.pollingAbortController?.abort();
      const offset = this.lastTriedUpdateId + 1;
      await this.api.getUpdates({
        offset,
        limit: 1
      });
      this.pollingAbortController = void 0;
    } else {
      debug2("Bot is not running!");
    }
  }
  catch(errorHandler) {
    this.errorHandler = errorHandler;
  }
  async loop(options) {
    this.pollingRunning = true;
    this.pollingAbortController = new AbortController();
    const limit = options?.limit;
    const timeout = options?.timeout ?? 30;
    let allowed_updates = options?.allowed_updates;
    while (this.pollingRunning) {
      const updates = await this.fetchUpdates({
        limit,
        timeout,
        allowed_updates
      });
      if (updates === void 0)
        break;
      await this.handleUpdates(updates);
      allowed_updates = void 0;
    }
  }
  async fetchUpdates({ limit, timeout, allowed_updates }) {
    const offset = this.lastTriedUpdateId + 1;
    let updates = void 0;
    do {
      try {
        updates = await this.api.getUpdates({
          offset,
          limit,
          timeout,
          allowed_updates
        }, this.pollingAbortController?.signal);
      } catch (error) {
        await this.handlePollingError(error);
      }
    } while (updates === void 0 && this.pollingRunning);
    return updates;
  }
  async handlePollingError(error) {
    if (!this.pollingRunning) {
      debug2("Pending getUpdates request cancelled");
      return;
    }
    let sleepSeconds = 3;
    if (error instanceof GrammyError) {
      debugErr(error.message);
      if (error.error_code === 401) {
        debugErr("Make sure you are using the bot token you obtained from @BotFather (https://t.me/BotFather).");
        throw error;
      } else if (error.error_code === 409) {
        debugErr("Consider revoking the bot token if you believe that no other instance is running.");
        throw error;
      } else if (error.error_code === 429) {
        debugErr("Bot API server is closing.");
        sleepSeconds = error.parameters.retry_after ?? sleepSeconds;
      }
    } else
      debugErr(error);
    debugErr(`Call to getUpdates failed, retrying in ${sleepSeconds} seconds ...`);
    await sleep(sleepSeconds);
  }
  token;
};
async function withRetries(task) {
  let result = {
    ok: false
  };
  while (!result.ok) {
    try {
      result = {
        ok: true,
        value: await task()
      };
    } catch (error) {
      debugErr(error);
      if (error instanceof HttpError)
        continue;
      if (error instanceof GrammyError) {
        if (error.error_code >= 500)
          continue;
        if (error.error_code === 429) {
          const retryAfter = error.parameters.retry_after;
          if (retryAfter !== void 0)
            await sleep(retryAfter);
          continue;
        }
      }
      throw error;
    }
  }
  return result.value;
}
function sleep(seconds) {
  return new Promise((r6) => setTimeout(r6, 1e3 * seconds));
}
var debug3 = browser$1("grammy:session");
var SECRET_HEADER = "X-Telegram-Bot-Api-Secret-Token";
var express = (req, res) => ({
  update: Promise.resolve(req.body),
  header: req.header(SECRET_HEADER),
  end: () => res.end(),
  respond: (json) => {
    res.set("Content-Type", "application/json");
    res.send(json);
  },
  unauthorized: () => {
    res.send(401, "secret token is wrong");
  }
});
var koa = (ctx) => ({
  update: Promise.resolve(ctx.request.body),
  header: ctx.get(SECRET_HEADER),
  end: () => {
    ctx.body = "";
  },
  respond: (json) => {
    ctx.set("Content-Type", "application/json");
    ctx.response.body = json;
  },
  unauthorized: () => {
    ctx.status = 401;
  }
});
var fastify = (req, reply) => ({
  update: Promise.resolve(req.body),
  header: req.headers[SECRET_HEADER.toLowerCase()],
  end: () => reply.status(200).send(),
  respond: (json) => reply.send(json),
  unauthorized: () => reply.code(401).send("secret token is wrong")
});
var adapters = {
  express,
  koa,
  fastify
};
var stdHttp = (req) => {
  let resolveResponse;
  return {
    update: req.json(),
    header: req.headers.get(SECRET_HEADER) || void 0,
    end: () => {
      if (resolveResponse)
        resolveResponse(new Response());
    },
    respond: (json) => {
      if (resolveResponse) {
        const res = new Response(json, {
          headers: {
            "Content-Type": "application/json"
          }
        });
        resolveResponse(res);
      }
    },
    unauthorized: () => {
      if (resolveResponse) {
        const res = new Response("secret token is wrong", {
          status: 401
        });
        resolveResponse(res);
      }
    },
    handlerReturn: new Promise((resolve3) => {
      resolveResponse = resolve3;
    })
  };
};
var oak = (ctx) => ({
  update: ctx.request.body({
    type: "json"
  }).value,
  header: ctx.request.headers.get(SECRET_HEADER) || void 0,
  end: () => ctx.response.status = 200,
  respond: (json) => {
    ctx.response.type = "json";
    ctx.response.body = json;
  },
  unauthorized: () => {
    ctx.response.status = 401;
  }
});
var serveHttp = (requestEvent) => ({
  update: requestEvent.request.json(),
  header: requestEvent.request.headers.get(SECRET_HEADER) || void 0,
  end: () => requestEvent.respondWith(new Response(void 0, {
    status: 200
  })),
  respond: (json) => requestEvent.respondWith(new Response(JSON.stringify(json), {
    status: 200
  })),
  unauthorized: () => requestEvent.respondWith(new Response('"unauthorized"', {
    status: 401,
    statusText: "secret token is wrong"
  }))
});
var adapters1 = {
  "std/http": stdHttp,
  oak,
  serveHttp,
  ...adapters
};
var defaultAdapter = "oak";
var debugErr1 = browser$1("grammy:error");
var callbackAdapter = (update, callback, header, unauthorized = () => callback('"unauthorized"')) => ({
  update: Promise.resolve(update),
  respond: callback,
  header,
  unauthorized
});
var adapters2 = {
  ...adapters1,
  callback: callbackAdapter
};
function webhookCallback(bot, adapter = defaultAdapter, onTimeout = "throw", timeoutMilliseconds = 1e4, secretToken) {
  const { onTimeout: timeout = "throw", timeoutMilliseconds: ms1 = 1e4, secretToken: token } = typeof onTimeout === "object" ? onTimeout : {
    onTimeout,
    timeoutMilliseconds,
    secretToken
  };
  let initialized = false;
  const server = typeof adapter === "string" ? adapters2[adapter] : adapter;
  return async (...args) => {
    if (!initialized) {
      await bot.init();
      initialized = true;
    }
    const { update, respond, unauthorized, end, handlerReturn, header } = server(...args);
    if (header !== token) {
      await unauthorized();
      console.log(handlerReturn);
      return handlerReturn;
    }
    let usedWebhookReply = false;
    const webhookReplyEnvelope = {
      async send(json) {
        usedWebhookReply = true;
        await respond(json);
      }
    };
    await timeoutIfNecessary(bot.handleUpdate(await update, webhookReplyEnvelope), typeof timeout === "function" ? () => timeout(...args) : timeout, ms1);
    if (!usedWebhookReply)
      end?.();
    return handlerReturn;
  };
}
function timeoutIfNecessary(task, onTimeout, timeout) {
  if (timeout === Infinity)
    return task;
  return new Promise((resolve4, reject) => {
    const handle = setTimeout(() => {
      if (onTimeout === "throw") {
        reject(new Error(`Request timed out after ${timeout} ms`));
      } else {
        if (typeof onTimeout === "function")
          onTimeout();
        resolve4();
      }
      const now = Date.now();
      task.finally(() => {
        const diff = Date.now() - now;
        debugErr1(`Request completed ${diff} ms after timeout!`);
      });
    }, timeout);
    task.then(resolve4).catch(reject).finally(() => clearTimeout(handle));
  });
}

// functions/bot.js
async function onRequestPost(context) {
  var { request } = context;
  var url = new URL(request.url);
  var { pathname } = url;
  pathname = pathname.replace("/", "");
  const params = {};
  const queryString = url.search.slice(1).split("&");
  queryString.forEach((item) => {
    const [key, value] = item.split("=");
    if (key)
      params[key] = value || true;
  });
  if (params.t)
    globalThis.TOKEN = params.t;
  try {
    var bot = new Bot(TOKEN);
    bot.use(async (ctx, next) => {
      console.info(ctx);
      await next();
    });
    bot.command("set", (ctx) => ctx.reply("Welcome! ZAluppa"));
    const handleUpdate = webhookCallback(bot, "std/http");
    await handleUpdate(request);
  } catch (err) {
    console.warn(err);
  }
  return new Response({ status: 200 });
}

// static-assets/index.html
var static_assets_default = "<!DOCTYPE html>\n<html>\n	<head>\n		<title>Static asset</title>\n	</head>\n	<body>\n		<h1>Hello from an imported static asset!</h1>\n	</body>\n</html>\n";

// functions/import-html.ts
var onRequestGet4 = () => {
  return new Response(static_assets_default, { headers: { "Content-Type": "text/html" } });
};

// functions/date.ts
var onRequest = () => {
  return new Response(new Date().toISOString());
};

// functions/intercept.ts
var onRequest2 = async ({ next }) => {
  const response = await next();
  return new Response(response.body, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      "x-set-from-functions": "true"
    }
  });
};

// node_modules/88b/index.js
async function onRequest3({ request, next }) {
  const response = await next();
  if (response.status !== 200) {
    console.log(`${request.url} returned (${response.status}), skipping`);
    return response;
  }
  const contentType = response.headers.get("content-type");
  if (!contentType.includes("text/html") || contentType === null) {
    return response;
  }
  const links = [];
  class ElementHandler {
    element(element) {
      const url = element.getAttribute("href");
      const rel = element.getAttribute("rel");
      const as = element.getAttribute("as");
      if (url && !url.startsWith("data:") && !url.startsWith("http")) {
        links.push({ url, rel, as });
      }
    }
  }
  const addwithRewriter = new HTMLRewriter().on("link[rel=preconnect],link[rel=preload]", new ElementHandler()).transform(response);
  const body = await addwithRewriter.text();
  const headers = new Headers(addwithRewriter.headers);
  links.forEach(({ url, rel, as }) => {
    let link = `<${url}>; rel="${rel}"`;
    if (as) {
      link += `; as=${as}`;
    }
    headers.append("Link", link);
  });
  return new Response(body, { ...response, headers });
}
var routes2 = [
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest3],
    modules: []
  }
];
function lexer(str2) {
  var tokens = [];
  var i2 = 0;
  while (i2 < str2.length) {
    var char = str2[i2];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i2, value: str2[i2++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i2++, value: str2[i2++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i2, value: str2[i2++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i2, value: str2[i2++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i2 + 1;
      while (j < str2.length) {
        var code = str2.charCodeAt(j);
        if (code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122 || code === 95) {
          name += str2[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i2));
      tokens.push({ type: "NAME", index: i2, value: name });
      i2 = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i2 + 1;
      if (str2[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str2.length) {
        if (str2[j] === "\\") {
          pattern += str2[j++] + str2[j++];
          continue;
        }
        if (str2[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str2[j] === "(") {
          count++;
          if (str2[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str2[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i2));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i2));
      tokens.push({ type: "PATTERN", index: i2, value: pattern });
      i2 = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i2, value: str2[i2++] });
  }
  tokens.push({ type: "END", index: i2, value: "" });
  return tokens;
}
function parse5(str2, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str2);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a;
  var defaultPattern = "[^".concat(escapeString(options.delimiter || "/#?"), "]+?");
  var result = [];
  var key = 0;
  var i2 = 0;
  var path2 = "";
  var tryConsume = function(type) {
    if (i2 < tokens.length && tokens[i2].type === type)
      return tokens[i2++].value;
  };
  var mustConsume = function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i2], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  };
  var consumeText = function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  };
  while (i2 < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path2 += prefix;
        prefix = "";
      }
      if (path2) {
        result.push(path2);
        path2 = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || defaultPattern,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path2 += value;
      continue;
    }
    if (path2) {
      result.push(path2);
      path2 = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
function match2(str2, options) {
  var keys = [];
  var re = pathToRegexp(str2, keys, options);
  return regexpToFunction(re, keys, options);
}
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x2) {
    return x2;
  } : _a;
  return function(pathname) {
    var m2 = re.exec(pathname);
    if (!m2)
      return false;
    var path2 = m2[0], index = m2.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = function(i22) {
      if (m2[i22] === void 0)
        return "continue";
      var key = keys[i22 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m2[i22].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m2[i22], key);
      }
    };
    for (var i2 = 1; i2 < m2.length; i2++) {
      _loop_1(i2);
    }
    return { path: path2, index, params };
  };
}
function escapeString(str2) {
  return str2.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
function regexpToRegexp(path2, keys) {
  if (!keys)
    return path2;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path2.source);
  while (execResult) {
    keys.push({
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path2.source);
  }
  return path2;
}
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path2) {
    return pathToRegexp(path2, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
function stringToRegexp(path2, keys, options) {
  return tokensToRegexp(parse5(path2, options), keys, options);
}
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x2) {
    return x2;
  } : _d, _e = options.delimiter, delimiter3 = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter3), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod2 = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod2);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            route += "((?:".concat(token.pattern, ")").concat(token.modifier, ")");
          } else {
            route += "(".concat(token.pattern, ")").concat(token.modifier);
          }
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
function pathToRegexp(path2, keys, options) {
  if (path2 instanceof RegExp)
    return regexpToRegexp(path2, keys);
  if (Array.isArray(path2))
    return arrayToRegexp(path2, keys, options);
  return stringToRegexp(path2, keys, options);
}
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request, relativePathname) {
  for (const route of [...routes2].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match2(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match2(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(relativePathname);
    const mountMatchResult = mountMatcher(relativePathname);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes2) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match2(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match2(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(relativePathname);
    const mountMatchResult = mountMatcher(relativePathname);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
function pages_template_plugin_default(pluginArgs) {
  const onRequest22 = async (workerContext) => {
    let { request } = workerContext;
    const { env, next, data } = workerContext;
    const url = new URL(request.url);
    const relativePathname = `/${url.pathname.split(workerContext.functionPath)[1] || ""}`.replace(/^\/\//, "/");
    const handlerIterator = executeRequest(request, relativePathname);
    const pluginNext = async (input, init) => {
      if (input !== void 0) {
        request = new Request(input, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path: path2 } = result.value;
        const context = {
          request,
          functionPath: workerContext.functionPath + path2,
          next: pluginNext,
          params,
          data,
          pluginArgs,
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext)
        };
        const response = await handler(context);
        return new Response(
          [101, 204, 205, 304].includes(response.status) ? null : response.body,
          { ...response, headers: new Headers(response.headers) }
        );
      } else {
        return next();
      }
    };
    return pluginNext();
  };
  return onRequest22;
}

// functions/l/_middleware.ts
var onRequest4 = pages_template_plugin_default({ footerText: "Set from a Plugin!" });

// functions/next.ts
var onRequest5 = ({ next }) => next("/some-asset.html");

// assets:/home/projects/hepg/static-assets
var onRequest6 = ({ request, env, functionPath }) => {
  const url = new URL(request.url);
  const relativePathname = `/${url.pathname.split(functionPath)[1] || ""}`.replace(/^\/\//, "/");
  url.pathname = "/cdn-cgi/pages-plugins/jjlx_B5ejH1CC-NOzXsmK" + relativePathname;
  request = new Request(url.toString(), request);
  return env.ASSETS.fetch(request);
};

// functions/variables.ts
var onRequest7 = ({ env }) => {
  return new Response(JSON.stringify(env), {
    headers: { "Content-Type": "application/json" }
  });
};

// functions/_middleware.ts
var onRequest8 = async ({ next }) => {
  const response = await next();
  response.headers.set("x-custom", "header value");
  return response;
};

// ../../../tmp/functionsRoutes-0.3957832668912724.mjs
var routes = [
  {
    routePath: "/r2/create",
    mountPath: "/r2",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/r2/get",
    mountPath: "/r2",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/regex_chars/my-file",
    mountPath: "/regex_chars",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/i/:slug",
    mountPath: "/i",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/bot",
    mountPath: "/",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/import-html",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/date",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/intercept",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/l",
    mountPath: "/l",
    method: "",
    middlewares: [onRequest4],
    modules: []
  },
  {
    routePath: "/next",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/static",
    mountPath: "/static",
    method: "",
    middlewares: [onRequest6],
    modules: []
  },
  {
    routePath: "/variables",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest8],
    modules: []
  }
];

// ../../.turbo/npx/ddryHs/node_modules/path-to-regexp/dist.es2015/index.js
function lexer2(str2) {
  var tokens = [];
  var i2 = 0;
  while (i2 < str2.length) {
    var char = str2[i2];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i2, value: str2[i2++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i2++, value: str2[i2++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i2, value: str2[i2++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i2, value: str2[i2++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i2 + 1;
      while (j < str2.length) {
        var code = str2.charCodeAt(j);
        if (code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122 || code === 95) {
          name += str2[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i2));
      tokens.push({ type: "NAME", index: i2, value: name });
      i2 = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i2 + 1;
      if (str2[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str2.length) {
        if (str2[j] === "\\") {
          pattern += str2[j++] + str2[j++];
          continue;
        }
        if (str2[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str2[j] === "(") {
          count++;
          if (str2[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str2[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i2));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i2));
      tokens.push({ type: "PATTERN", index: i2, value: pattern });
      i2 = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i2, value: str2[i2++] });
  }
  tokens.push({ type: "END", index: i2, value: "" });
  return tokens;
}
function parse6(str2, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer2(str2);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a;
  var defaultPattern = "[^".concat(escapeString2(options.delimiter || "/#?"), "]+?");
  var result = [];
  var key = 0;
  var i2 = 0;
  var path2 = "";
  var tryConsume = function(type) {
    if (i2 < tokens.length && tokens[i2].type === type)
      return tokens[i2++].value;
  };
  var mustConsume = function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i2], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  };
  var consumeText = function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  };
  while (i2 < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path2 += prefix;
        prefix = "";
      }
      if (path2) {
        result.push(path2);
        path2 = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || defaultPattern,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path2 += value;
      continue;
    }
    if (path2) {
      result.push(path2);
      path2 = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
function match3(str2, options) {
  var keys = [];
  var re = pathToRegexp2(str2, keys, options);
  return regexpToFunction2(re, keys, options);
}
function regexpToFunction2(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x2) {
    return x2;
  } : _a;
  return function(pathname) {
    var m2 = re.exec(pathname);
    if (!m2)
      return false;
    var path2 = m2[0], index = m2.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = function(i3) {
      if (m2[i3] === void 0)
        return "continue";
      var key = keys[i3 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m2[i3].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m2[i3], key);
      }
    };
    for (var i2 = 1; i2 < m2.length; i2++) {
      _loop_1(i2);
    }
    return { path: path2, index, params };
  };
}
function escapeString2(str2) {
  return str2.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
function flags2(options) {
  return options && options.sensitive ? "" : "i";
}
function regexpToRegexp2(path2, keys) {
  if (!keys)
    return path2;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path2.source);
  while (execResult) {
    keys.push({
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path2.source);
  }
  return path2;
}
function arrayToRegexp2(paths, keys, options) {
  var parts = paths.map(function(path2) {
    return pathToRegexp2(path2, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags2(options));
}
function stringToRegexp2(path2, keys, options) {
  return tokensToRegexp2(parse6(path2, options), keys, options);
}
function tokensToRegexp2(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x2) {
    return x2;
  } : _d, _e = options.delimiter, delimiter3 = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString2(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString2(delimiter3), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString2(encode(token));
    } else {
      var prefix = escapeString2(encode(token.prefix));
      var suffix = escapeString2(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod2 = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod2);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            route += "((?:".concat(token.pattern, ")").concat(token.modifier, ")");
          } else {
            route += "(".concat(token.pattern, ")").concat(token.modifier);
          }
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags2(options));
}
function pathToRegexp2(path2, keys, options) {
  if (path2 instanceof RegExp)
    return regexpToRegexp2(path2, keys);
  if (Array.isArray(path2))
    return arrayToRegexp2(path2, keys, options);
  return stringToRegexp2(path2, keys, options);
}

// ../../.turbo/npx/ddryHs/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex2 = /[.+?^${}()|[\]\\]/g;
function* executeRequest2(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match3(route.routePath.replace(escapeRegex2, "\\$&"), {
      end: false
    });
    const mountMatcher = match3(route.mountPath.replace(escapeRegex2, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match3(route.routePath.replace(escapeRegex2, "\\$&"), {
      end: true
    });
    const mountMatcher = match3(route.mountPath.replace(escapeRegex2, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
var pages_template_worker_default = {
  async fetch(request, env, workerContext) {
    const handlerIterator = executeRequest2(request);
    const data = {};
    const next = async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path: path2 } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path2,
          next,
          params,
          data,
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext)
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    };
    try {
      return next();
    } catch (err) {
      return new Response("Internal Error", { status: 500 });
    }
  }
};
var cloneResponse = (response) => new Response(
  [101, 204, 205, 304].includes(response.status) ? null : response.body,
  response
);
export {
  pages_template_worker_default as default
};
