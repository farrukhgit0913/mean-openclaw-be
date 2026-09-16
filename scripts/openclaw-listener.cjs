const WebSocket = require('ws');
const crypto = require('node:crypto');

const gatewayUrl =
  'ws://127.0.0.1:18789';

const backendUrl =
  process.env.BACKEND_URL ||
  'http://localhost:3000';

const token =
  process.env.OPENCLAW_API_KEY;

const selfNumber =
  process.env.OPENCLAW_WHATSAPP_SELF_NUMBER;

if (!token) {
  throw new Error(
    'OPENCLAW_API_KEY is not available in the environment.'
  );
}

if (!selfNumber) {
  throw new Error(
    'OPENCLAW_WHATSAPP_SELF_NUMBER is not available in the environment.'
  );
}

const ws =
  new WebSocket(gatewayUrl);

function send(
  method,
  params = {}
) {
  const id =
    crypto.randomUUID();

  ws.send(
    JSON.stringify({
      type: 'req',
      id,
      method,
      params
    })
  );

  return id;
}

async function forwardInboundMessage(
  payload
) {
  const message =
    payload?.message;

  const openClaw =
    message?.__openclaw;

  const transport =
    openClaw?.transport;

  /**
   * We only want human/user messages.
   *
   * Do not use senderIsOwner here.
   */
  if (
    message?.role !== 'user'
  ) {
    return;
  }

  /**
   * Only WhatsApp.
   */
  if (
    transport?.channel !==
    'whatsapp'
  ) {
    return;
  }

  const content =
    typeof message.content ===
    'string'
      ? message.content.trim()
      : '';

  if (!content) {
    return;
  }

  const normalized = {
    direction: 'inbound',

    from:
      openClaw?.senderId ??
      payload?.session?.origin?.from ??
      null,

    to:
      selfNumber,

    message:
      content,

    timestamp:
      message?.timestamp ??
      Date.now(),

    messageId:
      transport?.messageId ??
      payload?.messageId ??
      null,

    senderName:
      openClaw?.senderName ??
      null,

    sessionKey:
      payload?.sessionKey ??
      null,

    channel:
      'whatsapp'
  };

  if (!normalized.from) {
    console.warn(
      'Skipping message: sender number not found.'
    );

    return;
  }

  console.log(
    '\n========================================'
  );

  console.log(
    'INBOUND WHATSAPP MESSAGE'
  );

  console.log(
    '========================================'
  );

  console.log(
    JSON.stringify(
      normalized,
      null,
      2
    )
  );

  try {
    const response =
      await fetch(
        `${backendUrl}/api/openclaw/whatsapp/inbound`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify(payload)
        }
      );

    const responseText =
      await response.text();

    if (!response.ok) {
      throw new Error(
        `Backend returned ${response.status}: ${responseText}`
      );
    }

    console.log(
      'Backend accepted inbound WhatsApp message.'
    );

    console.log(
      responseText
    );
  } catch (error) {
    console.error(
      'Failed to forward inbound WhatsApp message:',
      error
    );
  }
}

ws.on(
  'open',
  () => {
    console.log(
      'WebSocket connected.'
    );
  }
);

ws.on(
  'message',
  (raw) => {
    let frame;

    try {
      frame =
        JSON.parse(
          raw.toString()
        );
    } catch (error) {
      console.error(
        'Invalid Gateway JSON:',
        error
      );

      return;
    }

    /**
     * Gateway challenge.
     */
    if (
      frame.type === 'event' &&
      frame.event ===
        'connect.challenge'
    ) {
      console.log(
        'Received Gateway challenge.'
      );

      send(
        'connect',
        {
          minProtocol: 4,

          maxProtocol: 4,

          client: {
            id:
              'gateway-client',

            version:
              '1.0.0',

            platform:
              'macos',

            mode:
              'backend'
          },

          role:
            'operator',

          scopes: [
            'operator.read'
          ],

          caps: [],

          commands: [],

          permissions: {},

          auth: {
            token
          },

          locale:
            'en-US',

          userAgent:
            'mean-openclaw-listener/1.0.0'
        }
      );

      return;
    }

    /**
     * Gateway handshake completed.
     */
    if (
      frame.type === 'res' &&
      frame.ok === true &&
      frame.payload?.type ===
        'hello-ok'
    ) {
      console.log(
        '\nGateway handshake successful.'
      );

      send(
        'sessions.subscribe',
        {
          limit: 60,
          ownerFirst: true
        }
      );

      return;
    }

    /**
     * Sessions subscription completed.
     */
    if (
      frame.type === 'res' &&
      frame.ok === true &&
      frame.payload?.subscribed ===
        true &&
      frame.payload?.list
    ) {
      const sessions =
        frame.payload.list.sessions ??
        [];

      console.log(
        `\nSubscribed to sessions. Found ${sessions.length} session(s).`
      );

      for (
        const session of sessions
      ) {
        console.log(
          `Subscribing to messages for: ${session.key}`
        );

        send(
          'sessions.messages.subscribe',
          {
            key:
              session.key
          }
        );
      }

      return;
    }

    /**
     * THIS is the important event.
     *
     * The actual WhatsApp message
     * is already inside:
     *
     * frame.payload.message.content
     */
    if (
      frame.type === 'event' &&
      frame.event ===
        'session.message'
    ) {
      void forwardInboundMessage(
        frame.payload
      );

      return;
    }
  }
);

ws.on(
  'error',
  (error) => {
    console.error(
      'WebSocket error:',
      error
    );
  }
);

ws.on(
  'close',
  (code, reason) => {
    console.log(
      `WebSocket closed: ${code} ${reason.toString()}`
    );
  }
);