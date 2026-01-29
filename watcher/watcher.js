const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// === CONFIG ===
// === CONFIGURE THESE PATHS ===
const STATE_FILE = process.env.STATE_FILE || path.join(__dirname, 'state.json');
const SESSIONS_FILE = process.env.SESSIONS_FILE || path.join(process.env.HOME, '.clawdbot/agents/main/sessions/sessions.json');
const POLL_INTERVAL = 50; // 50ms for snappier response
const IDLE_TIMEOUT = 6000; // 6s before going idle

// === STATE ===
let currentState = 'idle';
let currentActivity = '';
let lastStateChange = Date.now();
let lastJsonlSize = 0;
let lastJsonlMod = 0;

// === DETAILED TOOL MAPPING ===
const TOOL_STATES = {
  // Execution
  'exec': { state: 'working', activity: 'Running commands...' },
  'process': { state: 'working', activity: 'Managing processes...' },
  
  // File operations
  'Write': { state: 'focused', activity: 'Writing code...' },
  'write': { state: 'focused', activity: 'Writing code...' },
  'Edit': { state: 'focused', activity: 'Editing code...' },
  'edit': { state: 'focused', activity: 'Editing code...' },
  'Read': { state: 'curious', activity: 'Reading...' },
  'read': { state: 'curious', activity: 'Reading...' },
  
  // Web
  'web_search': { state: 'curious', activity: 'Searching...' },
  'web_fetch': { state: 'curious', activity: 'Reading webpage...' },
  'browser': { state: 'focused', activity: 'Browsing...' },
  
  // Communication
  'message': { state: 'talking', activity: 'Messaging...' },
  'tts': { state: 'talking', activity: 'Speaking...' },
  
  // Memory
  'memory_search': { state: 'thinking', activity: 'Remembering...' },
  'memory_get': { state: 'curious', activity: 'Recalling...' },
  
  // Other
  'cron': { state: 'working', activity: 'Scheduling...' },
  'image': { state: 'curious', activity: 'Looking at image...' },
  'canvas': { state: 'focused', activity: 'Drawing...' },
  'nodes': { state: 'working', activity: 'Checking nodes...' },
  'gateway': { state: 'working', activity: 'System stuff...' },
  'sessions_spawn': { state: 'thinking', activity: 'Spawning agent...' },
  'sessions_send': { state: 'talking', activity: 'Talking to agent...' },
};

// === HELPERS ===
function setState(state, activity = '') {
  const now = Date.now();
  
  // Debounce rapid idle transitions - wait longer before going idle
  if (state === 'idle' && currentState !== 'idle' && now - lastStateChange < 2500) {
    return;
  }
  
  if (state === currentState && activity === currentActivity) return;
  
  currentState = state;
  currentActivity = activity;
  lastStateChange = now;
  
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ 
      state, 
      activity, 
      updated: new Date().toISOString() 
    }));
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    console.log(`[${time}] ${state.padEnd(12)} ${activity || '—'}`);
  } catch (e) {}
}

function getSessionFile() {
  try {
    const sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    const main = sessions['agent:main:main'];
    return main?.sessionFile || null;
  } catch (e) {
    return null;
  }
}

function analyzeContent(entry) {
  const msg = entry.message;
  if (!msg) return null;

  // === USER MESSAGE === 
  if (msg.role === 'user') {
    const text = typeof msg.content === 'string' 
      ? msg.content 
      : Array.isArray(msg.content) 
        ? (msg.content.find(c => c.type === 'text')?.text || '') 
        : '';
    
    // Truncate for display
    const preview = text.slice(0, 50).replace(/\n/g, ' ').trim();
    return { 
      state: 'listening', 
      activity: preview ? `"${preview}${text.length > 50 ? '...' : ''}"` : 'Listening...' 
    };
  }

  // === ASSISTANT MESSAGE ===
  if (msg.role === 'assistant') {
    const content = Array.isArray(msg.content) ? msg.content : [];
    
    // Check for thinking blocks FIRST (highest priority)
    const thinking = content.find(c => c.type === 'thinking');
    if (thinking && thinking.thinking) {
      const preview = thinking.thinking.slice(0, 40).replace(/\n/g, ' ').trim();
      return { state: 'thinking', activity: preview ? `${preview}...` : 'Thinking...' };
    }
    
    // Check for tool calls
    const toolCalls = content.filter(c => c.type === 'toolCall');
    if (toolCalls.length > 0) {
      const tool = toolCalls[0];
      const toolName = tool.name;
      
      // Get base state for tool
      const info = TOOL_STATES[toolName] || { state: 'working', activity: `Using ${toolName}...` };
      
      // Try to extract more specific info from args
      if (tool.input) {
        try {
          const args = typeof tool.input === 'string' ? JSON.parse(tool.input) : tool.input;
          
          // File operations - show filename
          if (['Write', 'write', 'Edit', 'edit', 'Read', 'read'].includes(toolName)) {
            const filePath = args.path || args.file_path || '';
            const filename = filePath.split('/').pop();
            if (filename) {
              return { state: info.state, activity: `${info.activity.replace('...', '')} ${filename}...` };
            }
          }
          
          // Exec - show command preview
          if (toolName === 'exec' && args.command) {
            const cmd = args.command.slice(0, 30).replace(/\n/g, ' ');
            return { state: 'working', activity: `$ ${cmd}${args.command.length > 30 ? '...' : ''}` };
          }
          
          // Web search - show query
          if (toolName === 'web_search' && args.query) {
            return { state: 'curious', activity: `Searching "${args.query.slice(0, 25)}..."` };
          }
          
          // Web fetch - show domain
          if (toolName === 'web_fetch' && args.url) {
            try {
              const domain = new URL(args.url).hostname;
              return { state: 'curious', activity: `Reading ${domain}...` };
            } catch {}
          }
          
          // Browser
          if (toolName === 'browser') {
            const action = args.action || 'browsing';
            return { state: 'focused', activity: `Browser: ${action}...` };
          }
        } catch (e) {}
      }
      
      return info;
    }
    
    // Text response = talking
    const textContent = content.find(c => c.type === 'text');
    if (textContent?.text) {
      // Check if it's a short response or long
      const text = textContent.text;
      const preview = text.slice(0, 40).replace(/\n/g, ' ').trim();
      
      if (text.length < 100) {
        return { state: 'talking', activity: preview };
      } else {
        return { state: 'talking', activity: `${preview}...` };
      }
    }
  }

  // === TOOL RESULT ===
  if (msg.role === 'toolResult') {
    const toolName = msg.toolName || 'tool';
    return { state: 'processing', activity: `Processing ${toolName}...` };
  }

  return null;
}

function check() {
  const sessionFile = getSessionFile();
  
  if (!sessionFile || !fs.existsSync(sessionFile)) {
    if (currentState !== 'idle') setState('idle');
    return;
  }

  try {
    const stat = fs.statSync(sessionFile);
    const now = Date.now();
    const timeSinceChange = now - stat.mtimeMs;
    
    // File changed?
    if (stat.mtimeMs > lastJsonlMod || stat.size !== lastJsonlSize) {
      lastJsonlMod = stat.mtimeMs;
      lastJsonlSize = stat.size;
      
      // Read last few lines for context
      const content = execSync(`tail -3 "${sessionFile}" 2>/dev/null`, { 
        encoding: 'utf8', 
        timeout: 200 
      });
      
      // Parse most recent valid entry
      const lines = content.trim().split('\n').reverse();
      for (const line of lines) {
        if (line.trim().startsWith('{')) {
          try {
            const entry = JSON.parse(line.trim());
            const result = analyzeContent(entry);
            if (result) {
              setState(result.state, result.activity);
              return;
            }
          } catch (e) {}
        }
      }
    }
    
    // No changes for a while = idle
    if (timeSinceChange > IDLE_TIMEOUT && currentState !== 'idle') {
      setState('idle');
    }
    
  } catch (e) {
    // Error reading = go idle
    if (currentState !== 'idle') setState('idle');
  }
}

// === STARTUP ===
console.log('');
console.log('🤖 Claude Face Watcher v6');
console.log('─'.repeat(40));
console.log(`   Poll: ${POLL_INTERVAL}ms | Idle: ${IDLE_TIMEOUT}ms`);
console.log('─'.repeat(40));
console.log('');

setState('idle', '', true);
setInterval(check, POLL_INTERVAL);

process.on('SIGINT', () => {
  console.log('\n👋 Bye!');
  process.exit(0);
});
